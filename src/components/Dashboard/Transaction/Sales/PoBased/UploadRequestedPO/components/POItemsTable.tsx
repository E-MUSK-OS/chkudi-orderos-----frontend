"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Search,
  DollarSign,
  Boxes,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Barcode,
} from "lucide-react";
import { RequestedPOItem } from "../types/requestedPo.types";
import { isExcludedHeader } from "../utils/excelParser";
import Pagination from "@/components/ui/Pagination";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface POItemsTableProps {
  items: RequestedPOItem[];
  poNumber?: string;
  columns?: string[];
  onClose?: () => void;
  readOnly?: boolean;
  onDeletePo?: () => void;
  onItemsChange?: (updatedItems: RequestedPOItem[]) => void;
}

function getHeaderAlignment(colName: string): string {
  const norm = colName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm.includes("qty") || norm.includes("quant") || norm.includes("scanned") || norm === "hsn" || norm.includes("date")) return "text-center";
  if (norm.includes("cost") || norm.includes("price") || norm.includes("amount") || norm === "rate") return "text-right";
  return "text-left";
}

function getCellAlignment(colName: string): string {
  const norm = colName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm.includes("qty") || norm.includes("quant") || norm.includes("scanned") || norm === "hsn" || norm.includes("date")) return "text-center";
  if (norm.includes("cost") || norm.includes("price") || norm.includes("amount") || norm === "rate") return "text-right";
  return "text-left";
}

// Check if search code matches an item's ASIN or SKU (with O vs 0 normalization)
function isMatch(item: RequestedPOItem, searchCode: string): boolean {
  const s = searchCode.replace(/[\r\n\t]/g, "").trim().toLowerCase();
  if (!s) return false;

  // Support 'o' <-> '0' in case user typed letter O instead of digit 0 (e.g. BOFTG... vs B0FTG...)
  const sAlt = s.startsWith("bo") ? "b0" + s.slice(2) : s.startsWith("b0") ? "bo" + s.slice(2) : s;

  const checkVal = (val?: unknown): boolean => {
    if (!val) return false;
    const v = String(val).trim().toLowerCase();
    return v === s || v === sAlt;
  };

  if (checkVal(item.asin)) return true;
  if (checkVal(item.sku)) return true;

  if (item.rawData) {
    for (const [k, val] of Object.entries(item.rawData)) {
      const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (
        (normKey === "asin" ||
          normKey === "externalid" ||
          normKey === "sku" ||
          normKey === "modelnumber") &&
        checkVal(val)
      ) {
        return true;
      }
    }
  }

  return false;
}

function renderCellValue(
  item: RequestedPOItem,
  colName: string,
  isHighlighted: boolean = false,
  currentScanInput: string = ""
) {
  const colNorm = colName.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. Scanned Quantity Column (matches user request: shows scanned count)
  if (colNorm.includes("scanned")) {
    const scanned = item.scannedQuantity || 0;
    if (scanned > 0) {
      return (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400">
          {scanned}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 dark:bg-white/[0.04] dark:text-slate-500">
        0
      </span>
    );
  }

  // 2. Quantity Requested Column (decrements as item is scanned: e.g. 5 -> 4 -> 3...)
  if (
    colNorm.includes("requested") ||
    (colNorm.includes("qty") &&
      !colNorm.includes("asn") &&
      !colNorm.includes("received") &&
      !colNorm.includes("accepted"))
  ) {
    const initialQty = item.initialQuantity ?? item.quantity;
    const scanned = item.scannedQuantity || 0;
    const remaining = Math.max(0, initialQty - scanned);

    if (remaining === 0 && scanned > 0) {
      return (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400">
          0 ✓
        </span>
      );
    }

    return (
      <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
        {remaining}
      </span>
    );
  }

  // Look up rawData or top-level item property
  let val: unknown = item.rawData ? item.rawData[colName] : undefined;
  if ((val === undefined || val === null) && item.rawData) {
    const targetNorm = colName.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [k, v] of Object.entries(item.rawData)) {
      if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === targetNorm) {
        val = v;
        break;
      }
    }
  }
  if (val === undefined || val === null) {
    const norm = colName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (norm === "sku" || norm === "externalid") val = item.sku;
    else if (norm === "asin") val = item.asin;
    else if (norm.includes("qty") || norm.includes("quant")) val = item.quantity;
    else if (norm.includes("cost") || norm.includes("price")) val = item.unitPrice;
    else if (norm.includes("total") || norm.includes("amount")) val = item.totalAmount;
    else if (norm === "hsn") val = item.hsn;
    else val = (item as Record<string, unknown>)[colName];
  }

  if (val === undefined || val === null || String(val).trim() === "" || val === "-") {
    return <span className="text-slate-300 dark:text-slate-600">-</span>;
  }

  // SKU / ASIN / External Id: Badge
  if (colNorm === "sku" || colNorm === "externalid" || colNorm === "asin") {
    const cleanScan = currentScanInput.replace(/[\r\n\t]/g, "").trim();
    const isMatchingScan =
      cleanScan.length >= 3 &&
      (isMatch(item, cleanScan) ||
        (item.asin && item.asin.toLowerCase().includes(cleanScan.toLowerCase())));
    const isAsinHighlight = colNorm === "asin" && (isHighlighted || isMatchingScan);

    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-xl font-bold border font-mono whitespace-nowrap transition-all",
          isAsinHighlight
            ? "bg-slate-100 border-[#D4C5A5] dark:bg-white/[0.08] dark:border-[#D4C5A5]/40"
            : "bg-slate-100 text-slate-900 border-slate-200 dark:bg-white/[0.06] dark:text-[#E8C16D] dark:border-white/[0.1]"
        )}
      >
        {isAsinHighlight ? (
          <span className="bg-[#EEE2C8] text-[#0A0E1A] px-1.5 py-0.5 rounded font-bold tracking-wide">
            {String(val)}
          </span>
        ) : (
          String(val)
        )}
      </span>
    );
  }

  // Quantity columns (ASN quantity, Quantity received, Accepted quantity, etc.): Pill Badge
  if (colNorm.includes("qty") || colNorm.includes("quant")) {
    const num = Number(String(val).replace(/[^0-9.-]/g, ""));
    const displayNum = !isNaN(num) && num > 0 ? num : String(val);
    if (!displayNum || displayNum === "-") {
      return <span className="text-slate-300 dark:text-slate-600">-</span>;
    }
    return (
      <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
        {displayNum}
      </span>
    );
  }

  // Price / Cost / Amount columns: Currency formatted
  if (colNorm.includes("cost") || colNorm.includes("price") || colNorm.includes("amount") || colNorm === "rate") {
    const cleanNum = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ""));
    if (!isNaN(cleanNum) && cleanNum > 0) {
      return (
        <span className="font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
          ₹{cleanNum.toLocaleString("en-IN", { minimumFractionDigits: cleanNum % 1 !== 0 ? 2 : 0 })}
        </span>
      );
    }
    return <span className="text-slate-300 dark:text-slate-600">-</span>;
  }

  // Default clean text cell
  return (
    <span className="font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
      {String(val)}
    </span>
  );
}

export default function POItemsTable({
  items,
  poNumber,
  columns,
  onClose,
  onDeletePo,
  onItemsChange,
}: POItemsTableProps) {
  // Normalize items to ensure initialQuantity and scannedQuantity are present
  const [prevItems, setPrevItems] = useState(items);
  const [currentItems, setCurrentItems] = useState<RequestedPOItem[]>(() =>
    items.map((it) => ({
      ...it,
      initialQuantity: it.initialQuantity ?? it.quantity ?? 1,
      scannedQuantity: it.scannedQuantity ?? 0,
    }))
  );

  // Sync state when props change during render (standard React pattern without effects)
  if (items !== prevItems) {
    setPrevItems(items);
    setCurrentItems(
      items.map((it) => ({
        ...it,
        initialQuantity: it.initialQuantity ?? it.quantity ?? 1,
        scannedQuantity: it.scannedQuantity ?? 0,
      }))
    );
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Scan & Highlight state
  const [scanInput, setScanInput] = useState("");
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [inputFlash, setInputFlash] = useState<"success" | "warning" | "error" | null>(null);

  const scanInputRef = useRef<HTMLInputElement>(null);
  const isScanningRef = useRef(false);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time check: is the typed text currently a valid ASIN or SKU in this PO?
  const isInputCorrect = useMemo(() => {
    const trimmed = scanInput.replace(/[\r\n\t]/g, "").trim();
    if (trimmed.length < 3) return false;
    return currentItems.some((it) => isMatch(it, trimmed));
  }, [scanInput, currentItems]);

  // Highlight only the ASIN number inside the input when it matches an item in this PO or was just scanned
  const shouldHighlightInput = useMemo(() => {
    if (inputFlash === "success") return true;
    const trimmed = scanInput.replace(/[\r\n\t]/g, "").trim().toLowerCase();
    if (trimmed.length < 3) return false;
    return currentItems.some((it) => {
      const asin = (it.asin || "").toLowerCase();
      const sku = (it.sku || "").toLowerCase();
      return (
        asin.startsWith(trimmed) ||
        sku.startsWith(trimmed) ||
        isMatch(it, trimmed)
      );
    });
  }, [scanInput, currentItems, inputFlash]);

  // Audio feedback helper matching AWB scan sounds
  const playSound = async (type: "success" | "alreadyScanned" | "warning") => {
    if (typeof window === "undefined") return;
    try {
      const soundFile =
        type === "success"
          ? "/sounds/success.wav"
          : type === "alreadyScanned"
          ? "/sounds/alreadyScanne.wav"
          : "/sounds/warning.wav";

      const audio = new Audio(soundFile);
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.warn("Audio playback error:", error);
    }
  };

  const refocusScanInput = useCallback(() => {
    requestAnimationFrame(() => {
      scanInputRef.current?.focus();
      scanInputRef.current?.select();
    });
    const t = setTimeout(() => {
      scanInputRef.current?.focus();
      scanInputRef.current?.select();
    }, 40);
    return () => clearTimeout(t);
  }, []);

  // Auto-focus scanner input on mount
  useEffect(() => {
    refocusScanInput();
  }, [refocusScanInput]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autoScanTimerRef.current) clearTimeout(autoScanTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // Smoothly scroll the highlighted row into view
  useEffect(() => {
    if (highlightedItemId) {
      const rowEl = document.querySelector<HTMLTableRowElement>(
        `[data-po-item-id="${highlightedItemId}"]`
      );
      if (rowEl) {
        rowEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [highlightedItemId]);

  // Global keydown fallback: refocus scanner on typing if outside search/inputs
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || tagName === "select") {
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        scanInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Check if this record is legacy
  const isLegacyPO = useMemo(() => {
    return (!columns || columns.length === 0) && currentItems.length > 0 && !currentItems[0]?.rawData;
  }, [columns, currentItems]);

  // Dynamic columns strictly inserting "SCANNED QUANTITY" right after "QUANTITY REQUESTED"
  const dynamicColumns = useMemo(() => {
    let rawCols: string[] = [];
    if (columns && columns.length > 0) {
      rawCols = [...columns];
    } else if (currentItems.length > 0 && currentItems[0]?.rawData) {
      rawCols = Object.keys(currentItems[0].rawData);
    }

    let filtered = rawCols.filter((col) => !isExcludedHeader(col));

    if (filtered.length === 0) {
      filtered = [
        "ASIN",
        "SKU",
        "QUANTITY REQUESTED",
        "SCANNED QUANTITY",
        "UNIT PRICE",
        "TOTAL AMOUNT",
        "HSN",
      ];
    } else {
      // Ensure "SCANNED QUANTITY" column is present
      const hasScannedCol = filtered.some((c) => {
        const n = c.toLowerCase().replace(/[^a-z0-9]/g, "");
        return n.includes("scanned");
      });

      if (!hasScannedCol) {
        // Find index of QUANTITY REQUESTED
        const qtyReqIdx = filtered.findIndex((c) => {
          const n = c.toLowerCase().replace(/[^a-z0-9]/g, "");
          return n.includes("requested");
        });

        if (qtyReqIdx >= 0) {
          filtered.splice(qtyReqIdx + 1, 0, "SCANNED QUANTITY");
        } else {
          // If no requested col, find any quantity col
          const anyQtyIdx = filtered.findIndex((c) => {
            const n = c.toLowerCase().replace(/[^a-z0-9]/g, "");
            return n.includes("qty") || n.includes("quant");
          });
          if (anyQtyIdx >= 0) {
            filtered.splice(anyQtyIdx + 1, 0, "SCANNED QUANTITY");
          } else {
            filtered.splice(Math.min(2, filtered.length), 0, "SCANNED QUANTITY");
          }
        }
      }
    }

    return filtered;
  }, [columns, currentItems]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return currentItems;
    const q = searchQuery.toLowerCase();
    return currentItems.filter((item) => {
      if (item.sku?.toLowerCase().includes(q)) return true;
      if (item.asin?.toLowerCase().includes(q)) return true;
      if (item.hsn?.toLowerCase().includes(q)) return true;
      if (item.rawData) {
        return Object.values(item.rawData).some((v) =>
          String(v).toLowerCase().includes(q)
        );
      }
      return false;
    });
  }, [currentItems, searchQuery]);

  const totalScanned = currentItems.reduce((acc, it) => acc + (it.scannedQuantity || 0), 0);
  const totalInitialUnits = currentItems.reduce(
    (acc, it) => acc + (it.initialQuantity ?? it.quantity ?? 0),
    0
  );

  const totalAmount =
    Math.round(
      currentItems.reduce((acc, it) => acc + (it.totalAmount || 0), 0) * 100
    ) / 100;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  // Barcode / ASIN scanning handler matching AWB scan behavior
  const handleScanBarcode = async (barcodeText?: string) => {
    if (autoScanTimerRef.current) {
      clearTimeout(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    try {
      const raw = (barcodeText ?? scanInput).replace(/[\r\n\t]/g, "").trim();
      if (!raw) return;

      const clean = raw;

      // Find the item in current list where remaining requested quantity > 0
      const matchedIdx = currentItems.findIndex((it) => {
        if (!isMatch(it, clean)) return false;
        const initialQty = it.initialQuantity ?? it.quantity;
        const scanned = it.scannedQuantity || 0;
        return initialQty - scanned > 0;
      });

      if (matchedIdx >= 0) {
        // SUCCESS CASE: Increment scanned, decrement requested quantity
        const targetItem = currentItems[matchedIdx];
        const initialQty = targetItem.initialQuantity ?? targetItem.quantity;
        const newScanned = (targetItem.scannedQuantity || 0) + 1;
        const newRemaining = Math.max(0, initialQty - newScanned);

        const updatedItem: RequestedPOItem = {
          ...targetItem,
          initialQuantity: initialQty,
          scannedQuantity: newScanned,
          quantity: newRemaining,
          rawData: targetItem.rawData
            ? {
                ...targetItem.rawData,
                "SCANNED QUANTITY": newScanned,
                "Scanned Quantity": newScanned,
              }
            : undefined,
        };

        const updatedList = [...currentItems];
        updatedList[matchedIdx] = updatedItem;
        setCurrentItems(updatedList);
        onItemsChange?.(updatedList);

        // Flash input box green
        setInputFlash("success");

        // Highlight table row for 1500 milliseconds
        setHighlightedItemId(updatedItem.id);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => {
          setHighlightedItemId(null);
        }, 1500);

        // If item is on another pagination page, switch to that page automatically
        const itemIdxInFiltered = filteredItems.findIndex((it) => it.id === targetItem.id);
        if (itemIdxInFiltered >= 0) {
          const targetPage = Math.floor(itemIdxInFiltered / pageSize) + 1;
          if (targetPage !== page) setPage(targetPage);
        }

        await playSound("success");

        // Keep input green with scanned text for 350ms, then clear and refocus
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => {
          setScanInput("");
          setInputFlash(null);
          refocusScanInput();
        }, 350);

        return;
      }

      // ALREADY FULLY SCANNED CASE
      const alreadyFullItem = currentItems.find((it) => isMatch(it, clean));
      if (alreadyFullItem) {
        setInputFlash("warning");
        setHighlightedItemId(alreadyFullItem.id);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => {
          setHighlightedItemId(null);
        }, 1500);

        await playSound("alreadyScanned");
        toast.warning(`ASIN "${alreadyFullItem.asin || clean}" is already fully scanned.`);

        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => {
          setInputFlash(null);
          refocusScanInput();
        }, 700);

        return;
      }

      // NOT FOUND CASE (only triggered when explicitly pressing Enter or clicking Scan)
      setInputFlash("error");
      await playSound("warning");
      toast.error(`Invalid Barcode: ASIN "${clean}" not found.`);

      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => {
        setInputFlash(null);
        refocusScanInput();
      }, 700);
    } finally {
      isScanningRef.current = false;
    }
  };

  // Auto-scan logic on input change:
  // When number code is right, in milliseconds it automatically selects and adds!
  // Never interrupts typing with premature errors!
  const handleScanInputChange = (val: string) => {
    setScanInput(val);

    if (autoScanTimerRef.current) {
      clearTimeout(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }

    const trimmed = val.replace(/[\r\n\t]/g, "").trim();
    if (!trimmed) return;

    // Check if trimmed matches an exact ASIN or SKU in this PO
    const matchesPoItem = currentItems.some((it) => isMatch(it, trimmed));

    if (matchesPoItem) {
      // The moment the code is right, highlight input and automatically process into table after 200ms
      autoScanTimerRef.current = setTimeout(() => {
        handleScanBarcode(trimmed);
      }, 200);
    }
  };

  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.currentTarget.value;
      handleScanBarcode(val);
    }
  };

  if (items.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No line items found for this Purchase Order.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] animate-in fade-in duration-200">
      {/* Top Card Header with Summary and Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-5 border-b border-[#E7E0D2] dark:border-white/[0.06] bg-white dark:bg-[#0F1626]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shadow-xs shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
              Parsed PO Line Items {poNumber ? `(PO #${poNumber})` : ""}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredItems.length} of {currentItems.length} items from the uploaded file
            </p>
          </div>
        </div>

        {/* Totals Metric Pills, Scanned Progress & Close Button */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Total Requested Units */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] font-bold text-[#0A0E1A] dark:text-slate-200 shadow-2xs">
            <Boxes className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
            <span>Total Units: {totalInitialUnits.toLocaleString()}</span>
          </div>

          {/* Scanned Progress Pill */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition-all shadow-2xs",
              totalScanned >= totalInitialUnits && totalInitialUnits > 0
                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
                : totalScanned > 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                : "bg-[#FAF8F5] text-slate-600 border-[#E7E0D2] dark:bg-[#080B11] dark:text-slate-400 dark:border-white/[0.08]"
            )}
          >
            <CheckCircle2
              className={cn(
                "h-4 w-4",
                totalScanned >= totalInitialUnits && totalInitialUnits > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-emerald-500"
              )}
            />
            <span>
              Scanned: {totalScanned} / {totalInitialUnits}
            </span>
          </div>

          {/* Total Amount Pill */}
          {totalAmount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Total: ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Line Items View"
              className="p-1.5 ml-1 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Legacy Cached PO Notice Banner */}
      {isLegacyPO && (
        <div className="mx-4 my-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Outdated PO Data:</strong> PO #{poNumber} was saved before full column extraction. Please re-upload your Excel file to display all columns.
            </span>
          </div>
          {onDeletePo && (
            <button
              type="button"
              onClick={onDeletePo}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete & Re-upload</span>
            </button>
          )}
        </div>
      )}

      {/* Toolbar: Search Bar on Left + ASIN Scan Bar on Right */}
      <div className="px-4 py-3 bg-[#FAF8F5] dark:bg-[#0A0E1A]/40 border-b border-[#E7E0D2] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search Bar */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search in all columns..."
            className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-slate-800 dark:text-slate-100 outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-2xs"
          />
        </div>

        {/* Right: Scan ASIN Barcode Bar */}
        <div className="flex-1 min-w-[280px] sm:max-w-xl">
          <div className="relative flex items-center rounded-xl border-2 border-[#E8C16D]/80 bg-[#FFFDF5] dark:bg-[#131926] shadow-2xs focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 transition-all duration-200">
            {/* Barcode Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B88728] dark:text-[#F5C451] z-20 pointer-events-none">
              <Barcode className="h-4 w-4" />
            </div>

            {/* Highlight Backdrop: Highlights only the ASIN number with #EEE2C8 */}
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center pl-9 pr-24 pointer-events-none overflow-hidden select-none z-0"
            >
              {shouldHighlightInput && scanInput ? (
                <span className="inline-block bg-[#EEE2C8] text-transparent -ml-1 px-1 py-0.5 rounded font-mono font-bold text-xs sm:text-sm whitespace-pre">
                  {scanInput}
                </span>
              ) : null}
            </div>

            {/* Input field */}
            <input
              ref={scanInputRef}
              type="text"
              value={scanInput}
              onChange={(e) => handleScanInputChange(e.target.value)}
              onKeyDown={handleScanKeyDown}
              onFocus={refocusScanInput}
              placeholder="Scan ASIN Barcode (e.g. B0FTG237SS)..."
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "relative z-10 h-9 sm:h-10 w-full bg-transparent pl-9 pr-24 text-xs sm:text-sm font-mono font-bold outline-none",
                shouldHighlightInput && scanInput
                  ? "text-[#0A0E1A] dark:text-[#0A0E1A]"
                  : "text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal"
              )}
            />

            {/* Scan button */}
            <button
              type="button"
              onClick={() => handleScanBarcode()}
              disabled={!scanInput.trim()}
              className="absolute right-1.5 h-7 sm:h-7.5 rounded-lg px-3.5 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] z-20"
            >
              Scan
            </button>
          </div>
        </div>
      </div>

      {/* Items Table matching signature OrderOS Dark & Gold table style */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left border-collapse">
          {/* Header styled with Dark Obsidian & Gold palette */}
          <thead className="border-b border-[#F5E6BE] bg-[#FEFAEE] dark:bg-none dark:border-white/[0.08] dark:bg-[#080B11] select-none">
            <tr>
              <th className="px-4 py-3.5 w-14 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
                #
              </th>
              {dynamicColumns.map((colName) => (
                <th
                  key={colName}
                  className={`px-4 py-3.5 ${getHeaderAlignment(colName)} text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap`}
                >
                  {colName}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-xs">
            {paginatedItems.map((item, idx) => {
              const isHighlighted = highlightedItemId === item.id;
              return (
                <tr
                  key={item.id || idx}
                  data-po-item-id={item.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                >
                  {/* Line number */}
                  <td className="px-4 py-3.5 text-center text-slate-400 font-medium">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>

                  {/* Dynamic columns */}
                  {dynamicColumns.map((colName) => (
                    <td
                      key={colName}
                      className={`px-4 py-3.5 ${getCellAlignment(colName)}`}
                    >
                      {renderCellValue(item, colName, isHighlighted, scanInput)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        totalRecords={filteredItems.length}
        total={filteredItems.length}
        pageSize={pageSize}
        limit={pageSize}
        itemName="records"
        variant="light"
        options={[10, 20, 50, 100]}
        className="border-t border-[#F1E8D0] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onLimitChange={setPageSize}
      />
    </div>
  );
}
