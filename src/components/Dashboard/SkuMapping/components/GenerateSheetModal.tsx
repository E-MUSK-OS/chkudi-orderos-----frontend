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
import { Trash2, Printer, Tag, Download } from "lucide-react";
import { useDeleteSheetDraft, useSaveSheetDraft, useSheetDraft } from "../hooks/useSheetDraft";
import LabelSelectionModal from "@/components/Dashboard/Labels/components/LabelSelectionModal";
import PrintExecutionModal from "@/components/Dashboard/Labels/components/PrintExecutionModal";
import { LabelTemplate } from "@/components/Dashboard/Labels/types/label.types";
import { chromeExtensionPrintService, resolveCurrentlyConnectedPrinter } from "@/components/Dashboard/Labels/services/printAgent.service";
import { labelService } from "@/components/Dashboard/Labels/services/label.service";
import { renderLabelToVectorPdf } from "@/lib/labelRenderer";
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
  brandName?: string;
  color?: string;
  size?: string;
  title?: string;
  qty?: number | string;
  mrp?: number | string;
  asinBarcode?: string;

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
      brandName: "",
      color: "",
      size: "",
      title: "",
      qty: "",
      mrp: "",
      asinBarcode: "",
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

      // 2. Fetch available printers & resolve currently connected printer
      const printers = await chromeExtensionPrintService.getPrinters();
      const details = await chromeExtensionPrintService.getPrintersDetailed();

      const { printer: targetPrinter } = resolveCurrentlyConnectedPrinter(printers, details);

      if (!targetPrinter) {
        toast.error("No printer connected. Please connect printer.", {
          id: toastId,
          duration: 8000,
          action: {
            label: "Setup PrintBridge",
            onClick: () => window.open("/printbridge", "_blank"),
          },
        });
        setIsPrintingDirectly(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("lastUsedPrinter", targetPrinter);
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

          const pdfBase64 = await renderLabelToVectorPdf(template, product);

          const effectiveWidthMm = template.settings.widthMm || 100;
          const effectiveHeightMm = template.settings.heightMm || 50;

          const copies = printMode === "multiple" ? Math.max(Number(row.quantity) || 1, 1) : 1;
          const extRes = await chromeExtensionPrintService.printPdf(
            pdfBase64,
            targetPrinter,
            copies,
            true,
            effectiveWidthMm,
            effectiveHeightMm
          );
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
        toast.success(`Printed ${successCount} label(s) directly on ${targetPrinter}!`, { id: toastId });
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
        brandName: "",
        color: "",
        size: "",
        title: "",
        qty: "",
        mrp: "",
        asinBarcode: "",

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
              shortSku: response.data.shortSku, // Update shortSku from DB
              fullSku: response.data.fullSku || "",
              barcodeSku: response.data.barcodeSku,
              ordercookSku: response.data.ordercookSku || "",
              brandName: response.data.brandName || "",
              color: response.data.color || "",
              size: response.data.size || "",
              title: response.data.title || "",
              qty: response.data.qty !== null && response.data.qty !== undefined ? response.data.qty : (row.quantity ?? 1),
              mrp: response.data.mrp !== null && response.data.mrp !== undefined ? response.data.mrp : "",
              asinBarcode: response.data.asinBarcode || "",
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
              brandName: "",
              color: "",
              size: "",
              title: "",
              qty: "",
              mrp: "",
              asinBarcode: "",
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

  const handleDownloadDemoFormat = async () => {
    try {
      const activeRows = rows.filter((row) => row.shortSku.trim());
      if (activeRows.length === 0) {
        toast.error("Please enter at least one Short SKU.");
        return;
      }

      const toastId = toast.loading("Preparing Excel sheet with full SKU details...");
      const token = getToken();

      // Enrich any rows that don't have complete details
      const enrichedRows = await Promise.all(
        activeRows.map(async (row) => {
          if (row.barcodeSku && row.brandName !== undefined && row.title !== undefined) {
            return row;
          }
          try {
            const res = await skuMappingService.search(row.shortSku.trim(), token);
            if (res?.data) {
              return {
                ...row,
                shortSku: res.data.shortSku || row.shortSku,
                fullSku: res.data.fullSku || row.fullSku || "",
                barcodeSku: res.data.barcodeSku || row.barcodeSku || "",
                ordercookSku: res.data.ordercookSku || row.ordercookSku || "",
                brandName: res.data.brandName || "",
                color: res.data.color || "",
                size: res.data.size || "",
                title: res.data.title || "",
                qty: res.data.qty ?? (row.quantity ?? 1),
                mrp: res.data.mrp ?? "",
                asinBarcode: res.data.asinBarcode || "",
              };
            }
          } catch (e) {
            console.warn(`Could not fetch details for ${row.shortSku}:`, e);
          }
          return row;
        })
      );

      // Update local state with any newly enriched data
      setRows((prev) =>
        prev.map((r) => {
          const match = enrichedRows.find((er) => er.id === r.id);
          return match ? { ...r, ...match } : r;
        })
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Godown Inventory Sheet");

      worksheet.columns = [
        { header: "Short SKU", key: "shortSku", width: 22 },
        { header: "Barcode SKU", key: "barcodeSku", width: 25 },
        { header: "Full SKU", key: "fullSku", width: 28 },
        { header: "OrderCook SKU", key: "ordercookSku", width: 20 },
        { header: "Brand Name", key: "brandName", width: 18 },
        { header: "Color", key: "color", width: 15 },
        { header: "Size", key: "size", width: 12 },
        { header: "Title", key: "title", width: 40 },
        { header: "QTY", key: "qty", width: 12 },
        { header: "MRP", key: "mrp", width: 15 },
        { header: "Asin (Barcode)", key: "asinBarcode", width: 20 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0A0E1A" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 28;

      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
        };
      });

      enrichedRows.forEach((row) => {
        const qtyVal =
          printMode === "multiple"
            ? Math.max(Number(row.quantity) || 1, 1)
            : row.quantity !== undefined && row.quantity !== ""
            ? Number(row.quantity)
            : row.qty !== undefined && row.qty !== "" && row.qty !== null
            ? row.qty
            : 1;

        const r = worksheet.addRow({
          shortSku: row.shortSku || "",
          barcodeSku: row.barcodeSku || "",
          fullSku: row.fullSku || "",
          ordercookSku: row.ordercookSku || "",
          brandName: row.brandName || "",
          color: row.color || "",
          size: row.size || "",
          title: row.title || "",
          qty: qtyVal,
          mrp: row.mrp !== undefined && row.mrp !== null ? row.mrp : "",
          asinBarcode: row.asinBarcode || "",
        });
        r.height = 22;
        r.alignment = { vertical: "middle", horizontal: "center" };

        r.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const today = new Date();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `Godown-Inventory-${today.toISOString().split("T")[0]}.xlsx`,
      );
      toast.success("Excel sheet downloaded successfully with all details!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Excel sheet");
    }
  };

  const exportExcel = async () => {
    try {
      const activeRows = rows.filter(
        (row) => row.shortSku && row.shortSku.trim(),
      );

      if (activeRows.length === 0) {
        toast.error("No valid SKU rows to export.");
        return;
      }

      const toastId = toast.loading("Generating SKU Mapping Excel...");
      const token = getToken();

      // Enrich any rows that don't have complete details
      const enrichedRows = await Promise.all(
        activeRows.map(async (row) => {
          if (row.barcodeSku && row.brandName !== undefined && row.title !== undefined) {
            return row;
          }
          try {
            const res = await skuMappingService.search(row.shortSku.trim(), token);
            if (res?.data) {
              return {
                ...row,
                shortSku: res.data.shortSku || row.shortSku,
                fullSku: res.data.fullSku || row.fullSku || "",
                barcodeSku: res.data.barcodeSku || row.barcodeSku || "",
                ordercookSku: res.data.ordercookSku || row.ordercookSku || "",
                brandName: res.data.brandName || "",
                color: res.data.color || "",
                size: res.data.size || "",
                title: res.data.title || "",
                qty: res.data.qty ?? (row.quantity ?? 1),
                mrp: res.data.mrp ?? "",
                asinBarcode: res.data.asinBarcode || "",
              };
            }
          } catch (e) {
            console.warn(`Could not fetch details for ${row.shortSku}:`, e);
          }
          return row;
        })
      );

      // Update local state with any newly enriched data
      setRows((prev) =>
        prev.map((r) => {
          const match = enrichedRows.find((er) => er.id === r.id);
          return match ? { ...r, ...match } : r;
        })
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("SKU Mapping");

      worksheet.columns = [
        { header: "Short SKU", key: "shortSku", width: 22 },
        { header: "Barcode SKU", key: "barcodeSku", width: 25 },
        { header: "Full SKU", key: "fullSku", width: 28 },
        { header: "OrderCook SKU", key: "ordercookSku", width: 20 },
        { header: "Brand Name", key: "brandName", width: 18 },
        { header: "Color", key: "color", width: 15 },
        { header: "Size", key: "size", width: 12 },
        { header: "Title", key: "title", width: 40 },
        { header: "QTY", key: "qty", width: 12 },
        { header: "MRP", key: "mrp", width: 15 },
        { header: "Asin (Barcode)", key: "asinBarcode", width: 20 },
      ];

      // Header Style
      const headerRow = worksheet.getRow(1);
      headerRow.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "FF0A0E1A",
        },
      };
      headerRow.height = 28;

      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
        };
      });

      enrichedRows.forEach((row) => {
        const qtyVal =
          printMode === "multiple"
            ? Math.max(Number(row.quantity) || 1, 1)
            : row.quantity !== undefined && row.quantity !== ""
            ? Number(row.quantity)
            : row.qty !== undefined && row.qty !== "" && row.qty !== null
            ? row.qty
            : 1;

        const r = worksheet.addRow({
          shortSku: row.shortSku || "",
          barcodeSku: row.barcodeSku || "",
          fullSku: row.fullSku || "",
          ordercookSku: row.ordercookSku || "",
          brandName: row.brandName || "",
          color: row.color || "",
          size: row.size || "",
          title: row.title || "",
          qty: qtyVal,
          mrp: row.mrp !== undefined && row.mrp !== null ? row.mrp : "",
          asinBarcode: row.asinBarcode || "",
        });
        r.height = 22;
        r.alignment = { vertical: "middle", horizontal: "center" };

        r.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        });
      });

      // ===============================
      // OrderCook Summary Table
      // ===============================
      const summaryStartRow = 1;

      // Heading at M, N, O
      worksheet.getCell(`M${summaryStartRow}`).value = "Barcode SKU";
      worksheet.getCell(`N${summaryStartRow}`).value = "OrderCook SKU";
      worksheet.getCell(`O${summaryStartRow}`).value = "Qty";

      // Heading Style
      ["M", "N", "O"].forEach((col) => {
        const cell = worksheet.getCell(`${col}${summaryStartRow}`);
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FF0A0E1A",
          },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
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

      enrichedRows
        .filter((row) => row.barcodeSku?.trim() && row.ordercookSku?.trim())
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
        worksheet.getCell(`M${currentRow}`).value = item.barcodeSku;
        worksheet.getCell(`N${currentRow}`).value = item.ordercookSku;
        worksheet.getCell(`O${currentRow}`).value = item.qty;

        ["M", "N", "O"].forEach((col) => {
          const cell = worksheet.getCell(`${col}${currentRow}`);
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        });

        currentRow++;
      });

      worksheet.getColumn("M").width = 30;
      worksheet.getColumn("N").width = 30;
      worksheet.getColumn("O").width = 15;

      const buffer = await workbook.xlsx.writeBuffer();
      const today = new Date();
      const fileName = `SKU-Mapping-${today.toISOString().split("T")[0]}.xlsx`;

      saveAs(new Blob([buffer]), fileName);
      toast.success("Excel downloaded successfully with all details!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel sheet");
    }
  };

  useEffect(() => {
    if (draftResponse?.data?.rows?.length) {
      setRows(
        draftResponse.data.rows.map((row: any, index: number) => ({
          id: Date.now() + index,
          shortSku: row.shortSku,
          fullSku: row.fullSku || "",
          quantity: row.quantity !== undefined ? (Number(row.quantity) || 1) : 1,
          barcodeSku: row.barcodeSku || "",
          ordercookSku: row.ordercookSku || "",
          brandName: row.brandName || "",
          color: row.color || "",
          size: row.size || "",
          title: row.title || "",
          qty: row.qty !== undefined && row.qty !== null ? row.qty : (row.quantity !== undefined ? Number(row.quantity) : ""),
          mrp: row.mrp !== undefined && row.mrp !== null ? row.mrp : "",
          asinBarcode: row.asinBarcode || "",
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
          barcodeSku: row.barcodeSku || "",
          ordercookSku: row.ordercookSku || "",
          brandName: row.brandName || "",
          color: row.color || "",
          size: row.size || "",
          title: row.title || "",
          qty: row.qty !== undefined && row.qty !== null ? row.qty : (row.quantity || 1),
          mrp: row.mrp !== undefined && row.mrp !== null ? row.mrp : "",
          asinBarcode: row.asinBarcode || "",
        }));

      saveDraftMutation.mutate(payload);
    }, 5000);

    return () => clearTimeout(timer);
  }, [rows]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex h-[92dvh] sm:h-[90vh] w-[95vw] lg:w-[calc(100vw-6rem)] xl:w-[calc(100vw-18rem)] max-w-7xl flex-col p-0 !rounded-3xl sm:!rounded-[32px] border border-[#E7E0D2] dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#0F1626] shadow-2xl">
        <DialogHeader className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-[#E8C16D]">
                Generate Excel Sheet
              </DialogTitle>

              <p className="mt-1 text-xs sm:text-sm text-slate-300 dark:text-slate-400">
                Scan or enter Short SKU. Full SKU, Barcode SKU and OrderCook SKU are
                filled automatically.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 sm:pt-5 px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Print Mode:</span>
            <div className="w-full sm:w-44 min-w-[140px]">
              <ReactSelect
                options={PRINT_MODE_OPTIONS}
                value={PRINT_MODE_OPTIONS.find((opt) => opt.value === printMode)}
                onChange={(opt) => {
                  if (opt) setPrintMode(opt.value as "single" | "multiple");
                }}
                height={42}
                borderRadius={16}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
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
              className="inline-flex h-10.5 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 text-xs sm:text-sm font-bold text-[#0A0E1A] hover:bg-[#d4af5a] shadow-xs active:scale-[0.98] transition cursor-pointer disabled:opacity-50 min-w-[120px]"
            >
              <Printer className="h-4 w-4" />
              <span>{isPrintingDirectly ? "Printing..." : `Print (${selectedTotalQty})`}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDemoFormat}
              className="inline-flex h-10.5 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#E8C16D]/10 px-4 sm:px-5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#F5C451] hover:bg-[#FFF3D6] dark:hover:bg-[#E8C16D]/20 ring-1 ring-[#E8C16D]/30 shadow-xs active:scale-[0.98] transition cursor-pointer min-w-[130px]"
            >
              <Download className="h-4 w-4 text-[#B88728] dark:text-[#F5C451]" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={clearSheet}
              className="inline-flex h-10.5 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 px-4 sm:px-5 text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] transition cursor-pointer min-w-[120px]"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Sheet</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-4 sm:px-6 py-3 sm:py-4">
          <div className="h-full overflow-auto rounded-2xl sm:rounded-[24px] border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xs">
            <table className="min-w-[750px] w-full table-fixed border-collapse">
              <thead className="sticky top-0 z-10 bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08]">
                <tr>
                  <th className="w-12 border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-center">
                    <Checkbox
                      checked={selectedRowIds.size > 0 && selectedRowIds.size === rows.filter(r => r.shortSku.trim() || r.barcodeSku.trim()).length}
                      onCheckedChange={(checked) => toggleAllRows(!!checked)}
                      className="border-white data-[state=checked]:bg-[#E8C16D] data-[state=checked]:text-[#0A0E1A]"
                    />
                  </th>
                  <th className="w-16 border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left">#</th>

                  <th className={printMode === "multiple" ? "w-[28%] border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left" : "w-[30%] border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left"}>
                    Short SKU
                  </th>

                  {printMode === "multiple" && (
                    <th className="w-24 border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left">
                      Qty
                    </th>
                  )}

                  <th className={printMode === "multiple" ? "w-[24%] border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left" : "w-[26%] border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left"}>
                    Full SKU
                  </th>

                  <th className={printMode === "multiple" ? "w-[24%] border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left" : "w-[22%] border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left"}>
                    Barcode SKU
                  </th>

                  <th className={printMode === "multiple" ? "w-[24%] border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left" : "w-[22%] border-b border-r border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left"}>
                    OrderCook SKU
                  </th>
                  <th className="w-24 border-b border-slate-800 dark:border-white/[0.08] px-4 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={index % 2 === 0 ? "bg-white dark:bg-[#0F1626]" : "bg-slate-50 dark:bg-white/[0.02]"}
                  >
                    <td className="border border-slate-200 dark:border-white/[0.06] px-4 py-3 text-center">
                      <Checkbox
                        checked={selectedRowIds.has(row.id)}
                        onCheckedChange={(checked) => toggleRow(row.id, !!checked)}
                      />
                    </td>
                    <td className="border border-slate-200 dark:border-white/[0.06] px-4 py-3 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{index + 1}</span>
                        {printedRowIds.has(row.id) && (
                          <span title="Printed">
                            <BadgeCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="border border-slate-200 dark:border-white/[0.06] px-4 py-3">
                      <div className="relative">
                        <input
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          value={row.shortSku}
                          placeholder="Enter Short SKU"
                          className="w-full border-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
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
                          }}
                          onPaste={(e) => {
                            const clipboardData = e.clipboardData;
                            const pastedText = clipboardData.getData("text");
                            if (!pastedText) return;

                            const pastedRows = pastedText.split(/\r?\n/).filter((r) => r.trim());

                            if (pastedRows.length > 1 || pastedRows[0].includes("\t")) {
                              e.preventDefault();

                              const newRowsToAppend = pastedRows
                                .map((rowText, i) => {
                                  const cols = rowText.split("\t");
                                  const shortSku = cols[0]?.trim() || "";
                                  const qtyStr = cols.length > 1 ? cols[1].replace(/[^0-9]/g, "") : "1";
                                  const qty = parseInt(qtyStr, 10) || 1;

                                  return {
                                    id: Date.now() + i + Math.random(),
                                    shortSku: shortSku.toUpperCase(),
                                    fullSku: "",
                                    quantity: qty,
                                    barcodeSku: "",
                                    ordercookSku: "",
                                    brandName: "",
                                    color: "",
                                    size: "",
                                    title: "",
                                    qty: qty,
                                    mrp: "",
                                    asinBarcode: "",
                                    loading: false,
                                    error: false,
                                    errorMessage: "",
                                  };
                                })
                                .filter((r) => r.shortSku);

                              if (newRowsToAppend.length > 0) {
                                const isCurrentRowEmpty = !rows[index].shortSku.trim();
                                const startIndex = isCurrentRowEmpty ? index : index + 1;

                                setRows((prev) => {
                                  const updated = [...prev];
                                  if (isCurrentRowEmpty) {
                                    updated.splice(index, 1, ...newRowsToAppend);
                                  } else {
                                    updated.splice(index + 1, 0, ...newRowsToAppend);
                                  }

                                  // Add a blank row at the end
                                  updated.push({
                                    id: Date.now() + 1000,
                                    shortSku: "",
                                    fullSku: "",
                                    quantity: 1,
                                    barcodeSku: "",
                                    ordercookSku: "",
                                    brandName: "",
                                    color: "",
                                    size: "",
                                    title: "",
                                    qty: "",
                                    mrp: "",
                                    asinBarcode: "",
                                    loading: false,
                                    error: false,
                                    errorMessage: "",
                                  });

                                  return updated;
                                });

                                setTimeout(() => {
                                  for (let i = 0; i < newRowsToAppend.length; i++) {
                                    searchSku(newRowsToAppend[i].shortSku, startIndex + i);
                                  }

                                  const newBlankRowIndex = startIndex + newRowsToAppend.length;
                                  if (inputRefs.current[newBlankRowIndex]) {
                                    inputRefs.current[newBlankRowIndex]?.focus();
                                  }
                                }, 50);

                                toast.success(`${newRowsToAppend.length} rows pasted.`);
                              }
                            }
                          }}
                          onBlur={() => {
                            if (row.shortSku.trim() && (!row.barcodeSku || row.error)) {
                              searchSku(row.shortSku.trim(), index);
                            }
                          }}
                          onKeyDown={async (e) => {
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
                      <td className="border border-slate-200 dark:border-white/[0.06] px-4 py-3 text-center">
                        <input
                          ref={(el) => {
                            qtyInputRefs.current[index] = el;
                          }}
                          type="number"
                          min="1"
                          value={row.quantity ?? 1}
                          className="w-full border-none bg-transparent text-left font-medium text-slate-800 dark:text-slate-200 outline-none"
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

                    <td className="border border-slate-200 dark:border-white/[0.06] px-4 py-3 text-left text-slate-700 dark:text-slate-300">
                      {row.loading ? "Searching..." : row.fullSku || "-"}
                    </td>

                    <td className="border border-slate-200 dark:border-white/[0.06] px-4 py-3 text-left text-slate-800 dark:text-slate-200">
                      {row.loading ? "Searching..." : row.barcodeSku || "-"}
                    </td>

                    <td className="border border-slate-200 dark:border-white/[0.06] px-4 py-3 text-left text-slate-800 dark:text-slate-200">
                      {row.loading ? "Searching..." : row.ordercookSku || "-"}
                    </td>
                    <td className="border border-slate-200 dark:border-white/[0.06] px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        disabled={rows.length === 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition disabled:opacity-40 cursor-pointer"
                        title="Delete row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto h-10.5 sm:h-11 inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] px-5 sm:px-6 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-white/[0.03] active:scale-[0.98] cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={exportExcel}
              disabled={
                rows.filter(
                  (row) => row.shortSku && row.barcodeSku && row.ordercookSku,
                ).length === 0
              }
              className="w-full sm:w-auto h-10.5 sm:h-11 inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-5 sm:px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] transition hover:bg-[#d4af5a] shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              Export Excel
            </button>
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