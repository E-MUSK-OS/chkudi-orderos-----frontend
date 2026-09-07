"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Layers,
  FileText,
  Barcode,
  RotateCcw,
  Sparkles,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Printer,
  Zap,
  X,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { chromeExtensionPrintService } from "@/components/Dashboard/Labels/services/printAgent.service";

import { Checkbox } from "@/components/ui/checkbox";
import Button from "@/components/ui/Button";
import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import { useAmazonOrderStore, loadFilesFromIDB } from "../store/useAmazonOrderStore";
import { cleanCustomerName } from "../utils";
import { AmazonOrderType } from "../types";
import {
  generateAmazonPicklist,
  downloadAmazonPicklistPDF,
} from "../utils/generateAmazonPicklist";

export type AmazonOrderTypeFilter = "all" | AmazonOrderType;

function resolveTargetPrinter(availablePrinters: string[]): string {
  if (!availablePrinters || availablePrinters.length === 0) return "";
  const saved = typeof window !== "undefined" ? localStorage.getItem("lastUsedPrinter") : null;
  if (saved && availablePrinters.includes(saved)) {
    return saved;
  }
  // Prefer thermal / label printers (TSC, Zebra, DA310, etc.)
  const thermal = availablePrinters.find((p) =>
    /tsc|zebra|thermal|barcode|da310|xprinter|gprinter|label|pos/i.test(p)
  );
  if (thermal) return thermal;

  // Prefer physical printers over virtual document printers
  const physical = availablePrinters.find(
    (p) => !/pdf|onenote|fax|xps|document|writer/i.test(p)
  );
  if (physical) return physical;

  return availablePrinters[0];
}

function renderItemListCell(val?: string) {
  if (!val || val === "N/A") {
    return <span className="italic text-muted-foreground">N/A</span>;
  }

  const rawItems = val
    .split(/[\r\n]+|\s+\/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const items = Array.from(new Set(rawItems));

  if (items.length <= 1) {
    return items[0] || val;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
      {items.map((item, idx) => (
        <div key={idx} className="whitespace-nowrap flex items-center justify-center gap-1">
          <span>{item}</span>
          {idx < items.length - 1 && (
            <span className="font-bold text-slate-400 text-[11px]">/</span>
          )}
        </div>
      ))}
    </div>
  );
}

interface ComparisonResultViewProps {
  isStandaloneTab?: boolean;
  onReset?: () => void;
}

export default function ComparisonResultView({
  onReset,
}: ComparisonResultViewProps) {
  const { summary, results, files, combinedPdfUrl, downloadCombinedPdf, clearProcessData } =
    useAmazonOrderStore();

  const [activeTab, setActiveTab] = useState<"table" | "combinedPdf">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoPrintQuery, setAutoPrintQuery] = useState("");
  const autoPrintInputRef = useRef<HTMLInputElement>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [printedRows, setPrintedRows] = useState<Set<number>>(new Set());
  const [orderTypeFilter, setOrderTypeFilter] = useState<AmazonOrderTypeFilter>("all");

  // Helper to get item's order type (with client fallback)
  const getOrderTypeForItem = (item: (typeof results)[0]): AmazonOrderType => {
    if (item.orderType) return item.orderType;

    let totalQty = item.totalQuantity || 0;
    let asinsCount = item.asinsCount || 0;
    let skusCount = 1;

    if (item.asin && item.asin !== "N/A") {
      const rawAsins = item.asin.split(/[\r\n]+|\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
      asinsCount = new Set(rawAsins).size;
      if (!totalQty) totalQty = rawAsins.length;
    }

    if (item.sellerSku && item.sellerSku !== "N/A") {
      const rawSkus = item.sellerSku.split(/[\r\n]+|\s+\/\s+/).map((s) => s.trim()).filter(Boolean);
      skusCount = new Set(rawSkus).size;
      if (rawSkus.length > totalQty) totalQty = rawSkus.length;
    }

    if (asinsCount > 1) return "multiple_asin";
    if (skusCount > 1 || totalQty > 1) return "multiple_pieces";
    return "single_quantity";
  };

  // Order composition filter counts
  const orderTypeCounts = useMemo(() => {
    const counts = {
      all: 0,
      single_quantity: 0,
      multiple_asin: 0,
      multiple_pieces: 0,
    };
    results.forEach((item) => {
      if (!item.isMatch) return;
      counts.all++;
      const type = getOrderTypeForItem(item);
      counts[type]++;
    });
    return counts;
  }, [results]);

  const orderTypeOptions: SelectOption[] = useMemo(
    () => [
      { label: `All Orders (${orderTypeCounts.all})`, value: "all" },
      { label: `Single Quantity (${orderTypeCounts.single_quantity})`, value: "single_quantity" },
      { label: `Multiple ASIN (${orderTypeCounts.multiple_asin})`, value: "multiple_asin" },
      { label: `Multiple Pieces (${orderTypeCounts.multiple_pieces})`, value: "multiple_pieces" },
    ],
    [orderTypeCounts]
  );

  // Printer selection state
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");

  useEffect(() => {
    async function loadPrinters() {
      try {
        const list = await chromeExtensionPrintService.getPrinters();
        if (list && list.length > 0) {
          setAvailablePrinters(list);
          const preferred = resolveTargetPrinter(list);
          setSelectedPrinter(preferred);
        }
      } catch (e) {
        console.warn("Failed to load initial printers:", e);
      }
    }
    loadPrinters();
  }, []);

  // Pagination state (same as Myntra order)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleReset = () => {
    setPrintedRows(new Set());
    if (onReset) {
      onReset();
    } else {
      clearProcessData();
    }
  };

  // Filter and search results (Only matched orders are displayed)
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      // Exclude mismatched data completely
      if (!item.isMatch) return false;

      // Filter by order composition type
      if (orderTypeFilter !== "all") {
        const type = getOrderTypeForItem(item);
        if (type !== orderTypeFilter) return false;
      }

      const activeQuery = (autoPrintQuery || searchQuery).trim().toLowerCase();

      // Search query
      if (!activeQuery) return true;
      return (
        item.zplInvoice.toLowerCase().includes(activeQuery) ||
        item.pdfInvoice.toLowerCase().includes(activeQuery) ||
        (item.asin && item.asin.toLowerCase().includes(activeQuery)) ||
        (item.sellerSku && item.sellerSku.toLowerCase().includes(activeQuery)) ||
        item.orderNumber.toLowerCase().includes(activeQuery) ||
        item.awb.toLowerCase().includes(activeQuery) ||
        item.customer.toLowerCase().includes(activeQuery)
      );
    });
  }, [results, searchQuery, autoPrintQuery, orderTypeFilter]);

  // Pagination calculations (exact Myntra logic)
  const totalRecords = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalRecords);
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  const allPageSelected =
    paginatedResults.length > 0 &&
    paginatedResults.every((item) => selectedRows.has(item.index));

  const toggleAllPage = () => {
    const next = new Set(selectedRows);
    if (allPageSelected) {
      paginatedResults.forEach((item) => next.delete(item.index));
    } else {
      paginatedResults.forEach((item) => next.add(item.index));
    }
    setSelectedRows(next);
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    const next = new Set(selectedRows);
    if (checked) {
      next.add(index);
    } else {
      next.delete(index);
    }
    setSelectedRows(next);
  };

  const renderPdfBytesToImages = async (pdfBytes: Uint8Array): Promise<string[]> => {
    const pdfjs = await import("pdfjs-dist");
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "6.3.289"}/build/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjs.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const images: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 3.0 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await (page.render as any)({ canvasContext: context, viewport, canvas }).promise;
        const base64 = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
        images.push(base64);
      }
    }

    return images;
  };

  const executePrintForItems = async (targetResults: typeof results) => {
    if (targetResults.length === 0) {
      toast.error('No orders found to print.');
      return;
    }

    let activeFiles = files;
    if (!activeFiles?.convertedZplPdfBase64 || !activeFiles?.originalPdfBase64) {
      const recovered = await loadFilesFromIDB();
      if (recovered?.convertedZplPdfBase64 && recovered?.originalPdfBase64) {
        useAmazonOrderStore.setState({ files: recovered });
        activeFiles = recovered;
      }
    }

    if (!activeFiles?.convertedZplPdfBase64 || !activeFiles?.originalPdfBase64) {
      toast.error('Processed order files are not ready for printing.');
      return;
    }

    toast.loading(`Preparing 4" x 6" print for ${targetResults.length} order(s)...`, {
      id: 'print-prep',
    });

    try {
      const zplBytes = Uint8Array.from(atob(activeFiles.convertedZplPdfBase64), (c) =>
        c.charCodeAt(0)
      );
      const pdfBytes = Uint8Array.from(atob(activeFiles.originalPdfBase64), (c) =>
        c.charCodeAt(0)
      );

      const zplDoc = await PDFDocument.load(zplBytes);
      const origDoc = await PDFDocument.load(pdfBytes);
      const printDoc = await PDFDocument.create();

      const TARGET_WIDTH = 4 * 72;
      const TARGET_HEIGHT = 6 * 72;

      const addScaledPage = async (srcPage: any, isZpl = false) => {
        const embedded = await printDoc.embedPage(srcPage);
        const { width: srcW, height: srcH } = embedded;

        if (isZpl) {
          const TOP_SPACING = 25;
          const BOTTOM_SPACING = 10;
          const SIDE_SPACING = 8;

          const availW = TARGET_WIDTH - 2 * SIDE_SPACING;
          const availH = TARGET_HEIGHT - TOP_SPACING - BOTTOM_SPACING;

          const scale = Math.min(availW / srcW, availH / srcH);
          const finalW = srcW * scale;
          const finalH = srcH * scale;

          // Perfectly centered horizontally (equal left & right margins)
          const x = (TARGET_WIDTH - finalW) / 2;
          const y = TARGET_HEIGHT - TOP_SPACING - finalH;

          const newPage = printDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
          newPage.drawPage(embedded, { x, y, width: finalW, height: finalH });
        } else {
          const MARGIN = 6;
          const availW = TARGET_WIDTH - 2 * MARGIN;
          const availH = TARGET_HEIGHT - 2 * MARGIN;

          const scale = Math.min(availW / srcW, availH / srcH);
          const finalW = srcW * scale;
          const finalH = srcH * scale;

          // Perfectly centered horizontally (equal left & right margins)
          const x = (TARGET_WIDTH - finalW) / 2;
          const y = (TARGET_HEIGHT - finalH) / 2;

          const newPage = printDoc.addPage([TARGET_WIDTH, TARGET_HEIGHT]);
          newPage.drawPage(embedded, { x, y, width: finalW, height: finalH });
        }
      };

      for (const item of targetResults) {
        if (item.pdfPages && item.pdfPages.length > 0) {
          for (const pageNum of item.pdfPages) {
            const idx = pageNum - 1;
            if (idx >= 0 && idx < origDoc.getPageCount()) {
              await addScaledPage(origDoc.getPage(idx), false);
            }
          }
        }
        if (item.zplPage > 0 && item.zplPage <= zplDoc.getPageCount()) {
          await addScaledPage(zplDoc.getPage(item.zplPage - 1), true);
        }
      }

      if (printDoc.getPageCount() === 0) {
        toast.error('Selected orders have no valid pages to print.', { id: 'print-prep' });
        return;
      }

      let printedSuccessfully = false;
      let extError = '';

      try {
        const extCheck = await chromeExtensionPrintService.checkExtension();
        if (extCheck.ok) {
          if (extCheck.response?.silentPrinting === false) {
            toast.error(
              "Silent Printing is OFF in the PrintBridge extension. Click the extension icon in the Chrome toolbar and switch 'Silent Printing' to ON.",
              { duration: 9000 }
            );
          }

          const extPrinters = await chromeExtensionPrintService.getPrinters();
          if (extPrinters.length > 0) {
            setAvailablePrinters(extPrinters);
          }

          const lastSavedPrinter = typeof window !== 'undefined' ? localStorage.getItem('lastUsedPrinter') : null;
          const targetPrinter = selectedPrinter || resolveTargetPrinter(extPrinters) || lastSavedPrinter;

          if (!targetPrinter || extPrinters.length === 0) {
            const fallbackName = targetPrinter || 'Printer';
            throw new Error(`Print failed: Printer ${fallbackName} is disconnected or offline`);
          }

          if (lastSavedPrinter && extPrinters.length > 0 && !extPrinters.includes(lastSavedPrinter)) {
            throw new Error(`Print failed: Printer ${lastSavedPrinter} is disconnected or offline`);
          }

          setSelectedPrinter(targetPrinter);
          if (typeof window !== 'undefined') {
            localStorage.setItem('lastUsedPrinter', targetPrinter);
          }

          const totalPages = printDoc.getPageCount();
          const BATCH_SIZE = 5;

          for (let i = 0; i < totalPages; i += BATCH_SIZE) {
            const endIdx = Math.min(i + BATCH_SIZE, totalPages);
            toast.loading(`Direct printing label ${i + 1} to ${endIdx} of ${totalPages} to ${targetPrinter}...`, { id: 'print-prep' });

            const chunkDoc = await PDFDocument.create();
            const pageIndices = Array.from({ length: endIdx - i }, (_, idx) => i + idx);
            const copiedPages = await chunkDoc.copyPages(printDoc, pageIndices);
            copiedPages.forEach((p) => chunkDoc.addPage(p));

            const chunkBase64 = await chunkDoc.saveAsBase64();

            const extRes = await chromeExtensionPrintService.printPdf(chunkBase64, targetPrinter, 1);
            if (extRes && (extRes.success === false || extRes.error)) {
              throw new Error(extRes.error || `PrintBridge reported print failure on pages ${i + 1}-${endIdx}`);
            }
          }

          toast.success(
            `Sent ${totalPages} page(s) (4" x 6") to ${targetPrinter} (Queued in Print Spooler)!`,
            { id: 'print-prep' }
          );
          printedSuccessfully = true;
          setPrintedRows((prev) => {
            const next = new Set(prev);
            targetResults.forEach((r) => next.add(r.index));
            return next;
          });
        } else {
          extError = extCheck.error || 'Extension not responding';
          console.warn('Chrome print extension check failed:', extError);
        }
      } catch (extErr: any) {
        extError = extErr?.message || String(extErr);
        console.warn('Chrome extension print failed:', extErr);
      }

      if (!printedSuccessfully) {
        toast.error(
          `Direct print failed: ${extError || 'Extension not responding'}`,
          {
            id: 'print-prep',
            duration: 10000,
            action: {
              label: 'Setup PrintBridge',
              onClick: () => window.open('/printbridge', '_blank'),
            },
          }
        );
      }
    } catch (err: any) {
      console.error('Print error:', err);
      toast.error(err?.message || 'Failed to prepare print.', {
        id: 'print-prep',
      });
    }
  };

  const handlePrintSelected = async () => {
    if (selectedRows.size === 0) {
      toast.error('Please select at least one order to print.');
      return;
    }

    const targetResults = results.filter((r) => selectedRows.has(r.index));
    await executePrintForItems(targetResults);
  };

  const handleGeneratePicklist = () => {
    // If specific rows are selected, use selected rows; otherwise fallback to ALL matched orders
    const targetSet =
      selectedRows.size > 0
        ? selectedRows
        : new Set(filteredResults.map((item) => item.index));

    if (targetSet.size === 0) {
      toast.error('No matched orders available to generate a picklist.');
      return;
    }

    const picklist = generateAmazonPicklist(results, targetSet);
    downloadAmazonPicklistPDF(picklist);

    if (selectedRows.size > 0) {
      toast.success(`Generated picklist for ${selectedRows.size} selected order(s) (${picklist.items.length} unique SKUs, ${picklist.totalQuantity} total qty).`);
    } else {
      toast.success(`Generated picklist for ALL ${targetSet.size} matched order(s) (${picklist.items.length} unique SKUs, ${picklist.totalQuantity} total qty).`);
    }
  };

  const handleAutoPrintSearch = async (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    // Immediately select all written text when user leaves writing / submits
    autoPrintInputRef.current?.focus();
    autoPrintInputRef.current?.select();

    const matchingItems = results.filter((item) => {
      const asinMatch = item.asin && item.asin.toLowerCase() === q;
      const skuMatch = item.sellerSku && item.sellerSku.toLowerCase() === q;
      const orderMatch = item.orderNumber && item.orderNumber.toLowerCase() === q;
      const awbMatch = item.awb && item.awb.toLowerCase() === q;
      const pdfMatch = item.pdfInvoice && item.pdfInvoice.toLowerCase() === q;
      const zplMatch = item.zplInvoice && item.zplInvoice.toLowerCase() === q;

      const partialOrder = q.length >= 6 && item.orderNumber && item.orderNumber.toLowerCase().includes(q);
      const partialAwb = q.length >= 6 && item.awb && item.awb.toLowerCase().includes(q);
      const partialAsin = q.length >= 6 && item.asin && item.asin.toLowerCase().includes(q);
      const partialSku = q.length >= 3 && item.sellerSku && item.sellerSku.toLowerCase().includes(q);

      return asinMatch || skuMatch || orderMatch || awbMatch || pdfMatch || zplMatch || partialOrder || partialAwb || partialAsin || partialSku;
    });

    if (matchingItems.length > 0) {
      const unprintedItems = matchingItems.filter((item) => !printedRows.has(item.index));
      let targetItem: typeof results[0];
      let seqNotice = "";

      if (unprintedItems.length > 0) {
        targetItem = unprintedItems[0];
        const step = matchingItems.length - unprintedItems.length + 1;
        if (matchingItems.length > 1) {
          seqNotice = `Order ${step} of ${matchingItems.length}`;
        }
      } else {
        // All matching items for this query have been printed once -> cycle restart
        targetItem = matchingItems[0];
        if (matchingItems.length > 1) {
          seqNotice = `Cycle restart: Order 1 of ${matchingItems.length}`;
          setPrintedRows((prev) => {
            const next = new Set(prev);
            matchingItems.forEach((m) => next.delete(m.index));
            return next;
          });
        }
      }

      await executePrintForItems([targetItem]);

      if (seqNotice) {
        toast.info(`Sequential Print (${seqNotice}): Customer ${cleanCustomerName(targetItem.customer)}`, {
          duration: 4000,
        });
      }
    } else {
      toast.error(`No matching order found for "${query}"`);
    }
  };

  if (!summary || results.length === 0) {
    return (
      <div className="border border-border bg-card p-12 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-[#E8C16D]" />
        <h3 className="text-xl font-bold text-foreground">No Processed Order Data Found</h3>
        <p className="mx-auto mt-1 mb-6 max-w-md text-sm text-muted-foreground">
          Please upload both Amazon PDF and ZPL files to run conversion and verification.
        </p>
        <Button
          type="button"
          onClick={handleReset}
          className="mx-auto border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#0A0E1A] hover:text-[#E8C16D]"
        >
          Go to File Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===================================================== */}
      {/* AMAZON ORDER VERIFICATION RESULTS SECTION */}
      {/* ===================================================== */}
      <div className="border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0E1A]">
              Amazon Order Process Results
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 break-words">
              Files: <strong className="text-slate-800">{summary.pdfFileName}</strong> &{" "}
              <strong className="text-slate-800">{summary.zplFileName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex h-10 sm:h-11 w-full sm:w-auto items-center justify-center gap-2 bg-[#0A0E1A] px-4 sm:px-5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#161D2E]"
            >
              <RotateCcw size={16} />
              New Batch
            </button>
          </div>
        </div>

        {/* =================================================== */}
        {/* STATS CARDS */}
        {/* =================================================== */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-[#E7E0D2] pt-6">
          {/* Card 1: Total ZPL */}
          <article
            onClick={() => {
              setActiveTab("table");
              setPage(1);
            }}
            className="cursor-pointer border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              ZPL Labels
            </p>

            <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0E1A]">
                {summary.totalZplLabels}
              </h3>

              <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                Converted
              </span>
            </div>
          </article>

          {/* Card 2: Total PDF Orders */}
          <article
            onClick={() => {
              setActiveTab("table");
              setPage(1);
            }}
            className="cursor-pointer border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              PDF Orders
            </p>

            <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0E1A]">
                {summary.totalPdfOrders}
              </h3>

              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                {summary.totalPdfPages} pgs
              </span>
            </div>
          </article>

          {/* Card 3: Matched Rate */}
          <article
            onClick={() => {
              setActiveTab("table");
              setPage(1);
            }}
            className="cursor-pointer border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              Matched Orders
            </p>

            <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0E1A]">
                {summary.matchedCount}
              </h3>

              <span className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                {summary.matchPercentage}%
              </span>
            </div>
          </article>
        </div>
      </div>

      {/* ===================================================== */}
      {/* TABS & INSTANT AUTO-PRINT SEARCH BAR */}
      {/* ===================================================== */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab("table");
              setPage(1);
            }}
            className={`inline-flex h-12 sm:h-14 w-full sm:w-64 items-center justify-center gap-2 border text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === "table"
                ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                : "border-border bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
            }`}
          >
            Matched Orders ({filteredResults.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("combinedPdf")}
            className={`inline-flex h-12 sm:h-14 w-full sm:w-64 items-center justify-center gap-2 border text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === "combinedPdf"
                ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                : "border-border bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
            }`}
          >
            Combined Matched PDF
          </button>
        </div>

        {/* Rightside Corner: Instant Auto-Print Search Bar */}
        <div className="relative w-full md:w-[480px] lg:w-[560px]">
          <Zap className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B88728] animate-pulse" />
          <input
            ref={autoPrintInputRef}
            type="text"
            placeholder="Print with ASIN, Order ID and AWB Direct with Pressing Enter"
            value={autoPrintQuery}
            onChange={(e) => setAutoPrintQuery(e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                autoPrintInputRef.current?.select();
                handleAutoPrintSearch(autoPrintQuery);
              }
            }}
            className="h-12 sm:h-14 w-full border-2 border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#0A0E1A] pl-10 pr-10 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white placeholder:text-slate-500 placeholder:font-normal outline-none transition focus:ring-2 focus:ring-[#E8C16D]"
          />
          {autoPrintQuery ? (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setAutoPrintQuery("");
                setTimeout(() => {
                  autoPrintInputRef.current?.focus();
                }, 10);
              }}
              onClick={() => {
                setAutoPrintQuery("");
                autoPrintInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* ===================================================== */}
      {/* TAB 1: COMPARISON TABLE VIEW */}
      {/* ===================================================== */}
      {activeTab === "table" && (
        <div className="space-y-4">
          {/* Table Filters & Search */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Box */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Order ID, Invoice #, ASIN, AWB, Customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-11 sm:h-14 w-full border border-border bg-background pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-[#E8C16D]"
              />
            </div>

            {/* Action Buttons & Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Order Composition Filter Select Dropdown */}
              <div className="w-full sm:w-60">
                <ReactSelect
                  options={orderTypeOptions}
                  value={
                    orderTypeOptions.find((opt) => opt.value === orderTypeFilter) ??
                    orderTypeOptions[0]
                  }
                  onChange={(opt) => {
                    if (opt?.value) {
                      setOrderTypeFilter(opt.value as AmazonOrderTypeFilter);
                      setPage(1);
                    }
                  }}
                  height={56}
                  borderColor="#0A0E1A"
                  backgroundColor="#0A0E1A"
                  textColor="#E8C16D"
                  placeholderColor="#E8C16D"
                  menuBackgroundColor="#0A0E1A"
                  optionHoverColor="#161D2E"
                  optionSelectedColor="#E8C16D"
                  optionSelectedTextColor="#0A0E1A"
                />
              </div>

              <button
                type="button"
                onClick={handleGeneratePicklist}
                className="inline-flex h-11 sm:h-14 w-full sm:w-52 cursor-pointer items-center justify-center gap-1.5 border border-[#0A0E1A] bg-[#0A0E1A] text-xs sm:text-sm font-semibold text-[#E8C16D] transition-all duration-200 hover:border-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
              >
                <FileText className="h-4 w-4" />
                Generate Picklist {selectedRows.size > 0 ? `(${selectedRows.size})` : `(All ${filteredResults.length})`}
              </button>

              <button
                type="button"
                disabled={selectedRows.size === 0}
                onClick={handlePrintSelected}
                className={`inline-flex h-11 sm:h-14 w-full sm:w-44 items-center justify-center gap-1.5 border text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  selectedRows.size > 0
                    ? "cursor-pointer border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#0A0E1A] hover:text-[#E8C16D] hover:border-[#E8C16D]"
                    : "cursor-not-allowed border-[#E8C16D]/50 bg-[#E8C16D]/25 text-[#0A0E1A] font-bold"
                }`}
              >
                <Printer className="h-4 w-4" />
                Print {selectedRows.size > 0 ? `(${selectedRows.size})` : ""}
              </button>
            </div>
          </div>

          {/* =================================================== */}
          {/* MOBILE VIEW: RESPONSIVE ORDER CARDS (< 768px) */}
          {/* =================================================== */}
          <div className="space-y-3 md:hidden">
            {/* Mobile Select All Bar */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-[#0A0E1A] p-3 text-xs font-semibold text-white">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={toggleAllPage}
                />
                <span>Select All Page ({paginatedResults.length})</span>
              </label>
              <span className="text-[#E8C16D]">
                {selectedRows.size} Selected
              </span>
            </div>

            {paginatedResults.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
                No orders match your current search or filter.
              </div>
            ) : (
              paginatedResults.map((item) => (
                <div
                  key={item.index}
                  className={`rounded-2xl border p-4 shadow-2xs transition-all space-y-3 ${
                    selectedRows.has(item.index)
                      ? "border-[#E8C16D] bg-[#FFF9EC]/30 dark:bg-[#E8C16D]/5"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={selectedRows.has(item.index)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(item.index, Boolean(checked))
                        }
                      />
                      <span className="font-mono text-xs font-bold text-[#0A0E1A] dark:text-white">
                        {item.orderNumber}
                      </span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      {printedRows.has(item.index) && (
                        <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Printed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Detail Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Invoices */}
                    <div className="col-span-2 rounded-lg bg-muted/40 p-2 space-y-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        Invoice
                      </span>
                      {item.pdfInvoice && item.pdfInvoice !== "Not Found in PDF" ? (
                        <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block">
                          {item.pdfInvoice}
                        </span>
                      ) : item.zplInvoice &&
                        item.zplInvoice !== "Not Found in ZPL" &&
                        item.zplInvoice !== "N/A" ? (
                        <span className="font-semibold text-blue-600 dark:text-blue-400 truncate block">
                          {item.zplInvoice}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground text-[11px] block">
                          N/A
                        </span>
                      )}
                    </div>

                    {/* Seller SKU */}
                    <div className="rounded-lg bg-muted/40 p-2 space-y-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        Seller SKU
                      </span>
                      {renderItemListCell(item.sellerSku)}
                    </div>

                    {/* ASIN */}
                    <div className="rounded-lg bg-muted/40 p-2 space-y-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        ASIN
                      </span>
                      {renderItemListCell(item.asin)}
                    </div>

                    {/* AWB Tracking */}
                    <div className="rounded-lg bg-muted/40 p-2 space-y-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        AWB Tracking
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {item.awb || "N/A"}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="col-span-2 rounded-lg bg-muted/40 p-2 space-y-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider">
                        Customer
                      </span>
                      <span className="font-semibold text-foreground truncate block">
                        {cleanCustomerName(item.customer) || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* =================================================== */}
          {/* DESKTOP VIEW: FULL COMPARISON TABLE (>= 768px) */}
          {/* =================================================== */}
          <div className="hidden md:block w-full overflow-hidden border border-border bg-card shadow-2xs">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead className="bg-[#0A0E1A] text-xs sm:text-sm text-[#E8C16D]">
                  <tr className="border-b border-border">
                    <th className="w-12 min-w-[48px] px-3 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={toggleAllPage}
                        />
                      </div>
                    </th>
                    <th className="w-44 min-w-[160px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">Invoices</th>
                    <th className="w-52 min-w-[190px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">Amazon Order ID</th>
                    <th className="w-44 min-w-[160px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">AWB Tracking</th>
                    <th className="w-36 min-w-[140px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">ASIN</th>
                    <th className="w-44 min-w-[170px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">Seller SKU</th>
                    <th className="w-44 min-w-[160px] px-4 py-3.5 text-center font-semibold whitespace-nowrap">Customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs sm:text-sm">
                  {paginatedResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No orders match your current search.
                      </td>
                    </tr>
                  ) : (
                    paginatedResults.map((item) => (
                      <tr
                        key={item.index}
                        className="transition hover:bg-muted/30"
                      >
                        <td className="w-12 min-w-[48px] px-3 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedRows.has(item.index)}
                              onCheckedChange={(checked) =>
                                handleSelectRow(item.index, Boolean(checked))
                              }
                            />
                          </div>
                        </td>
                        <td className="w-44 min-w-[160px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          {item.pdfInvoice && item.pdfInvoice !== "Not Found in PDF" ? (
                            item.pdfInvoice
                          ) : item.zplInvoice &&
                            item.zplInvoice !== "Not Found in ZPL" &&
                            item.zplInvoice !== "N/A" ? (
                            item.zplInvoice
                          ) : (
                            <span className="italic text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="w-52 min-w-[190px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <span>{item.orderNumber}</span>
                            {printedRows.has(item.index) && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                <CheckCircle2 className="h-3 w-3" /> Printed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="w-44 min-w-[160px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          {item.awb}
                        </td>
                        <td className="w-36 min-w-[140px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          {renderItemListCell(item.asin)}
                        </td>
                        <td className="w-44 min-w-[170px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          {renderItemListCell(item.sellerSku)}
                        </td>
                        <td className="w-44 min-w-[160px] px-4 py-3 text-center font-medium whitespace-nowrap">
                          {cleanCustomerName(item.customer)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* =================================================== */}
          {/* PAGINATION */}
          {/* =================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-border bg-[#0A0E1A] px-4 sm:px-6 py-4">
            {/* Left */}
            <div className="text-xs sm:text-sm text-white text-center sm:text-left">
              Showing{" "}
              <span className="font-semibold text-white">
                {totalRecords === 0 ? 0 : startIndex + 1}
              </span>
              {" - "}
              <span className="font-semibold text-white">{endIndex}</span>
              {" of "}
              <span className="font-semibold text-white">{totalRecords}</span>{" "}
              records
            </div>

            {/* Right */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3">
              {/* Rows */}
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap text-xs sm:text-sm text-white">Rows</span>

                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 sm:h-9 border border-border bg-background px-2 font-medium text-xs sm:text-sm text-foreground outline-none transition-colors focus:border-primary"
                >
                  {[10, 20, 25, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previous */}
              <Button
                variant="outline"
                size="sm"
                fullWidth={false}
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="h-8 sm:h-9 px-3 border-[#E8C16D] bg-[#E8C16D] text-xs font-semibold text-[#0A0E1A] hover:bg-[#E8C16D]"
              >
                <ChevronLeft className="mr-0.5 h-3.5 w-3.5" />
                Prev
              </Button>

              {/* Page Indicator */}
              <div className="flex h-8 sm:h-9 min-w-[65px] items-center justify-center border border-border bg-muted px-2.5 text-xs font-semibold text-foreground">
                {currentPage} / {totalPages}
              </div>

              {/* Next */}
              <Button
                variant="outline"
                size="sm"
                fullWidth={false}
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="h-8 sm:h-9 px-3 border-[#E8C16D] bg-[#E8C16D] text-xs font-semibold text-[#0A0E1A] hover:bg-[#E8C16D]"
              >
                Next
                <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: COMBINED MATCHED PDF VIEWER */}
      {/* ======================================================== */}
      {activeTab === "combinedPdf" && (
        <div className="space-y-4 border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Combined Matched Paired PDF
              </h3>
              <p className="text-xs text-muted-foreground">
                Interleaved dispatch document (Each ZPL barcode label is immediately followed by its matching invoice)
              </p>
            </div>
            <Button
              type="button"
              onClick={downloadCombinedPdf}
              leftIcon={<Download className="h-4 w-4" />}
              className="w-full sm:w-auto border-[#E8C16D] bg-[#E8C16D] text-xs sm:text-sm font-semibold text-[#0A0E1A] hover:bg-[#0A0E1A] hover:text-[#E8C16D]"
            >
              Download PDF
            </Button>
          </div>

          {combinedPdfUrl ? (
            <div className="h-[480px] sm:h-[650px] lg:h-[750px] w-full overflow-hidden border border-border bg-[#0A0E1A]">
              <iframe
                src={`${combinedPdfUrl}#toolbar=1&navpanes=1&statusbar=1`}
                className="h-full w-full border-none"
                title="Combined Matched PDF"
              />
            </div>
          ) : (
            <div className="py-16 text-center text-xs sm:text-sm text-muted-foreground">
              PDF preview unavailable. Please use the download button above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}