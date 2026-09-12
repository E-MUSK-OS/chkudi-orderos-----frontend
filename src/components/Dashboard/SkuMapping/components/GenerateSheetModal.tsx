"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import Button from "@/components/ui/Button";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { skuMappingService } from "../services/skuMapping.service";
import { getToken } from "@/utils/auth";
import { toast } from "sonner";
import { Trash2, Printer, Tag } from "lucide-react";
import { useDeleteSheetDraft, useSaveSheetDraft, useSheetDraft } from "../hooks/useSheetDraft";
import LabelSelectionModal from "@/components/Dashboard/Labels/components/LabelSelectionModal";
import PrintExecutionModal from "@/components/Dashboard/Labels/components/PrintExecutionModal";
import { LabelTemplate } from "@/components/Dashboard/Labels/types/label.types";
import { chromeExtensionPrintService } from "@/components/Dashboard/Labels/services/printAgent.service";
import { labelService } from "@/components/Dashboard/Labels/services/label.service";
import { renderLabelToCanvas } from "@/lib/labelRenderer";
import { Checkbox } from "@/components/ui/checkbox";
import { BadgeCheck } from "lucide-react";
import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";

const PRINT_MODE_OPTIONS: SelectOption[] = [
  { label: "Single Print", value: "single" },
  { label: "Multiple Print", value: "multiple" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

interface GenerateRow {
  id: number;
  shortSku: string;
  fullSku?: string;
  quantity?: number | string;
  barcodeSku: string;
  ordercookSku: string;

  loading: boolean;

  error: boolean;

  errorMessage: string;
}

interface SkuSuggestion {
  id: string;
  shortSku: string;
}

export default function GenerateSheetModal({ open, onClose }: Props) {
  // const STORAGE_KEY = "sku-generate-sheet";
  // const STORAGE_EXPIRE_HOURS = 24;
  const DEFAULT_ROWS: GenerateRow[] = [
    {
      id: 1,
      shortSku: "",
      fullSku: "",
      quantity: 1,
      barcodeSku: "",
      ordercookSku: "",
      loading: false,
      error: false,
      errorMessage: "",
    },
  ];

  // const [rows, setRows] = useState<GenerateRow[]>(() => {
  //   if (typeof window === "undefined") {
  //     return DEFAULT_ROWS;
  //   }

  //   const saved = localStorage.getItem(STORAGE_KEY);

  //   if (!saved) return DEFAULT_ROWS;

  //   try {
  //     const parsed = JSON.parse(saved);

  //     if (Date.now() > parsed.expiresAt) {
  //       localStorage.removeItem(STORAGE_KEY);
  //       return DEFAULT_ROWS;
  //     }

  //     return parsed.rows?.length ? parsed.rows : DEFAULT_ROWS;
  //   } catch {
  //     localStorage.removeItem(STORAGE_KEY);
  //     return DEFAULT_ROWS;
  //   }
  // });
  const [rows, setRows] = useState<GenerateRow[]>(DEFAULT_ROWS);
  const [printMode, setPrintMode] = useState<"single" | "multiple">("single");

  const saveDraftMutation = useSaveSheetDraft();

  const deleteDraftMutation = useDeleteSheetDraft();

  const { data: draftResponse } = useSheetDraft();

  const isInitialLoad = useRef(true);

  // const [suggestions, setSuggestions] = useState<
  //   { id: string; shortSku: string }[]
  // >([]);

  // const [activeRow, setActiveRow] = useState<number | null>(null);

  // const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  // const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [copiedRow, setCopiedRow] = useState<GenerateRow | null>(null);
  const [isLabelPickerOpen, setIsLabelPickerOpen] = useState(false);

  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [printedRowIds, setPrintedRowIds] = useState<Set<number>>(new Set());
  const [isPrintExecutionOpen, setIsPrintExecutionOpen] = useState(false);
  const [activePrintTemplate, setActivePrintTemplate] = useState<LabelTemplate | null>(null);
  const [isPrintingDirectly, setIsPrintingDirectly] = useState(false);
  const qtyInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const selectedTotalQty = rows
    .filter((r) => selectedRowIds.has(r.id))
    .reduce((sum, r) => sum + (printMode === "multiple" ? Math.max(Number(r.quantity) || 1, 1) : 1), 0);

  const handleDirectPrint = async () => {
    const selectedRowsList = rows.filter((r) => selectedRowIds.has(r.id));
    if (selectedRowsList.length === 0) return;

    setIsPrintingDirectly(true);
    const toastId = toast.loading("Connecting to printer extension...", { id: "sku-direct-print" });

    try {
      // 1. Check Chrome Extension
      const extCheck = await chromeExtensionPrintService.checkExtension();
      if (!extCheck.ok) {
        toast.error(
          "Chrome Print Extension (PrintBridge) not detected. Please ensure it is installed and enabled.",
          { id: toastId, duration: 6000 }
        );
        setIsPrintingDirectly(false);
        return;
      }

      // 2. Fetch available printers
      const printers = await chromeExtensionPrintService.getPrinters();
      const details = await chromeExtensionPrintService.getPrintersDetailed();
      const lastUsedPrinter = typeof window !== "undefined" ? localStorage.getItem("lastUsedPrinter") : null;

      const offlineMap = new Map<string, boolean>();
      let defaultPrinterName = "";

      details.forEach((d) => {
        if (d.name) {
          offlineMap.set(d.name.toLowerCase(), !!d.isOffline);
          if (d.isDefault) {
            defaultPrinterName = d.name;
          }
        }
      });

      let targetPrinter = "";
      
      const isThermal = (name: string) => /tsc|zebra|thermal|barcode|da310|xprinter|gprinter|label|pos/i.test(name);
      
      const defaultIsThermalAndOnline = defaultPrinterName && isThermal(defaultPrinterName) && offlineMap.get(defaultPrinterName.toLowerCase()) !== true;

      if (defaultIsThermalAndOnline) {
        targetPrinter = defaultPrinterName;
      } else if (lastUsedPrinter && printers.includes(lastUsedPrinter) && offlineMap.get(lastUsedPrinter.toLowerCase()) !== true) {
        targetPrinter = lastUsedPrinter;
      } else {
        const onlineThermal = printers.find((p) => isThermal(p) && offlineMap.get(p.toLowerCase()) !== true);
        targetPrinter = onlineThermal || lastUsedPrinter || (printers && printers.length > 0 ? printers[0] : "Printer");
      }

      if (!printers || printers.length === 0) {
        toast.error(`Print failed: PrintBridge extension could not detect any printers on your system. Please check your printer connections.`, { id: toastId, duration: 6000 });
        setIsPrintingDirectly(false);
        return;
      }

      const isTargetOffline = offlineMap.get(targetPrinter.toLowerCase()) === true;
      if (isTargetOffline) {
        toast.error(`Print failed: Printer "${targetPrinter}" is offline. Please check printer power/cable or select an online printer.`, { id: toastId, duration: 6000 });
        setIsPrintingDirectly(false);
        return;
      }

      // 3. Fetch template if not active
      toast.loading("Preparing label template...", { id: toastId });
      let template: LabelTemplate | null = activePrintTemplate;
      if (!template) {
        try {
          const templates = await labelService.getTemplates();
          if (templates && templates.length > 0) {
            const lastTemplateId = typeof window !== "undefined" ? localStorage.getItem("lastUsedLabelTemplateId") : null;
            template = (lastTemplateId && templates.find(t => t.id === lastTemplateId)) || templates[0];
            setActivePrintTemplate(template);
          }
        } catch (e) {
          console.warn("Failed to fetch templates automatically:", e);
        }
      }

      if (!template) {
        toast.dismiss(toastId);
        // Fall back to template selection modal if no template exists/saved
        setIsLabelPickerOpen(true);
        setIsPrintingDirectly(false);
        return;
      }

      toast.loading(`Direct printing ${selectedRowsList.length} label(s) to ${targetPrinter}...`, { id: toastId });

      const succeededIds = new Set<number>();
      let successCount = 0;

      for (const row of selectedRowsList) {
        const query = row.barcodeSku?.trim() || row.shortSku?.trim();
        if (!query) continue;

        try {
          const matches = await labelService.lookupProduct(query);
          const product = matches.length > 0 ? matches[0] : {};

          // Render canvas WITHOUT rotation — label stays in its natural orientation.
          // SumatraPDF is configured with -print-settings noscale so it will not
          // auto-rotate or scale. The PDF page dimensions match the label exactly.
          const canvas = await renderLabelToCanvas(template, product, undefined, false);
          const dataUrl = canvas.toDataURL("image/png");
          const cleanBase64 = dataUrl.split(",")[1];
          const imageBytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));

          const pdfDoc = await PDFDocument.create();
          const embeddedImage = await pdfDoc.embedPng(imageBytes);

          const MM_TO_PT = 72 / 25.4;
          const widthPoints = (template.settings.widthMm || 100) * MM_TO_PT;
          const heightPoints = (template.settings.heightMm || 50) * MM_TO_PT;

          const page = pdfDoc.addPage([widthPoints, heightPoints]);
          page.drawImage(embeddedImage, { x: 0, y: 0, width: widthPoints, height: heightPoints });

          const pdfBase64 = await pdfDoc.saveAsBase64();

          const copies = printMode === "multiple" ? Math.max(Number(row.quantity) || 1, 1) : 1;
          const extRes = await chromeExtensionPrintService.printPdf(pdfBase64, targetPrinter, copies);
          if (extRes && (extRes.success === false || extRes.error)) {
            throw new Error(extRes.error || "Print extension reported print failure");
          }

          succeededIds.add(row.id);
          successCount += copies;
        } catch (err: any) {
          console.error(`Failed to print row ${row.id}:`, err);
        }
      }

      if (successCount > 0) {
        setPrintedRowIds((prev) => new Set([...prev, ...succeededIds]));
        setSelectedRowIds(new Set());
        toast.success(`Sent ${successCount} label(s) to ${targetPrinter} (Queued in Print Spooler)!`, { id: toastId });
      } else {
        toast.error("Failed to print labels. Please check printer connection.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Direct print error:", err);
      toast.error(err?.message || "Direct print failed", { id: toastId });
    } finally {
      setIsPrintingDirectly(false);
    }
  };

  const toggleAllRows = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(rows.filter(r => r.shortSku.trim() || r.barcodeSku.trim()).map(r => r.id));
      setSelectedRowIds(allIds);
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const addNewRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        shortSku: "",
        fullSku: "",
        quantity: 1,
        barcodeSku: "",
        ordercookSku: "",

        loading: false,

        error: false,

        errorMessage: "",
      },
    ]);
  };

  const deleteRow = (id: number) => {
    setRows((prev) => {
      const updated = prev.filter((row) => row.id !== id);

      return updated.length ? updated : DEFAULT_ROWS;
    });
  };

  // const saveRows = (data: GenerateRow[]) => {
  //   console.log("Saving Rows:", data);

  //   localStorage.setItem(
  //     STORAGE_KEY,
  //     JSON.stringify({
  //       expiresAt: Date.now() + STORAGE_EXPIRE_HOURS * 60 * 60 * 1000,
  //       rows: data,
  //     }),
  //   );
  // };

  //   useEffect(() => {
  //     const saved = localStorage.getItem(STORAGE_KEY);

  //     console.log("Saved from localStorage:", saved);

  //     if (!saved) return;

  //     try {
  //       const parsed = JSON.parse(saved);

  //       console.log("Parsed:", parsed);

  //       if (Date.now() > parsed.expiresAt) {
  //         console.log("Expired");
  //         localStorage.removeItem(STORAGE_KEY);
  //         return;
  //       }

  //       if (parsed.rows?.length) {
  //         console.log("Restoring rows:", parsed.rows);
  //         setRows(parsed.rows);
  //       }
  //     } catch (e) {
  //       console.log("Parse Error", e);
  //       localStorage.removeItem(STORAGE_KEY);
  //     }
  //   }, []);
  //   const [isRestored, setIsRestored] = useState(false);

  //   useEffect(() => {
  //     const saved = localStorage.getItem(STORAGE_KEY);

  //     if (saved) {
  //       try {
  //         const parsed = JSON.parse(saved);

  //         if (Date.now() <= parsed.expiresAt && parsed.rows?.length) {
  //           setRows(parsed.rows);
  //         } else {
  //           localStorage.removeItem(STORAGE_KEY);
  //         }
  //       } catch {
  //         localStorage.removeItem(STORAGE_KEY);
  //       }
  //     }

  //     setIsRestored(true);
  //   }, []);

  //   useEffect(() => {
  //     if (!isRestored) return;

  //     saveRows(rows);
  //   }, [rows, isRestored]);

  // useEffect(() => {
  //   saveRows(rows);
  // }, [rows]);

  const clearSheet = () => {
    deleteDraftMutation.mutate();

    // setRows([
    //   {
    //     id: 1,
    //     shortSku: "",
    //     barcodeSku: "",
    //     ordercookSku: "",
    //     loading: false,
    //     error: false,
    //     errorMessage: "",
    //   },
    // ]);
    setRows(DEFAULT_ROWS);

    toast.success("Sheet cleared successfully.");
  };

  const searchSku = async (shortSku: string, index: number) => {
    console.log("Searching:", shortSku);
    // Loading
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
            ...row,
            loading: true,
            error: false,
            errorMessage: "",
          }
          : row,
      ),
    );

    try {
      const response = await skuMappingService.search(shortSku, getToken());

      setRows((prev) =>
        prev.map((row, i) =>
          i === index
            ? {
              ...row,
              fullSku: response.data.fullSku || "",

              barcodeSku: response.data.barcodeSku,

              ordercookSku: response.data.ordercookSku,

              loading: false,

              error: false,

              errorMessage: "",
            }
            : row,
        ),
      );

      return true;
    } catch (error: any) {
      toast.error(error.message || "SKU Not Found");

      setRows((prev) =>
        prev.map((row, i) =>
          i === index
            ? {
              ...row,
              fullSku: "",
              barcodeSku: "",
              ordercookSku: "",
              loading: false,
              error: true,
              errorMessage: "SKU Not Found",
            }
            : row,
        ),
      );

      return false;
    }
  };

  // const getSuggestions = (value: string, rowIndex: number) => {
  //   if (debounceRef.current) {
  //     clearTimeout(debounceRef.current);
  //   }

  //   if (!value.trim()) {
  //     setSuggestions([]);
  //     setActiveRow(null);
  //     return;
  //   }

  //   debounceRef.current = setTimeout(async () => {
  //     try {
  //       const response = await skuMappingService.suggestions(value, getToken());

  //       console.log(response);

  //       setSuggestions(response.data);

  //       setActiveRow(rowIndex);

  //       setSelectedSuggestion(0);
  //     } catch {
  //       setSuggestions([]);
  //       setActiveRow(null);
  //     }
  //   }, 300);
  // };

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    const lastIndex = rows.length - 1;

    inputRefs.current[lastIndex]?.focus();
  }, [rows.length]);

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("SKU Mapping");

    worksheet.columns = [
      {
        header: "Short SKU",
        key: "shortSku",
        width: 35,
      },
      {
        header: "Full SKU",
        key: "fullSku",
        width: 35,
      },
      {
        header: "Barcode SKU",
        key: "barcodeSku",
        width: 35,
      },
      {
        header: "Barcode Qty",
        key: "barcodeQty",
        width: 15,
      },
      {
        header: "OrderCook SKU",
        key: "ordercookSku",
        width: 35,
      },
      {
        header: "OrderCook Qty",
        key: "ordercookQty",
        width: 15,
      },
    ];

    // Header Style
    worksheet.getRow(1).font = {
      bold: true,
    };

    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "E2E8F0",
      },
    };

    worksheet.getRow(1).eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    });

    // const groupedRows = new Map<
    //   string,
    //   {
    //     shortSku: string;
    //     barcodeSku: string;
    //     ordercookSku: string;
    //     barcodeQty: number;
    //     ordercookQty: number;
    //   }
    // >();

    // rows
    //   .filter(
    //     (row) =>
    //       row.shortSku.trim() &&
    //       row.barcodeSku.trim() &&
    //       row.ordercookSku.trim(),
    //   )
    //   .forEach((row) => {
    //     // Same SKU + Barcode + OrderCook ne group karo
    //     const key = `${row.shortSku}|${row.barcodeSku}|${row.ordercookSku}`;

    //     if (groupedRows.has(key)) {
    //       groupedRows.get(key)!.barcodeQty += 1;
    //       groupedRows.get(key)!.ordercookQty += 1;
    //     } else {
    //       groupedRows.set(key, {
    //         shortSku: row.shortSku,
    //         barcodeSku: row.barcodeSku,
    //         ordercookSku: row.ordercookSku,
    //         barcodeQty: 1,
    //         ordercookQty: 1,
    //       });
    //     }
    //   });

    // // Excel ma unique rows add karo
    // groupedRows.forEach((item) => {
    //   worksheet.addRow({
    //     shortSku: item.shortSku,
    //     barcodeSku: item.barcodeSku,
    //     barcodeQty: item.barcodeQty,
    //     ordercookSku: item.ordercookSku,
    //     ordercookQty: item.ordercookQty,
    //   });
    // });

    rows
      .filter(
        (row) =>
          row.shortSku.trim() &&
          row.barcodeSku.trim() &&
          row.ordercookSku.trim(),
      )
      .forEach((row) => {
        const qty = printMode === "multiple" ? Math.max(Number(row.quantity) || 1, 1) : 1;
        worksheet.addRow({
          shortSku: row.shortSku,
          fullSku: row.fullSku || "",
          barcodeSku: row.barcodeSku,
          barcodeQty: qty,
          ordercookSku: row.ordercookSku,
          ordercookQty: qty,
        });
      });

    // ===============================
    // OrderCook Summary Table
    // ===============================

    // 2 Blank Rows
    worksheet.addRow([]);
    worksheet.addRow([]);

    // Summary Start Row
    const summaryStartRow = 1;

    // Heading
    worksheet.getCell(`I${summaryStartRow}`).value = "Barcode SKU";
    worksheet.getCell(`J${summaryStartRow}`).value = "OrderCook SKU";
    worksheet.getCell(`K${summaryStartRow}`).value = "Qty";

    // Heading Style
    ["I", "J", "K"].forEach((col) => {
      const cell = worksheet.getCell(`${col}${summaryStartRow}`);

      cell.font = {
        bold: true,
      };

      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "E2E8F0",
        },
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
      };
    });

    // Count OrderCook SKU
    const summaryMap = new Map<
      string,
      {
        barcodeSku: string;
        ordercookSku: string;
        qty: number;
      }
    >();

    rows
      .filter((row) => row.barcodeSku.trim() && row.ordercookSku.trim())
      .forEach((row) => {
        const key = `${row.barcodeSku}|${row.ordercookSku}`;
        const qty = printMode === "multiple" ? Math.max(Number(row.quantity) || 1, 1) : 1;

        if (summaryMap.has(key)) {
          summaryMap.get(key)!.qty += qty;
        } else {
          summaryMap.set(key, {
            barcodeSku: row.barcodeSku,
            ordercookSku: row.ordercookSku,
            qty,
          });
        }
      });

    // Add Summary Data
    let currentRow = summaryStartRow + 1;

    summaryMap.forEach((item) => {
      worksheet.getCell(`I${currentRow}`).value = item.barcodeSku;
      worksheet.getCell(`J${currentRow}`).value = item.ordercookSku;
      worksheet.getCell(`K${currentRow}`).value = item.qty;

      ["I", "J", "K"].forEach((col) => {
        worksheet.getCell(`${col}${currentRow}`).border = {
          top: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
          bottom: { style: "thin" },
        };
      });

      currentRow++;
    });

    // Width
    worksheet.getColumn("I").width = 35;
    worksheet.getColumn("J").width = 35;
    worksheet.getColumn("K").width = 15;

    const buffer = await workbook.xlsx.writeBuffer();

    const today = new Date();

    const fileName = `SKU-Mapping-${today.toISOString().split("T")[0]}.xlsx`;

    saveAs(new Blob([buffer]), fileName);

    toast.success("Excel downloaded successfully.");
    // deleteDraftMutation.mutate();

    // setRows(DEFAULT_ROWS);
  };

  useEffect(() => {
    if (draftResponse?.data?.rows?.length) {
      setRows(
        draftResponse.data.rows.map((row: any, index: number) => ({
          id: Date.now() + index,

          shortSku: row.shortSku,

          fullSku: row.fullSku || "",

          quantity: row.quantity !== undefined ? (Number(row.quantity) || 1) : 1,

          barcodeSku: row.barcodeSku,

          ordercookSku: row.ordercookSku,

          loading: false,

          error: false,

          errorMessage: "",
        })),
      );
    }

    isInitialLoad.current = false;
  }, [draftResponse]);

  useEffect(() => {
    if (isInitialLoad.current) return;

    const timer = setTimeout(() => {
      const payload = rows
        .filter((row) => row.shortSku.trim())
        .map((row) => ({
          shortSku: row.shortSku,
          fullSku: row.fullSku || "",
          quantity: row.quantity !== undefined ? (Number(row.quantity) || 1) : 1,
          barcodeSku: row.barcodeSku,
          ordercookSku: row.ordercookSku,
        }));

      saveDraftMutation.mutate(payload);
    }, 5000);

    return () => clearTimeout(timer);
  }, [rows]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] w-[calc(100vw-22rem)] max-w-none flex-col p-0">
        <DialogHeader className="border-b bg-[#0A0E1A] px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold text-[#E8C16D]">
                Generate Excel Sheet
              </DialogTitle>

              <p className="mt-1 text-lg text-white">
                Scan or enter Short SKU. Full SKU, Barcode SKU and OrderCook SKU are
                filled automatically.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex justify-between items-center gap-3 pt-5 px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">Print Mode:</span>
            <div className="w-44">
              <ReactSelect
                options={PRINT_MODE_OPTIONS}
                value={PRINT_MODE_OPTIONS.find((opt) => opt.value === printMode)}
                onChange={(opt) => {
                  if (opt) setPrintMode(opt.value as "single" | "multiple");
                }}
                height={38}
                borderRadius={6}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              fullWidth={false}
              className="w-40"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={() => {
                const selectedRowsList = rows.filter((r) => selectedRowIds.has(r.id));
                if (selectedRowsList.length === 0) return;
                if (!activePrintTemplate) {
                  setIsLabelPickerOpen(true);
                } else {
                  setIsPrintExecutionOpen(true);
                }
              }}
              disabled={selectedRowIds.size === 0 || isPrintingDirectly}
            >
              {isPrintingDirectly ? "Printing..." : `Print (${selectedTotalQty})`}
            </Button>
            <Button
              variant="outline"
              fullWidth={false}
              className="w-44 truncate"
              leftIcon={<Tag className="h-4 w-4" />}
              onClick={() => setIsLabelPickerOpen(true)}
              title={activePrintTemplate?.name ? `Current Template: ${activePrintTemplate.name}. Click to change.` : "Select label template"}
            >
              {activePrintTemplate?.name ? activePrintTemplate.name : "Select Template"}
            </Button>
            <Button variant="primary" fullWidth={false} className="w-40" leftIcon={<Trash2 className="h-4 w-4" />} onClick={clearSheet}>
              Clear Sheet
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6 py-4">
          <div className="h-full overflow-auto border">
            <table className="w-full table-fixed border-collapse">
              <thead className="sticky top-0 z-10 bg-[#0A0E1A] text-white">
                <tr>
                  <th className="w-12 border px-4 py-3 text-center">
                    <Checkbox
                      checked={selectedRowIds.size > 0 && selectedRowIds.size === rows.filter(r => r.shortSku.trim() || r.barcodeSku.trim()).length}
                      onCheckedChange={(checked) => toggleAllRows(!!checked)}
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#0A0E1A]"
                    />
                  </th>
                  <th className="w-16 border px-4 py-3 text-left">#</th>

                  <th className={printMode === "multiple" ? "w-[28%] border px-4 py-3 text-left" : "w-[30%] border px-4 py-3 text-left"}>
                    Short SKU
                  </th>

                  {printMode === "multiple" && (
                    <th className="w-24 border px-4 py-3 text-center">
                      Qty
                    </th>
                  )}

                  <th className={printMode === "multiple" ? "w-[24%] border px-4 py-3 text-left" : "w-[26%] border px-4 py-3 text-left"}>
                    Full SKU
                  </th>

                  <th className={printMode === "multiple" ? "w-[24%] border px-4 py-3 text-left" : "w-[22%] border px-4 py-3 text-left"}>
                    Barcode SKU
                  </th>

                  <th className={printMode === "multiple" ? "w-[24%] border px-4 py-3 text-left" : "w-[22%] border px-4 py-3 text-left"}>
                    OrderCook SKU
                  </th>
                  <th className="w-24 border px-4 py-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="border px-4 py-3 text-center">
                      <Checkbox
                        checked={selectedRowIds.has(row.id)}
                        onCheckedChange={(checked) => toggleRow(row.id, !!checked)}
                      />
                    </td>
                    <td className="border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{index + 1}</span>
                        {printedRowIds.has(row.id) && (
                          <span title="Printed">
                            <BadgeCheck className="w-4 h-4 text-green-600" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="border px-4 py-3">
                      <div className="relative">
                        <input
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          value={row.shortSku}
                          placeholder="Enter Short SKU"
                          className="w-full border-none bg-transparent outline-none"
                          // onChange={(e) => {
                          //   const updated = [...rows];
                          //   updated[index].shortSku =
                          //     e.target.value.toUpperCase();
                          //   setRows(updated);
                          // }}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();

                            const updated = [...rows];

                            updated[index].shortSku = value;

                            setRows(updated);

                            // setActiveRow(index);

                            // getSuggestions(value, index);
                          }}
                          // onKeyDown={async (e) => {
                          //   if (e.key !== "Enter") return;

                          //   e.preventDefault();

                          //   if (!row.shortSku.trim()) return;

                          //   // Last row hoy to pehla new row add karo
                          //   if (index === rows.length - 1) {
                          //     addNewRow();
                          //   }

                          //   // Background search (wait nahi kare)
                          //   searchSku(row.shortSku.trim(), index);
                          // }}

                          onKeyDown={async (e) => {
                            // Ctrl + C
                            if (e.ctrlKey && e.key.toLowerCase() === "c") {
                              e.preventDefault();

                              setCopiedRow(rows[index]);

                              toast.success("Row copied.");

                              return;
                            }

                            // Ctrl + V
                            if (e.ctrlKey && e.key.toLowerCase() === "v") {
                              e.preventDefault();

                              if (!copiedRow) {
                                toast.error("No copied row.");
                                return;
                              }

                              const updated = [...rows];

                              updated[index] = {
                                ...updated[index],
                                shortSku: copiedRow.shortSku,
                                fullSku: copiedRow.fullSku || "",
                                barcodeSku: copiedRow.barcodeSku,
                                ordercookSku: copiedRow.ordercookSku,
                                error: false,
                                errorMessage: "",
                              };

                              setRows(updated);

                              // setSuggestions([]);
                              // setActiveRow(null);

                              // Search again (latest data mate)
                              searchSku(copiedRow.shortSku, index);

                              // Last row hoy to new row add karo
                              if (index === rows.length - 1) {
                                addNewRow();
                              }

                              // Next row focus
                              setTimeout(() => {
                                inputRefs.current[index + 1]?.focus();
                              }, 100);

                              toast.success("Row pasted.");

                              return;
                            }
                            // Ctrl + D
                            if (e.ctrlKey && e.key.toLowerCase() === "d") {
                              e.preventDefault();

                              // First row ma duplicate na thai
                              if (index === 0) return;

                              const previousRow = rows[index - 1];

                              if (!previousRow.shortSku) return;

                              const updated = [...rows];

                              updated[index].shortSku = previousRow.shortSku;

                              setRows(updated);

                              // setSuggestions([]);
                              // setActiveRow(null);

                              // Background search
                              searchSku(previousRow.shortSku, index);

                              // Last row hoy to new row add
                              if (index === rows.length - 1) {
                                addNewRow();
                              }

                              // Next row focus
                              setTimeout(() => {
                                inputRefs.current[index + 1]?.focus();
                              }, 100);

                              return;
                            }

                            // ↓ Down Arrow
                            if (e.key === "ArrowDown") {
                              e.preventDefault();

                              // Dropdown open hoy to suggestion ma move
                              // if (
                              //   activeRow === index &&
                              //   suggestions.length > 0
                              // ) {
                              //   setSelectedSuggestion((prev) =>
                              //     prev < suggestions.length - 1
                              //       ? prev + 1
                              //       : prev,
                              //   );
                              //   return;
                              // }

                              // Dropdown open nathi to next row
                              if (index < rows.length - 1) {
                                inputRefs.current[index + 1]?.focus();
                              }

                              return;
                            }

                            // ↑ Up Arrow
                            if (e.key === "ArrowUp") {
                              e.preventDefault();

                              // Dropdown open hoy to suggestion ma move karo
                              // if (
                              //   activeRow === index &&
                              //   suggestions.length > 0
                              // ) {
                              //   setSelectedSuggestion((prev) =>
                              //     prev > 0 ? prev - 1 : 0,
                              //   );
                              //   return;
                              // }

                              // Dropdown open nathi to previous row
                              if (index > 0) {
                                inputRefs.current[index - 1]?.focus();
                              }

                              return;
                            }

                            // Enter
                            if (e.key === "Enter") {
                              e.preventDefault();

                              // Suggestion open hoy to select karo
                              // if (
                              //   activeRow === index &&
                              //   suggestions.length > 0
                              // ) {
                              //   const item = suggestions[selectedSuggestion];

                              //   if (!item) return;

                              //   const updated = [...rows];

                              //   updated[index].shortSku = item.shortSku;

                              //   setRows(updated);

                              //   setSuggestions([]);

                              //   setActiveRow(null);

                              //   searchSku(item.shortSku, index);

                              //   if (index === rows.length - 1) {
                              //     addNewRow();
                              //   }

                              //   setTimeout(() => {
                              //     inputRefs.current[index + 1]?.focus();
                              //   }, 100);

                              //   return;
                              // }

                              // Suggestion open na hoy to normal search
                              if (!row.shortSku.trim()) return;

                              // Background search (autofills Full SKU, Barcode SKU, OrderCook SKU)
                              searchSku(row.shortSku.trim(), index);

                              if (printMode === "multiple") {
                                setTimeout(() => {
                                  qtyInputRefs.current[index]?.focus();
                                  qtyInputRefs.current[index]?.select();
                                }, 50);
                                return;
                              }

                              if (index === rows.length - 1) {
                                addNewRow();
                              }

                              setTimeout(() => {
                                inputRefs.current[index + 1]?.focus();
                              }, 100);
                            }

                            // ESC
                            // if (e.key === "Escape") {
                            //   setSuggestions([]);
                            //   setActiveRow(null);
                            // }
                          }}
                        />

                        {/* {activeRow === index && suggestions.length > 0 && (
                          <div className="absolute left-0 top-full z-[99999] mt-1 w-full border border-slate-200 bg-white shadow-xl">
                            {suggestions.map((item, i) => (
                              <div
                                ref={(el) => {
                                  if (selectedSuggestion === i) {
                                    el?.scrollIntoView({
                                      block: "nearest",
                                    });
                                  }
                                }}
                                key={item.id}
                                onClick={() => {
                                  const updated = [...rows];

                                  updated[index].shortSku = item.shortSku;

                                  setRows(updated);

                                  setSuggestions([]);

                                  setActiveRow(null);

                                  searchSku(item.shortSku, index);

                                  if (index === rows.length - 1) {
                                    addNewRow();
                                  }
                                  setTimeout(() => {
                                    inputRefs.current[index + 1]?.focus();
                                  }, 100);
                                }}
                                className={`cursor-pointer px-4 py-2 transition ${
                                  selectedSuggestion === i
                                    ? "bg-[#0A0E1A] text-white"
                                    : "hover:bg-slate-100"
                                }`}
                              >
                                {item.shortSku}
                              </div>
                            ))}
                          </div>
                        )} */}
                      </div>
                    </td>

                    {printMode === "multiple" && (
                      <td className="border px-4 py-3 text-center">
                        <input
                          ref={(el) => {
                            qtyInputRefs.current[index] = el;
                          }}
                          type="number"
                          min="1"
                          value={row.quantity ?? 1}
                          className="w-full border-none bg-transparent text-center font-medium text-slate-800 outline-none"
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value, 10) || 1);
                            const updated = [...rows];
                            updated[index] = {
                              ...updated[index],
                              quantity: val,
                            };
                            setRows(updated);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();

                              if (row.shortSku.trim() && (!row.barcodeSku || row.error)) {
                                searchSku(row.shortSku.trim(), index);
                              }

                              if (index === rows.length - 1) {
                                addNewRow();
                              }

                              setTimeout(() => {
                                inputRefs.current[index + 1]?.focus();
                              }, 100);
                            } else if (e.key === "ArrowLeft") {
                              inputRefs.current[index]?.focus();
                            } else if (e.key === "ArrowDown") {
                              e.preventDefault();
                              if (index < rows.length - 1) {
                                qtyInputRefs.current[index + 1]?.focus();
                              }
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              if (index > 0) {
                                qtyInputRefs.current[index - 1]?.focus();
                              }
                            }
                          }}
                        />
                      </td>
                    )}

                    <td className="border px-4 py-3 text-slate-700">
                      {row.loading ? "Searching..." : row.fullSku || "-"}
                    </td>

                    <td className="border px-4 py-3">
                      {row.loading ? "Searching..." : row.barcodeSku || "-"}
                    </td>

                    <td className="border px-4 py-3">
                      {row.loading ? "Searching..." : row.ordercookSku || "-"}
                    </td>
                    <td className="border px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRow(row.id)}
                        disabled={rows.length === 1}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t bg-white px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>

            <Button
              onClick={exportExcel}
              disabled={
                rows.filter(
                  (row) => row.shortSku && row.barcodeSku && row.ordercookSku,
                ).length === 0
              }
            >
              Export Excel
            </Button>
          </div>
        </div>
      </DialogContent>

      <LabelSelectionModal
        open={isLabelPickerOpen}
        onClose={() => setIsLabelPickerOpen(false)}
        onConfirm={(template) => {
          setIsLabelPickerOpen(false);
          setActivePrintTemplate(template);
          if (template?.id && typeof window !== "undefined") {
            localStorage.setItem("lastUsedLabelTemplateId", template.id);
          }
          setTimeout(() => {
            setIsPrintExecutionOpen(true);
          }, 100);
        }}
      />

      <PrintExecutionModal
        open={isPrintExecutionOpen}
        onClose={() => setIsPrintExecutionOpen(false)}
        template={activePrintTemplate}
        rows={rows.filter((r) => selectedRowIds.has(r.id))}
        onComplete={(succeededRowIds) => {
          setPrintedRowIds((prev) => new Set([...prev, ...succeededRowIds]));
          setSelectedRowIds(new Set());
        }}
      />
    </Dialog>
  );
}