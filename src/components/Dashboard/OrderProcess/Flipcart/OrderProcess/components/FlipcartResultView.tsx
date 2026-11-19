"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import { Checkbox } from "@/components/ui/checkbox";
import Pagination from "@/components/ui/Pagination";
import {
  Printer,
  Download,
  RotateCcw,
  FileText,
  CheckCircle2,
  Loader2,
  Zap,
  X,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { PDFDocument } from "pdf-lib";
import { toast } from "sonner";
import {
  getOrLoadFlipcartShippingDoc,
  getCachedFlipcartDocs,
  getOrGenerateSingleFlipcartOrderPdf,
  getCachedFlipcartOrderPdf,
  setCachedFlipcartOrderPdf,
  startBackgroundFlipcartPdfPrewarming,
  clearCachedFlipcartDocs,
  fastBase64ToUint8Array,
} from "../utils/flipcartPdfCache";
import { useFlipcartOrderStore } from "../store/useFlipcartOrderStore";
import { FlipcartPdfViewType, FlipcartOrderItem, FlipcartOrderLineItem } from "../types";
import {
  chromeExtensionPrintService,
  resolveCurrentlyConnectedPrinter,
  isPrinterConnectedAndOnline,
  invalidatePrinterCache,
} from "@/components/Dashboard/Labels/services/printAgent.service";
import { flipcartImportService } from "@/components/Dashboard/Products/ManageProducts/services/flipcartImport.service";
import {
  generateFlipcartPicklist,
  downloadFlipcartPicklistExcel,
  downloadFlipcartPicklistPDF,
  openFlipcartPicklistPDF,
  openFlipcartPicklistTab,
} from "../utils/generateFlipcartPicklist";
import { FlipcartSummaryCards } from "./FlipcartSummaryCards";
import { socket } from "@/lib/socket";
import FlipcartMissingSkuModal from "./FlipcartMissingSkuModal";
import FlipcartOrderTable from "./FlipcartOrderTable";
import FlipcartPdfPreview from "./FlipcartPdfPreview";
import FlipcartPicklistModal from "./FlipcartPicklistModal";
import { productService } from "@/components/Dashboard/Products/ManageProducts/services/product.service";
import { productVariantService } from "@/components/Dashboard/Products/ManageProducts/services/productVariant.service";
import {
  flipcartOrderService,
  FlipcartPrintedOrderPayload,
} from "../services/flipcartOrder.service";

export interface OrderItemRequirement {
  sku: string;
  fsn?: string;
  requiredQty: number;
  scannedQty: number;
}

export const getOrderTypeForItem = (
  item: FlipcartOrderItem
): "single_quantity" | "multiple_sku" | "multiple_pieces" => {
  const numItems =
    item.items?.length ||
    (item.sku ? item.sku.split("/").filter(Boolean).length : 1);
  const qty = item.totalQuantity || 1;
  if (numItems > 1) {
    return "multiple_sku";
  }
  if (qty > 1) {
    return "multiple_pieces";
  }
  return "single_quantity";
};

export const getOrderTypeLabel = (type: string): string => {
  switch (type) {
    case "single_quantity":
      return "Single Quantity";
    case "multiple_sku":
      return "Multiple FSN/SKU";
    case "multiple_pieces":
      return "Multiple Pieces";
    default:
      return "Single Quantity";
  }
};

export default function FlipcartResultView() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    summary,
    files,
    shippingLabelsPdfUrl,
    taxInvoicesPdfUrl,
    originalPdfUrl,
    printedCount,
    clearProcessData,
    restoreProcessData,
    downloadShippingLabelsPdf,
    downloadTaxInvoicesPdf,
    downloadOriginalPdf,
    activeHistoryBatchId,
    initialShowPrinted,
  } = useFlipcartOrderStore();

  const [isLoading, setIsLoading] = useState(!summary);
  const [activeTab, setActiveTab] = useState<"table" | "pdf">("table");
  const [selectedView, setSelectedView] = useState<FlipcartPdfViewType>("shipping_labels");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("single_quantity");
  const [showPrinted, setShowPrinted] = useState(false);

  // Pagination & Row selection
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Dynamic Viewport Height & Stop-Scrolling Coordinators
  const containerRef = useRef<HTMLDivElement>(null);
  const topCardRef = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Database SKU Mappings
  const [skuDetailsMap, setSkuDetailsMap] = useState<
    Map<string, { fsn?: string; rackAddress?: string }>
  >(new Map());
  const skuDetailsMapRef = useRef<Map<string, { fsn?: string; rackAddress?: string }>>(new Map());
  const [isMappingsLoading, setIsMappingsLoading] = useState(true);
  const [isGeneratingPicklist, setIsGeneratingPicklist] = useState(false);
  const [isMissingSkuModalOpen, setIsMissingSkuModalOpen] = useState(false);
  const [modalMissingSkus, setModalMissingSkus] = useState<string[]>([]);
  const [isPicklistModalOpen, setIsPicklistModalOpen] = useState(false);

  // Printer Management & Silent Printing State
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("flipcart_selected_printer") ||
        localStorage.getItem("lastUsedPrinter") ||
        ""
      );
    }
    return "";
  });
  const lastVerifiedPrinterRef = useRef<{
    printerName: string;
    timestamp: number;
  } | null>(
    typeof window !== "undefined" &&
      (localStorage.getItem("flipcart_selected_printer") ||
        localStorage.getItem("lastUsedPrinter"))
      ? {
          printerName: (localStorage.getItem("flipcart_selected_printer") ||
            localStorage.getItem("lastUsedPrinter"))!,
          timestamp: Date.now(),
        }
      : null
  );
  const printQueuePromiseRef = useRef<Promise<void>>(Promise.resolve());
  const orderPrintPdfCacheRef = useRef<Map<number, string>>(new Map());
  const orderScanProgressRef = useRef<Map<number, OrderItemRequirement[]>>(new Map());

  // Check and restore data on initial mount (runs once on mount)
  const isRestoringRef = useRef(false);
  useEffect(() => {
    // If summary is already present in store, batch data is loaded!
    if (useFlipcartOrderStore.getState().summary) {
      setIsLoading(false);
      return;
    }

    if (isRestoringRef.current) return;
    isRestoringRef.current = true;

    restoreProcessData().then((hasData) => {
      if (!hasData) {
        toast.info("No active batch found. Please upload PDF files to process.");
        router.push("/dashboard/order-process/flipcart/order-process");
      } else {
        setIsLoading(false);
      }
    });
  }, [restoreProcessData, router]);

  // Load available local printers
  useEffect(() => {
    let isMounted = true;
    async function loadPrinters() {
      try {
        const details = await chromeExtensionPrintService.getPrintersDetailed();
        let list = details.map((p) => p.name).filter(Boolean);
        if (!list || list.length === 0) {
          list = await chromeExtensionPrintService.getPrinters();
        }
        if (isMounted && list && list.length > 0) {
          setAvailablePrinters(list);

          const saved =
            typeof window !== "undefined"
              ? localStorage.getItem("flipcart_selected_printer") ||
                localStorage.getItem("lastUsedPrinter")
              : null;

          setSelectedPrinter((current) => {
            const candidate = current || saved;
            if (candidate) {
              const matched = list.find(
                (p) => p.toLowerCase().trim() === candidate.toLowerCase().trim()
              );
              if (matched) {
                lastVerifiedPrinterRef.current = {
                  printerName: matched,
                  timestamp: Date.now(),
                };
                if (typeof window !== "undefined") {
                  localStorage.setItem("flipcart_selected_printer", matched);
                  localStorage.setItem("lastUsedPrinter", matched);
                }
                return matched;
              }
            }

            const { printer: preferred } = resolveCurrentlyConnectedPrinter(list, details);
            const chosen = preferred && list.includes(preferred) ? preferred : list[0];
            lastVerifiedPrinterRef.current = {
              printerName: chosen,
              timestamp: Date.now(),
            };
            if (typeof window !== "undefined" && chosen) {
              localStorage.setItem("flipcart_selected_printer", chosen);
              localStorage.setItem("lastUsedPrinter", chosen);
            }
            return chosen;
          });
        }
      } catch (e) {
        console.warn("Could not load local printers:", e);
      }
    }
    loadPrinters();
    const t1 = setTimeout(loadPrinters, 400);
    const t2 = setTimeout(loadPrinters, 1500);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Strict unmount cleanup: destroy in-memory PDF caches and clear scan progress
  useEffect(() => {
    return () => {
      clearCachedFlipcartDocs();
      orderPrintPdfCacheRef.current.clear();
      orderScanProgressRef.current.clear();
    };
  }, []);

  // Strictly compute unique missing SKUs across all orders
  const computeMissingSkus = useCallback(
    (detailsMap: Map<string, { fsn?: string; rackAddress?: string }>) => {
      const missing = new Set<string>();
      const orders = summary?.orders || [];

      orders.forEach((order) => {
        const tokens: string[] = [];

        if (order.items && order.items.length > 0) {
          order.items.forEach((it) => {
            const hasExistingFsn =
              it.fsn &&
              it.fsn.trim() !== "" &&
              it.fsn.trim() !== "—" &&
              it.fsn.trim() !== "-";
            const hasExistingRack =
              it.rackAddress &&
              it.rackAddress.trim() !== "" &&
              it.rackAddress.trim() !== "Not assigned" &&
              it.rackAddress.trim() !== "-";

            if (hasExistingFsn || hasExistingRack) {
              return;
            }

            if (it.sku) {
              it.sku
                .split(/[\r\n\/,+|]+/)
                .map((p) => p.trim())
                .filter(Boolean)
                .forEach((s) => tokens.push(s));
            }
          });
        } else if (order.sku) {
          const hasExistingFsn =
            order.fsn &&
            order.fsn.trim() !== "" &&
            order.fsn.trim() !== "—" &&
            order.fsn.trim() !== "-";
          const hasExistingRack =
            order.rackAddress &&
            order.rackAddress.trim() !== "" &&
            order.rackAddress.trim() !== "Not assigned" &&
            order.rackAddress.trim() !== "-";

          if (hasExistingFsn || hasExistingRack) {
            return;
          }

          order.sku
            .split(/[\r\n\/,+|]+/)
            .map((p) => p.trim())
            .filter(Boolean)
            .forEach((s) => tokens.push(s));
        }

        tokens.forEach((t) => {
          const raw = t.trim();
          if (!raw || raw === "N/A" || raw === "-" || /^OD\d+/i.test(raw)) return;
          const lower = raw.toLowerCase();
          const mapped = detailsMap.get(lower);
          if (!mapped || (!mapped.fsn && !mapped.rackAddress)) {
            missing.add(raw);
          }
        });
      });

      return Array.from(missing);
    },
    [summary?.orders]
  );

  // Fetch FlipcartImports from DB to match FSN & RackAddress by SKU (Primary: FlipcartImports, Fallback: Products, Variants)
  const fetchFlipcartMappings = useCallback(async (): Promise<{
    success: boolean;
    remainingCount: number;
    map: Map<string, { fsn?: string; rackAddress?: string }>;
  }> => {
    try {
      setIsMappingsLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "";
      const map = new Map<string, { fsn?: string; rackAddress?: string }>();

      const mergeMapping = (key?: string | null, fsn?: string | null, rack?: string | null) => {
        if (!key) return;
        const cleanKey = String(key).trim();
        const lowerKey = cleanKey.toLowerCase();
        if (!lowerKey || lowerKey === "n/a" || lowerKey === "-" || lowerKey === "—") return;

        const cleanFsn = fsn && typeof fsn === "string" ? fsn.trim() : "";
        const cleanRack = rack && typeof rack === "string" ? rack.trim() : "";

        const existing = map.get(lowerKey) || { fsn: "", rackAddress: "" };
        const updated = {
          fsn: cleanFsn || existing.fsn || "",
          rackAddress: cleanRack || existing.rackAddress || "",
        };

        map.set(lowerKey, updated);
        if (cleanKey !== lowerKey) {
          map.set(cleanKey, updated);
        }
      };

      // ==========================================
      // FAST TARGETED RESOLUTION: Query backend for only the batch's specific SKUs
      // across FlipcartImports, Products, and ProductVariants in < 30ms
      // ==========================================
      const initialMissing = computeMissingSkus(map);
      if (initialMissing.length > 0) {
        try {
          const res = await flipcartImportService.resolveSkus(initialMissing, token);
          if (res?.data && Array.isArray(res.data)) {
            res.data.forEach((item: any) => {
              const rawSku = item.sku || "";
              const rawFsn = item.fsn || "";
              const rawRack = item.rackAddress || "";
              if (rawSku) mergeMapping(rawSku, rawFsn, rawRack);
              if (rawFsn) mergeMapping(rawFsn, rawFsn, rawRack);
            });
          }
        } catch (resolveErr) {
          console.warn("Targeted SKU resolution fallback:", resolveErr);
          // Graceful fallback: targeted single-SKU queries for top unresolved items
          const urgentSkus = initialMissing.slice(0, 15);
          await Promise.all(
            urgentSkus.map(async (sku) => {
              try {
                const res = await flipcartImportService.getAll(sku, token);
                if (res?.data && Array.isArray(res.data)) {
                  res.data.forEach((item: any) => {
                    const rawSku = item.sku || "";
                    const rawFsn = item.fsn || "";
                    const rawRack = item.rackAddress || "";
                    if (rawSku) mergeMapping(rawSku, rawFsn, rawRack);
                    if (rawFsn) mergeMapping(rawFsn, rawFsn, rawRack);
                  });
                }
              } catch (e) {
                console.warn(`Fallback fetch failed for ${sku}:`, e);
              }
            })
          );
        }
      }

      skuDetailsMapRef.current = map;
      setSkuDetailsMap(map);

      // Evaluate missing SKUs against full database truth
      const stillMissing = computeMissingSkus(map);
      setModalMissingSkus(stillMissing);

      if (stillMissing.length === 0) {
        setIsMissingSkuModalOpen(false);
        return { success: true, remainingCount: 0, map };
      } else {
        return { success: false, remainingCount: stillMissing.length, map };
      }
    } catch (err) {
      console.error("Failed to query Flipkart mappings from database:", err);
      return { success: false, remainingCount: 0, map: new Map() };
    } finally {
      setIsMappingsLoading(false);
    }
  }, [computeMissingSkus]);

  // Sync mappings on mount or whenever batch summary changes
  const activeBatchSignature =
    (summary as any)?.id || (summary as any)?.batchId || summary?.pdfFileName;
  useEffect(() => {
    if (summary) {
      fetchFlipcartMappings();
    }
  }, [activeBatchSignature, fetchFlipcartMappings]);

  // Auto-open Missing SKU Modal ONLY after DB mappings load and genuine missing SKUs exist
  useEffect(() => {
    if (isMappingsLoading || !summary) return;
    if (modalMissingSkus.length > 0) {
      setIsMissingSkuModalOpen(true);
    } else {
      setIsMissingSkuModalOpen(false);
    }
  }, [isMappingsLoading, modalMissingSkus.length, summary]);

  // Merge orders from PDF with DB mappings (FSN, RackAddress)
  const mappedOrders = useMemo<FlipcartOrderItem[]>(() => {
    const orders = summary?.orders || [];
    return orders.map((order, idx) => {
      // Build normalized line items:
      // If order.items is available, use it. Otherwise, if order.sku contains "/", split it.
      const rawItems: FlipcartOrderLineItem[] =
        order.items && order.items.length > 0
          ? order.items
          : (order.sku || "")
              .split("/")
              .map((s) => ({
                sku: s.trim(),
                quantity: 1,
                description: order.description,
                fsn: "",
                rackAddress: "",
              }))
              .filter((it) => Boolean(it.sku));

      const mappedItems: FlipcartOrderLineItem[] = rawItems.map((it) => {
        const cleanItemSku = (it.sku || "").trim();
        const normItemSku = cleanItemSku.toLowerCase();
        const itemMapped =
          skuDetailsMap.get(normItemSku) || skuDetailsMap.get(cleanItemSku);
        return {
          ...it,
          sku: cleanItemSku,
          fsn: itemMapped?.fsn || it.fsn || "",
          rackAddress: itemMapped?.rackAddress || it.rackAddress || "",
        };
      });

      // Combined FSN:
      // For single SKU: "FSN1"
      // For multiple SKUs (2, 3, 4, etc.): "FSN1 / FSN2 / FSN3"
      let combinedFsn = "";
      if (mappedItems.length > 0) {
        combinedFsn = mappedItems.map((it) => it.fsn || "—").join(" / ");
      } else {
        const cleanSku = (order.sku || "").trim();
        const mapped =
          skuDetailsMap.get(cleanSku.toLowerCase()) ||
          skuDetailsMap.get(cleanSku);
        combinedFsn = mapped?.fsn || order.fsn || "—";
      }
      if (!combinedFsn || combinedFsn === "—") {
        combinedFsn = order.fsn || "—";
      }

      // Combined RackAddress
      const rackList = mappedItems
        .map((it) => it.rackAddress)
        .filter((r): r is string => Boolean(r && r !== "Not assigned" && r !== "-"));
      const uniqueRacks = Array.from(new Set(rackList));
      const combinedRack =
        uniqueRacks.length > 0
          ? uniqueRacks.join(" / ")
          : order.rackAddress && order.rackAddress !== "-"
          ? order.rackAddress
          : "Not assigned";

      const isMatched =
        mappedItems.length > 0
          ? mappedItems.every((it) =>
              Boolean(
                (it.fsn && it.fsn !== "—" && it.fsn !== "-") ||
                  (it.rackAddress &&
                    it.rackAddress !== "Not assigned" &&
                    it.rackAddress !== "-")
              )
            )
          : Boolean(
              (order.fsn && order.fsn !== "—" && order.fsn !== "-") ||
                (order.rackAddress &&
                  order.rackAddress !== "Not assigned" &&
                  order.rackAddress !== "-") ||
                skuDetailsMap.get((order.sku || "").trim().toLowerCase())
            );

      return {
        ...order,
        index: typeof order.index === "number" ? order.index : idx,
        fsn: combinedFsn || "—",
        rackAddress: combinedRack,
        isMatched,
        items: mappedItems,
      };
    });
  }, [summary?.orders, skuDetailsMap]);

  // Dynamic missing SKUs derived from current state for actions/guards
  const missingSkus = modalMissingSkus;

  // =========================================================================
  // STOP SCROLLING & DYNAMIC VIEWPORT HEIGHT COORDINATOR (SAME AS AMAZON)
  // =========================================================================
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setTargetHeight(null);
      return;
    }
    if (!containerRef.current) return;
    const scrollContainer = containerRef.current.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const style = window.getComputedStyle(scrollContainer);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    const available = scrollContainer.clientHeight - paddingTop - paddingBottom;
    if (available > 320) {
      setTargetHeight(Math.floor(available));
    }
  }, []);

  useEffect(() => {
    calculateHeight();
    const timer = setTimeout(calculateHeight, 150);

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    window.addEventListener("resize", calculateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (scrollContainer && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });
      resizeObserver.observe(scrollContainer);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
      resizeObserver?.disconnect();
    };
  }, [calculateHeight, summary, isLoading]);

  // Seamless scroll coordinator:
  // 1. When scrolling down, outer page scrolls until Header & Stats Cards are hidden and stops at the fixed position.
  // 2. Once at the fixed position, scrolling down over the table scrolls the table rows internally.
  // 3. When scrolling up, table scrolls up to the first row; then scrolling up reveals the Header & Stats Cards.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;

      const tableContainer = tableContainerRef.current;
      const maxPageScroll = Math.max(
        0,
        scrollContainer.scrollHeight - scrollContainer.clientHeight
      );
      if (maxPageScroll <= 0) return;

      // Distance from top of scroll container to the "Shipping Data" row
      const row1Rect = row1Ref.current?.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const distanceToRow1 = row1Rect ? (row1Rect.top - containerRect.top) : maxPageScroll;
      const isRow1AtTop = distanceToRow1 <= 2;
      const isPageAtTop = scrollContainer.scrollTop <= 4;

      if (activeTab === "pdf") {
        // Distance from top of scroll container to the PDF Preview Card ("Flipcart Shipping Labels")
        const previewRect = previewCardRef.current?.getBoundingClientRect();
        const distanceToPreview = previewRect ? previewRect.top - containerRect.top : maxPageScroll;
        const isPreviewAtTop = distanceToPreview <= 2;

        if (e.deltaY > 0) {
          // Scrolling DOWN: scroll outer page down until the Preview Card ("Flipcart Shipping Labels") reaches the top
          if (!isPreviewAtTop && scrollContainer.scrollTop < maxPageScroll) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.min(
              maxPageScroll,
              scrollContainer.scrollTop + Math.min(e.deltaY, Math.max(1, distanceToPreview))
            );
          } else {
            // Preview Card is docked at top: strictly stop scrolling that page down
            e.preventDefault();
          }
        } else if (e.deltaY < 0) {
          // Scrolling UP: reveal Row 1 & Header/Cards
          if (!isPageAtTop) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        }
        return;
      }

      // For Table view:
      const isOverTable =
        tableContainer &&
        (e.composedPath().includes(tableContainer) ||
          tableContainer.contains(e.target as Node));

      if (e.deltaY > 0) {
        // Scrolling DOWN
        if (!isRow1AtTop && scrollContainer.scrollTop < maxPageScroll) {
          // Outer page has not reached "Shipping Data" at top yet -> scroll page down
          e.preventDefault();
          scrollContainer.scrollTop = Math.min(
            maxPageScroll,
            scrollContainer.scrollTop + Math.min(e.deltaY, Math.max(1, distanceToRow1))
          );
        } else if (!isOverTable) {
          // "Shipping Data" reached the top and mouse is outside table -> forward scroll to table
          if (tableContainer) {
            tableContainer.scrollTop += e.deltaY;
          }
        }
        // If isRow1AtTop and isOverTable, allow table to scroll natively
      } else if (e.deltaY < 0) {
        // Scrolling UP
        if (!isOverTable) {
          if (!isPageAtTop) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        } else {
          const isTableAtTop = !tableContainer || tableContainer.scrollTop <= 3;
          if (isTableAtTop && !isPageAtTop) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        }
      }
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, [summary, isLoading, activeTab]);

  // Reset table scroll on page/limit change
  useEffect(() => {
    tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, limit]);

  // Auto-focus barcode scanner input when table tab is active
  const autoPrintInputRef = useRef<HTMLInputElement>(null);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [autoPrintQuery, setAutoPrintQuery] = useState("");
  const printedOrdersRef = useRef<Set<number>>(
    new Set(Array.isArray((summary as any)?.printedIndices) ? (summary as any).printedIndices : [])
  );
  const [printedOrders, setPrintedOrders] = useState<Set<number>>(() => {
    const existing = (summary as any)?.printedIndices;
    if (Array.isArray(existing) && existing.length > 0) {
      return new Set(existing);
    }
    return new Set();
  });
  const [isScanningPrint, setIsScanningPrint] = useState(false);
  const persistedIndicesRef = useRef<Set<number>>(
    new Set(Array.isArray((summary as any)?.printedIndices) ? (summary as any).printedIndices : [])
  );

  // Synchronous helpers to immediately transition rows to "Printed" and sync Zustand store without setState-in-render
  const markOrdersAsPrinted = useCallback((pageIndices: number[]) => {
    pageIndices.forEach((idx) => {
      printedOrdersRef.current.add(idx);
      persistedIndicesRef.current.add(idx);
    });
    const newSet = new Set(printedOrdersRef.current);
    setPrintedOrders(newSet);

    // Synchronize Zustand store
    useFlipcartOrderStore.setState((state) => ({
      printedCount: newSet.size,
      summary: state.summary
        ? {
            ...state.summary,
            printedIndices: Array.from(newSet),
            printedCount: newSet.size,
          }
        : state.summary,
    }));
  }, []);

  const unmarkOrdersAsPrinted = useCallback((pageIndices: number[]) => {
    pageIndices.forEach((idx) => {
      printedOrdersRef.current.delete(idx);
      persistedIndicesRef.current.delete(idx);
    });
    const newSet = new Set(printedOrdersRef.current);
    setPrintedOrders(newSet);

    useFlipcartOrderStore.setState((state) => ({
      printedCount: newSet.size,
      summary: state.summary
        ? {
            ...state.summary,
            printedIndices: Array.from(newSet),
            printedCount: newSet.size,
          }
        : state.summary,
    }));
  }, []);

  // Auto-sync printed status from database for historical batches so all printed orders appear in the table
  useEffect(() => {
    const existing = (summary as any)?.printedIndices;
    if (Array.isArray(existing) && existing.length > 0) {
      const existingSet = new Set<number>(existing);
      printedOrdersRef.current = existingSet;
      setPrintedOrders(existingSet);
      existing.forEach((idx: number) => persistedIndicesRef.current.add(idx));
    }
  }, [summary, activeHistoryBatchId]);

  useEffect(() => {
    if (initialShowPrinted) {
      setShowPrinted(true);
    }
  }, [initialShowPrinted]);

  // Persist printed orders into FlipcartOrders table in background
  const persistPrintedOrdersToDb = useCallback(
    async (orders: FlipcartOrderItem[], isExplicitPrint = true) => {
      if (!orders || orders.length === 0) return;
      const eligibleItems = orders.filter((o) => {
        const cleanAwb = (o.awb || "").trim().toUpperCase();
        const cleanOrder = (o.orderId || "").trim().toUpperCase();
        const hasAwb = cleanAwb && cleanAwb !== "N/A" && cleanAwb !== "-";
        const hasOrder = cleanOrder && cleanOrder !== "N/A" && cleanOrder !== "-";
        if (!hasAwb && !hasOrder) return false;
        if (!isExplicitPrint && persistedIndicesRef.current.has(o.pageIndex)) return false;
        return true;
      });
      if (eligibleItems.length === 0) return;

      eligibleItems.forEach((o) => persistedIndicesRef.current.add(o.pageIndex));

      try {
        const ordersToSave: FlipcartPrintedOrderPayload[] = eligibleItems.map((item) => ({
          orderId: (item.orderId || "N/A").trim(),
          awb: (item.awb || "N/A").trim(),
          fsn: (item.fsn || "N/A").trim(),
          sku: (item.sku || "N/A").trim(),
          customer: (item.customerName || "N/A").trim(),
          totalQuantity: item.totalQuantity || 1,
          packingScanStatus: "PENDING",
          isExplicitPrint,
        }));

        let targetBatchId =
          activeHistoryBatchId || (summary as any)?.id || (summary as any)?.batchId;

        if (!targetBatchId && useFlipcartOrderStore.getState().historySyncStatus === "syncing") {
          for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise((r) => setTimeout(r, 500));
            targetBatchId =
              useFlipcartOrderStore.getState().activeHistoryBatchId ||
              (summary as any)?.id ||
              (summary as any)?.batchId;
            if (targetBatchId) break;
          }
        }

        try {
          await flipcartOrderService.savePrintedOrders(
            ordersToSave,
            undefined,
            targetBatchId || undefined
          );
        } catch (initialErr) {
          console.warn("Primary Flipcart save with targetBatchId failed, retrying without batchId:", initialErr);
          await flipcartOrderService.savePrintedOrders(
            ordersToSave,
            undefined,
            undefined
          );
        }
      } catch (saveErr) {
        console.warn("Background Flipcart order save error:", saveErr);
        eligibleItems.forEach((item) => {
          persistedIndicesRef.current.delete(item.pageIndex);
        });
        toast.error("Could not sync printed orders to AWB Scan database. Please check connection.", {
          id: "flipcart-awb-scan-sync-error",
          duration: 5000,
        });
      }
    },
    [activeHistoryBatchId, summary]
  );

  // Synchronize newly printed orders into AWB Scan database in background so none are left behind
  useEffect(() => {
    if (mappedOrders.length > 0 && printedOrders.size > 0) {
      const newlyPrintedItems = mappedOrders.filter(
        (r) => printedOrders.has(r.pageIndex) && !persistedIndicesRef.current.has(r.pageIndex)
      );
      if (newlyPrintedItems.length > 0) {
        newlyPrintedItems.forEach((r) => persistedIndicesRef.current.add(r.pageIndex));
        persistPrintedOrdersToDb(newlyPrintedItems, false);
      }
    }
  }, [mappedOrders, printedOrders, persistPrintedOrdersToDb]);

  // Historical Batch: auto-sync printed status from DB so all previously printed orders appear in the table
  useEffect(() => {
    if (!activeHistoryBatchId) return;

    let isCancelled = false;
    const syncPrintedFromDb = async () => {
      if (!mappedOrders || mappedOrders.length === 0) return;
      try {
        const queryStr = `?batchId=${encodeURIComponent(activeHistoryBatchId)}&limit=5000`;
        const res = await flipcartOrderService.getOrders(queryStr);
        if (isCancelled || !res?.data || !Array.isArray(res.data)) return;

        const dbPrintedOrderIds = new Set<string>();
        const dbPrintedAwbs = new Set<string>();

        res.data.forEach((o) => {
          if (o.orderId && o.orderId !== "N/A") dbPrintedOrderIds.add(o.orderId.trim().toUpperCase());
          if (o.awb && o.awb !== "N/A" && o.awb !== "-") dbPrintedAwbs.add(o.awb.trim().toUpperCase());
        });

        const matchedIndices: number[] = [];
        mappedOrders.forEach((item) => {
          const itemOrder = (item.orderId || "").trim().toUpperCase();
          const itemAwb = (item.awb || "").trim().toUpperCase();
          if (
            (itemAwb && dbPrintedAwbs.has(itemAwb)) ||
            (itemOrder && dbPrintedOrderIds.has(itemOrder))
          ) {
            matchedIndices.push(item.pageIndex);
          }
        });

        if (matchedIndices.length > 0 && !isCancelled) {
          markOrdersAsPrinted(matchedIndices);
        }
      } catch (e) {
        console.warn("Failed to sync historical printed orders from DB:", e);
      }
    };

    syncPrintedFromDb();
    return () => {
      isCancelled = true;
    };
  }, [activeHistoryBatchId, mappedOrders, markOrdersAsPrinted]);

  // Socket listener for real-time printed updates across PCs (matching Amazon)
  useEffect(() => {
    if (typeof window === "undefined" || !socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    const emitJoin = () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user?.id) {
            socket.emit("join:user", user.id);
          }
        } catch (error) {
          console.error("Failed to parse user for socket in FlipcartResultView:", error);
        }
      }
    };

    emitJoin();
    socket.on("connect", emitJoin);

    const handlePrinted = (data: { batchId?: string; awbs?: string[]; orderIds?: string[] }) => {
      let targetBatchId = activeHistoryBatchId || (summary as any)?.id || (summary as any)?.batchId;
      if (data.batchId && data.batchId !== targetBatchId) {
        return; // belongs to a different batch
      }

      const newlyPrintedAwbs = new Set((data.awbs || []).map((a) => a.trim().toUpperCase()));
      const newlyPrintedOrders = new Set((data.orderIds || []).map((o) => o.trim().toUpperCase()));
      let changed = false;
      const newPrintedOrders = new Set(printedOrdersRef.current);

      mappedOrders.forEach((item) => {
        const cleanAwb = (item.awb || "").trim().toUpperCase();
        const cleanOrderId = (item.orderId || "").trim().toUpperCase();
        const isMatch =
          (cleanAwb && newlyPrintedAwbs.has(cleanAwb)) ||
          (cleanOrderId && newlyPrintedOrders.has(cleanOrderId));
        if (isMatch) {
          if (!newPrintedOrders.has(item.pageIndex)) {
            newPrintedOrders.add(item.pageIndex);
            persistedIndicesRef.current.add(item.pageIndex);
            changed = true;
          }
        }
      });

      if (changed) {
        printedOrdersRef.current = newPrintedOrders;
        setPrintedOrders(newPrintedOrders);
        useFlipcartOrderStore.setState((state) => ({
          printedCount: newPrintedOrders.size,
          summary: state.summary
            ? {
                ...state.summary,
                printedIndices: Array.from(newPrintedOrders),
                printedCount: newPrintedOrders.size,
              }
            : state.summary,
        }));
      }
    };

    socket.on("flipcartOrderPrinted", handlePrinted);

    return () => {
      socket.off("connect", emitJoin);
      socket.off("flipcartOrderPrinted", handlePrinted);
    };
  }, [mappedOrders, activeHistoryBatchId, summary]);

  useEffect(() => {
    if (activeTab === "table") {
      const timer = setTimeout(() => {
        autoPrintInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Global scanner redirect: if operator scans without clicking input, auto focus
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute("contenteditable") === "true";

      if (!isInput && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        autoPrintInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  const selectThemeStyles = useMemo(
    () => ({
      borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#0A0E1A",
      backgroundColor: "#0A0E1A",
      textColor: "#E8C16D",
      placeholderColor: "#E8C16D",
      menuBackgroundColor: "#0A0E1A",
      optionHoverColor: "#161D2E",
      optionSelectedColor: "#E8C16D",
      optionSelectedTextColor: "#0A0E1A",
      optionTextColor: "#ffffff",
      menuPortalTarget: typeof window !== "undefined" ? document.body : undefined,
    }),
    [isDark]
  );

  const viewOptions: SelectOption[] = useMemo(
    () => [
      {
        label: `Shipping Labels (${summary?.totalOrders ?? 0})`,
        value: "shipping_labels",
      },
      {
        label: `Tax Invoices (${summary?.totalOrders ?? 0})`,
        value: "tax_invoices",
      },
      {
        label: `Original Uploaded PDF (${summary?.totalOrders ?? 0})`,
        value: "original_pdf",
      },
    ],
    [summary?.totalOrders]
  );

  const printerOptions: SelectOption[] = useMemo(
    () =>
      availablePrinters.map((p) => ({
        label: p,
        value: p,
      })),
    [availablePrinters]
  );

  const orderTypeCounts = useMemo(() => {
    const counts = {
      single_quantity: 0,
      multiple_sku: 0,
      multiple_pieces: 0,
    };
    mappedOrders.forEach((item) => {
      const isPrinted = printedOrders.has(item.pageIndex);
      if (showPrinted ? !isPrinted : isPrinted) return;

      const qty = item.totalQuantity || 1;
      const numItems = item.items?.length || 1;

      if (numItems > 1) {
        counts.multiple_sku++;
      } else if (qty > 1) {
        counts.multiple_pieces++;
      } else {
        counts.single_quantity++;
      }
    });
    return counts;
  }, [mappedOrders, printedOrders, showPrinted]);

  const orderTypeOptions: SelectOption[] = useMemo(
    () => [
      { label: `Single Quantity (${orderTypeCounts.single_quantity})`, value: "single_quantity" },
      { label: `Multiple FSN (${orderTypeCounts.multiple_sku})`, value: "multiple_sku" },
      { label: `Multiple Pieces (${orderTypeCounts.multiple_pieces})`, value: "multiple_pieces" },
    ],
    [orderTypeCounts]
  );

  // Current PDF configuration
  const currentConfig = useMemo(() => {
    switch (selectedView) {
      case "shipping_labels":
        return {
          title: "Flipcart Shipping Labels",
          description: "Cropped thermal shipping labels ready for high-speed printing.",
          url: shippingLabelsPdfUrl,
          onDownload: downloadShippingLabelsPdf,
          downloadText: "Download Shipping Labels",
        };
      case "tax_invoices":
        return {
          title: "Flipcart Tax Invoices",
          description: "Customer tax invoices extracted with clear top spacing for easy reading.",
          url: taxInvoicesPdfUrl,
          onDownload: downloadTaxInvoicesPdf,
          downloadText: "Download Tax Invoices",
        };
      case "original_pdf":
      default:
        return {
          title: "Original Uploaded PDF",
          description:
            "Full original uploaded PDF document containing both shipping labels and tax invoices.",
          url: originalPdfUrl,
          onDownload: downloadOriginalPdf,
          downloadText: "Download Original Uploaded PDF",
        };
    }
  }, [
    selectedView,
    shippingLabelsPdfUrl,
    taxInvoicesPdfUrl,
    originalPdfUrl,
    downloadShippingLabelsPdf,
    downloadTaxInvoicesPdf,
    downloadOriginalPdf,
  ]);

  const handleReset = () => {
    clearCachedFlipcartDocs();
    clearProcessData();
    router.push("/dashboard/order-process/flipcart/order-process");
  };

  const activeBatchKey =
    activeHistoryBatchId ||
    (summary as any)?.id ||
    (summary as any)?.batchId ||
    "active";

  // Fast background pre-warming of single-order printable PDF base64 cache for 0ms instant prints (matching Amazon)
  useEffect(() => {
    let isMounted = true;
    if (!mappedOrders || mappedOrders.length === 0) return;

    const existingCache = getCachedFlipcartDocs();
    if (existingCache?.shippingDoc && existingCache.shippingDoc.getPageCount() > 0) {
      startBackgroundFlipcartPdfPrewarming(
        mappedOrders,
        existingCache.shippingDoc,
        activeBatchKey,
        Array.from(printedOrdersRef.current)
      );
    } else {
      getOrLoadFlipcartShippingDoc(files, activeBatchKey).then((doc) => {
        if (doc && isMounted) {
          startBackgroundFlipcartPdfPrewarming(
            mappedOrders,
            doc,
            activeBatchKey,
            Array.from(printedOrdersRef.current)
          );
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [files?.shippingLabelsPdfBase64, mappedOrders, activeBatchKey]);

  // Strict printer resolution and silent printing verification (matching Amazon Order Process)
  const resolvePrinter = async (): Promise<string | null> => {
    // 1. Verify PrintBridge extension is reachable
    const extCheck = await chromeExtensionPrintService.checkExtension();
    if (!extCheck.ok) {
      lastVerifiedPrinterRef.current = null;
      toast.error("PrintBridge is not running or not detected. Please setup PrintBridge.", {
        id: "flipcart-print",
        duration: 8000,
        action: {
          label: "Setup PrintBridge",
          onClick: () => window.open("/printbridge", "_blank"),
        },
      });
      return null;
    }

    if (extCheck.response?.silentPrinting === false) {
      toast.warning(
        "Silent Printing is OFF in the PrintBridge extension. Click the extension icon in the Chrome toolbar and switch 'Silent Printing' to ON.",
        { duration: 8000 }
      );
    }

    // 2. Fetch live detailed printers directly connected to the PC right now
    const detailedPrinters = await chromeExtensionPrintService.getPrintersDetailed();
    const extPrinters = detailedPrinters.map((p) => p.name).filter(Boolean);
    if (extPrinters.length > 0) {
      setAvailablePrinters(extPrinters);
    }

    let targetPrinter: string | null =
      selectedPrinter ||
      lastVerifiedPrinterRef.current?.printerName ||
      (typeof window !== "undefined"
        ? localStorage.getItem("flipcart_selected_printer") ||
          localStorage.getItem("lastUsedPrinter")
        : null);

    if (targetPrinter) {
      const matched = extPrinters.find(
        (p) => p.toLowerCase().trim() === targetPrinter?.toLowerCase().trim()
      );
      if (matched) {
        targetPrinter = matched;
      }
    }

    if (!targetPrinter || !isPrinterConnectedAndOnline(targetPrinter, detailedPrinters)) {
      const { printer: onlineConnected } = resolveCurrentlyConnectedPrinter(
        extPrinters,
        detailedPrinters
      );
      if (onlineConnected && isPrinterConnectedAndOnline(onlineConnected, detailedPrinters)) {
        targetPrinter = onlineConnected;
      } else if (extPrinters.length > 0) {
        targetPrinter = extPrinters[0];
      }
    }

    if (!targetPrinter) {
      lastVerifiedPrinterRef.current = null;
      toast.error("No printer connected. Print cancelled to avoid queuing.", {
        id: "flipcart-print",
        duration: 8000,
        action: {
          label: "Setup PrintBridge",
          onClick: () => window.open("/printbridge", "_blank"),
        },
      });
      return null;
    }

    lastVerifiedPrinterRef.current = {
      printerName: targetPrinter,
      timestamp: Date.now(),
    };

    if (targetPrinter !== selectedPrinter) {
      setSelectedPrinter(targetPrinter);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("flipcart_selected_printer", targetPrinter);
      localStorage.setItem("lastUsedPrinter", targetPrinter);
    }

    return targetPrinter;
  };

  const handlePrintError = (err: any) => {
    console.error("Print error:", err);
    lastVerifiedPrinterRef.current = null;
    invalidatePrinterCache();

    const msg = String(err?.message || err || "");
    const isPrintBridgeIssue =
      msg.includes("PrintBridge") ||
      msg.toLowerCase().includes("extension") ||
      msg.includes("Receiving end does not exist") ||
      msg.includes("Could not establish connection") ||
      msg.includes("runtime is not available") ||
      msg.includes("Failed to communicate");

    if (isPrintBridgeIssue) {
      toast.error("PrintBridge is not running or not detected. Please setup PrintBridge.", {
        id: "flipcart-print",
        duration: 9000,
        action: {
          label: "Setup PrintBridge",
          onClick: () => window.open("/printbridge", "_blank"),
        },
      });
      return;
    }

    const isConnectionIssue =
      msg.includes("No printer connected") ||
      msg.includes("offline") ||
      msg.includes("not connected") ||
      msg.includes("disconnected") ||
      msg.includes("No connected printer") ||
      msg.includes("not ready") ||
      msg.includes("SumatraPDF");

    toast.error(
      isConnectionIssue
        ? "No printer connected. Print cancelled to avoid queuing."
        : msg || "Print failure occurred. Please check printer.",
      {
        id: "flipcart-print",
        duration: 8000,
        action: {
          label: "Setup PrintBridge",
          onClick: () => window.open("/printbridge", "_blank"),
        },
      }
    );
  };

  const getSingleOrderPdfBase64 = async (
    pageIndex: number
  ): Promise<string> => {
    // 1. Instant 0ms cache lookup
    const cached =
      getCachedFlipcartOrderPdf(pageIndex, activeBatchKey) ||
      orderPrintPdfCacheRef.current.get(pageIndex);
    if (cached) return cached;

    // 2. Extract single page using pre-cached shippingDoc (avoids reloading PDF from bytes)
    const shippingDoc = await getOrLoadFlipcartShippingDoc(files, activeBatchKey);
    if (!shippingDoc) {
      throw new Error("Shipping labels PDF document is not loaded.");
    }

    const singleBase64 = await getOrGenerateSingleFlipcartOrderPdf(
      pageIndex,
      shippingDoc,
      activeBatchKey
    );
    if (!singleBase64) {
      throw new Error(`Failed to generate shipping label for page index ${pageIndex}`);
    }

    orderPrintPdfCacheRef.current.set(pageIndex, singleBase64);
    setCachedFlipcartOrderPdf(pageIndex, singleBase64, activeBatchKey);
    return singleBase64;
  };

  // Main silent print executor for single or multiple Flipkart orders
  const executePrintForOrders = async (
    targetOrders: FlipcartOrderItem[],
    skipPersist: boolean = false
  ) => {
    if (missingSkus.length > 0) {
      toast.error(
        `Cannot print orders: ${missingSkus.length} SKU(s) are missing from Flipcart Imports. Please resolve missing SKUs first.`
      );
      setIsMissingSkuModalOpen(true);
      return;
    }

    if (!files?.shippingLabelsPdfBase64 && !getCachedFlipcartDocs()?.shippingDoc) {
      toast.error("Shipping labels PDF is not available to print.");
      return;
    }

    if (targetOrders.length === 0) {
      toast.info("No orders selected or available to print.");
      return;
    }

    const targetPrinter = await resolvePrinter();
    if (!targetPrinter) return;

    // Helper to print with automatic raster canvas fallback for thermal printers
    const printWithRasterFallback = async (pdfBase64: string): Promise<void> => {
      try {
        const extRes = await chromeExtensionPrintService.printPdf(
          pdfBase64,
          targetPrinter,
          1,
          true
        );
        if (extRes && (extRes.success === false || extRes.error)) {
          throw new Error(extRes.error || `Direct print failed on ${targetPrinter}`);
        }
      } catch (vectorErr: any) {
        console.warn("Vector PDF print failed, attempting raster fallback...", vectorErr);
        try {
          const rawBytes = fastBase64ToUint8Array(pdfBase64);
          const images = await renderPdfBytesToImages(rawBytes);
          if (images.length > 0) {
            const rasterDoc = await PDFDocument.create();
            for (const imgBase64 of images) {
              const imgBytes = fastBase64ToUint8Array(imgBase64);
              const pngImg = await rasterDoc.embedPng(imgBytes);
              const page = rasterDoc.addPage([4 * 72, 6 * 72]);
              page.drawImage(pngImg, {
                x: 0,
                y: 0,
                width: 4 * 72,
                height: 6 * 72,
              });
            }
            const rasterBase64 = await rasterDoc.saveAsBase64();
            const fallbackRes = await chromeExtensionPrintService.printPdf(
              rasterBase64,
              targetPrinter,
              1,
              true
            );
            if (fallbackRes && (fallbackRes.success === false || fallbackRes.error)) {
              throw new Error(fallbackRes.error || `Raster print fallback failed on ${targetPrinter}`);
            }
          } else {
            throw vectorErr;
          }
        } catch (rasterErr) {
          throw vectorErr;
        }
      }
    };

    // 1. ULTRA-FAST SUB-SECOND PATH FOR SINGLE ORDER (0ms from pre-warmed cache!)
    if (targetOrders.length === 1) {
      const singleOrder = targetOrders[0];
      toast.loading(`Printing shipping label on ${targetPrinter}...`, { id: "flipcart-print" });
      try {
        const singleBase64 = await getSingleOrderPdfBase64(singleOrder.pageIndex);
        await printWithRasterFallback(singleBase64);

        markOrdersAsPrinted([singleOrder.pageIndex]);

        setSelectedRows((prev) => {
          const next = new Set(prev);
          next.delete(singleOrder.index);
          return next;
        });

        if (!skipPersist) {
          await persistPrintedOrdersToDb([singleOrder], true);
        }

        toast.success(
          `Printed shipping label for ${singleOrder.orderId} (4" x 6") directly on ${targetPrinter}! Sent to AWB Scan.`,
          {
            id: "flipcart-print",
            duration: 6000,
            action: {
              label: "Go to AWB Scan →",
              onClick: () => router.push("/dashboard/order-process/flipcart/awb-scan"),
            },
          }
        );
        return;
      } catch (err: any) {
        handlePrintError(err);
        return;
      }
    }

    // 2. BATCH PRINTING FOR MULTIPLE ORDERS (10 pages per chunk from cached shippingDoc)
    toast.loading(
      `Direct printing ${targetOrders.length} shipping label(s) on ${targetPrinter}...`,
      { id: "flipcart-print" }
    );

    try {
      const shippingDoc = await getOrLoadFlipcartShippingDoc(files, activeBatchKey);
      if (!shippingDoc) {
        throw new Error("Shipping labels document not available to print.");
      }

      const validOrders = targetOrders.filter(
        (o) => o.pageIndex >= 0 && o.pageIndex < shippingDoc.getPageCount()
      );

      if (validOrders.length === 0) {
        throw new Error("No valid shipping label pages found for selected orders.");
      }

      const totalPages = validOrders.length;
      const BATCH_SIZE = 10;

      if (totalPages <= BATCH_SIZE) {
        const batchDoc = await PDFDocument.create();
        const pageIndices = validOrders.map((o) => o.pageIndex);
        const copiedPages = await batchDoc.copyPages(shippingDoc, pageIndices);
        copiedPages.forEach((p) => batchDoc.addPage(p));
        const batchBase64 = await batchDoc.saveAsBase64();

        await printWithRasterFallback(batchBase64);
      } else {
        // Chunked printing (10 pages per chunk) to avoid Chrome extension buffer overflow
        for (let i = 0; i < totalPages; i += BATCH_SIZE) {
          const endIdx = Math.min(i + BATCH_SIZE, totalPages);
          toast.loading(
            `Direct printing label ${i + 1} to ${endIdx} of ${totalPages} on ${targetPrinter}...`,
            { id: "flipcart-print" }
          );

          const chunkOrders = validOrders.slice(i, endIdx);
          const chunkDoc = await PDFDocument.create();
          const pageIndices = chunkOrders.map((o) => o.pageIndex);
          const copiedPages = await chunkDoc.copyPages(shippingDoc, pageIndices);
          copiedPages.forEach((p) => chunkDoc.addPage(p));

          const chunkBase64 = await chunkDoc.saveAsBase64();
          await printWithRasterFallback(chunkBase64);
        }
      }

      markOrdersAsPrinted(validOrders.map((o) => o.pageIndex));

      setSelectedRows((prev) => {
        const next = new Set(prev);
        targetOrders.forEach((o) => next.delete(o.index));
        return next;
      });

      if (!skipPersist) {
        await persistPrintedOrdersToDb(targetOrders, true);
      }

      toast.success(
        `Printed ${totalPages} shipping label(s) (4" x 6") directly on ${targetPrinter}! All printed orders sent to AWB Scan.`,
        {
          id: "flipcart-print",
          duration: 8000,
          action: {
            label: "Go to AWB Scan →",
            onClick: () => router.push("/dashboard/order-process/flipcart/awb-scan"),
          },
        }
      );
    } catch (err: any) {
      handlePrintError(err);
    }
  };

  // Single order print handler: immediately marks printed, persists to AWB scan as pending, and prints
  const handlePrintSingleOrder = async (item: FlipcartOrderItem) => {
    if (missingSkus.length > 0) {
      toast.error(
        `Cannot print: ${missingSkus.length} SKU(s) are missing from Flipcart Imports.`
      );
      setIsMissingSkuModalOpen(true);
      return;
    }

    // 1. Immediately mark row as printed in state & store
    markOrdersAsPrinted([item.pageIndex]);

    // 2. Clear from selected checkboxes
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.delete(item.index);
      return next;
    });

    // 3. Immediately persist to DB (packingScanStatus: PENDING) for AWB Scan
    await persistPrintedOrdersToDb([item], true);

    // 4. Send to physical printer (pass skipPersist: true since persist is already initiated)
    await executePrintForOrders([item], true);
  };

  // Enqueue print execution to serialize rapid handheld barcode scanner triggers
  const enqueuePrint = useCallback(
    (item: FlipcartOrderItem) => {
      // 1. Immediately mark row as printed
      markOrdersAsPrinted([item.pageIndex]);

      // 2. Clear from selected checkboxes if present
      setSelectedRows((prev) => {
        const next = new Set(prev);
        next.delete(item.index);
        return next;
      });

      // 3. Persist to database in background for AWB scan
      persistPrintedOrdersToDb([item], true);

      // 4. Serialize print execution
      const printTask = printQueuePromiseRef.current
        .catch(() => {})
        .then(async () => {
          try {
            await executePrintForOrders([item], true);
          } catch (err) {
            // Unmark on failure so operator can retry
            unmarkOrdersAsPrinted([item.pageIndex]);
            throw err;
          }
        });

      printQueuePromiseRef.current = printTask;
      return printTask;
    },
    [markOrdersAsPrinted, persistPrintedOrdersToDb, unmarkOrdersAsPrinted, executePrintForOrders]
  );

  const renderPdfBytesToImages = async (pdfBytes: Uint8Array): Promise<string[]> => {
    const pdfjs = await import("pdfjs-dist");
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version || "6.3.289"}/build/pdf.worker.min.mjs`;
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

  const buildOrderRequirements = (order: FlipcartOrderItem): OrderItemRequirement[] => {
    if (order.items && order.items.length > 0) {
      const map = new Map<string, OrderItemRequirement>();
      order.items.forEach((it) => {
        const cleanSku = (it.sku || "").trim();
        const lower = cleanSku.toLowerCase();
        if (!lower) return;
        const existing = map.get(lower);
        const qty = it.quantity || 1;
        if (existing) {
          existing.requiredQty += qty;
        } else {
          map.set(lower, {
            sku: cleanSku,
            fsn: it.fsn || "",
            requiredQty: qty,
            scannedQty: 0,
          });
        }
      });
      if (map.size > 0) return Array.from(map.values());
    }

    const rawSkus = (order.sku || "").split("/").map((s) => s.trim()).filter(Boolean);
    if (rawSkus.length > 1) {
      const map = new Map<string, OrderItemRequirement>();
      rawSkus.forEach((s) => {
        const lower = s.toLowerCase();
        const existing = map.get(lower);
        if (existing) {
          existing.requiredQty += 1;
        } else {
          map.set(lower, {
            sku: s,
            fsn: order.fsn || "",
            requiredQty: 1,
            scannedQty: 0,
          });
        }
      });
      return Array.from(map.values());
    }

    const totalQty = order.totalQuantity || 1;
    return [
      {
        sku: order.sku || "",
        fsn: order.fsn || "",
        requiredQty: totalQty,
        scannedQty: 0,
      },
    ];
  };

  const isReqMatch = (req: OrderItemRequirement, query: string): boolean => {
    const qL = query.trim().toLowerCase();
    if (!qL) return false;
    const skuL = (req.sku || "").trim().toLowerCase();
    const fsnL = (req.fsn || "").trim().toLowerCase();

    if (skuL === qL || skuL.includes(qL) || qL.includes(skuL)) return true;
    if (fsnL === qL || fsnL.includes(qL) || qL.includes(fsnL)) return true;

    const details = skuDetailsMap.get(skuL) || skuDetailsMap.get((req.sku || "").trim());
    if (details?.fsn && details.fsn.toLowerCase().includes(qL)) return true;

    return false;
  };

  const isOrderLevelMatch = (order: FlipcartOrderItem, query: string): boolean => {
    const qL = query.trim().toLowerCase();
    if (!qL) return false;
    const cleanOrder = (order.orderId || "").trim().toLowerCase();
    const cleanAwb = (order.awb || "").trim().toLowerCase();
    return cleanOrder === qL || cleanAwb === qL || String(order.orderNumber) === qL;
  };

  const handleAutoPrint = async (rawInput: string) => {
    const q = rawInput.trim();
    if (!q) return;

    if (missingSkus.length > 0) {
      toast.error(
        `Scanning locked: ${missingSkus.length} SKU(s) are missing from Flipcart Imports. Please resolve missing SKUs first.`
      );
      setIsMissingSkuModalOpen(true);
      return;
    }

    if (!files?.shippingLabelsPdfBase64 && !getCachedFlipcartDocs()?.shippingDoc) {
      toast.error("Shipping labels PDF is not available to print.");
      return;
    }

    setAutoPrintQuery("");
    autoPrintInputRef.current?.focus();

    const lowerQ = q.toLowerCase();

    // 1. Find all matching orders in the uploaded dataset
    const allMatchingOrders = mappedOrders.filter((o) => {
      if (isOrderLevelMatch(o, q)) return true;
      const reqs = orderScanProgressRef.current.get(o.pageIndex) || buildOrderRequirements(o);
      if (reqs.some((r) => isReqMatch(r, q))) return true;

      const matchSku = (o.sku || "").toLowerCase().includes(lowerQ);
      const matchFsn = (o.fsn || "").toLowerCase().includes(lowerQ);
      const matchCust = (o.customerName || "").toLowerCase().includes(lowerQ);
      return matchSku || matchFsn || matchCust;
    });

    if (allMatchingOrders.length === 0) {
      toast.error(`No shipping label found matching "${q}"`);
      return;
    }

    // 2. Enforce active Order Composition Filter (single_quantity, multiple_sku, multiple_pieces)
    const candidateOrders = allMatchingOrders.filter(
      (item) => getOrderTypeForItem(item) === orderTypeFilter
    );

    if (candidateOrders.length === 0) {
      const otherTypes = Array.from(
        new Set(allMatchingOrders.map((item) => getOrderTypeForItem(item)))
      ).map(getOrderTypeLabel);

      toast.warning(
        `Only ${getOrderTypeLabel(orderTypeFilter)} orders allowed in this mode! Scanned item belongs to a ${otherTypes.join(" / ")} order.`,
        { id: "order-type-mismatch", duration: 6000 }
      );
      return;
    }

    // 3. Filter candidate orders to unprinted ones
    const unprintedCandidates = candidateOrders.filter(
      (item) => !printedOrdersRef.current.has(item.pageIndex)
    );

    if (unprintedCandidates.length === 0) {
      toast.error(
        `All ${candidateOrders.length} order(s) for "${q}" have already been scanned and printed! Re-scanning is not allowed. To reprint, click the Print button in the table row.`,
        { id: "all-scanned-error", duration: 6000 }
      );
      return;
    }

    // 4. Check if any unprinted candidate order is currently in-progress (partially scanned)
    let targetOrder: FlipcartOrderItem | undefined;
    let seqNotice = "";

    const unprintedPageIndexes = new Set(unprintedCandidates.map((c) => c.pageIndex));
    const inProgressEntries = Array.from(orderScanProgressRef.current.entries()).filter(
      ([pageIdx, reqs]) => {
        if (!unprintedPageIndexes.has(pageIdx)) return false;
        const hasScanned = reqs.some((r) => r.scannedQty > 0);
        const hasRemaining = reqs.some((r) => r.scannedQty < r.requiredQty);
        return hasScanned && hasRemaining;
      }
    );

    for (const [inProgIdx, reqs] of inProgressEntries) {
      const item = mappedOrders.find((m) => m.pageIndex === inProgIdx);
      if (!item) continue;

      const matchesRemainingReq = reqs.some(
        (r) => r.scannedQty < r.requiredQty && isReqMatch(r, q)
      );
      const matchesAnyReq = reqs.some((r) => isReqMatch(r, q));
      const matchesOrderId = isOrderLevelMatch(item, q);

      if (matchesRemainingReq || matchesAnyReq || matchesOrderId) {
        targetOrder = item;
        break;
      }
    }

    // 5. If no in-progress candidate matched, pick via deterministic FIFO sorting by index ascending
    if (!targetOrder) {
      unprintedCandidates.sort((a, b) => a.index - b.index);
      targetOrder = unprintedCandidates[0];
      const remainingAfterThis = unprintedCandidates.length - 1;
      if (candidateOrders.length > 1) {
        const currentStep = candidateOrders.length - unprintedCandidates.length + 1;
        seqNotice = `Printed ${currentStep} of ${candidateOrders.length} (${remainingAfterThis} remaining)`;
      }
    }

    if (!targetOrder) {
      toast.error(`No matching order found for "${q}"`);
      return;
    }

    // 6. Retrieve or initialize requirement list for this order
    let reqs = orderScanProgressRef.current.get(targetOrder.pageIndex);
    if (!reqs) {
      reqs = buildOrderRequirements(targetOrder);
      orderScanProgressRef.current.set(targetOrder.pageIndex, reqs);
    }

    const orderType = getOrderTypeForItem(targetOrder);

    // 7. If single quantity order, immediately print!
    if (orderType === "single_quantity") {
      orderScanProgressRef.current.delete(targetOrder.pageIndex);
      try {
        await enqueuePrint(targetOrder);
        if (seqNotice) {
          toast.info(`${seqNotice} • Customer: ${targetOrder.customerName || "Customer"}`, {
            duration: 4000,
          });
        }
      } catch (err) {
        console.error("Auto print error for single_quantity item:", err);
      }
      setTimeout(() => {
        autoPrintInputRef.current?.focus();
        autoPrintInputRef.current?.select();
      }, 50);
      return;
    }

    // 8. For multiple_sku and multiple_pieces:
    // If user scanned an order-level identifier (Order ID, AWB):
    const isOrderScan = isOrderLevelMatch(targetOrder, q);
    if (isOrderScan) {
      const allScanned = reqs.every((r) => r.scannedQty >= r.requiredQty);
      if (allScanned) {
        orderScanProgressRef.current.delete(targetOrder.pageIndex);
        try {
          await enqueuePrint(targetOrder);
          if (seqNotice) {
            toast.info(`Sequential Print (${seqNotice}): Customer ${targetOrder.customerName || "Customer"}`, {
              duration: 4000,
            });
          }
        } catch (err) {
          console.error("Auto print error for order-level item:", err);
        }
        setTimeout(() => {
          autoPrintInputRef.current?.focus();
          autoPrintInputRef.current?.select();
        }, 50);
        return;
      } else {
        const remainingReqs = reqs.filter((r) => r.scannedQty < r.requiredQty);
        const remainingSkus = Array.from(
          new Set(remainingReqs.map((r) => r.sku || r.fsn || "SKU").filter(Boolean))
        );
        const remainingPieces = remainingReqs.reduce(
          (sum, r) => sum + (r.requiredQty - r.scannedQty),
          0
        );

        toast.warning(
          `Cannot print Order ${targetOrder.orderId}: SKU is remaining: ${remainingSkus.join(", ")} (${remainingPieces} piece(s) remain). Please scan all SKUs first.`,
          { duration: 7000 }
        );
        return;
      }
    }

    // 9. User scanned SKU / FSN / Barcode:
    let matchingReq = reqs.find((r) => r.scannedQty < r.requiredQty && isReqMatch(r, q));
    if (!matchingReq) {
      matchingReq = reqs.find((r) => isReqMatch(r, q));
    }

    if (!matchingReq) {
      toast.error(
        `Scanned item "${q}" does not match any SKU/FSN for Order ${targetOrder.orderId}`
      );
      return;
    }

    // If this item is already fully scanned:
    if (matchingReq.scannedQty >= matchingReq.requiredQty) {
      const remainingReqs = reqs.filter((r) => r.scannedQty < r.requiredQty);
      const remainingSkus = Array.from(
        new Set(remainingReqs.map((r) => r.sku || r.fsn || "SKU").filter(Boolean))
      );
      const remainingPieces = remainingReqs.reduce(
        (sum, r) => sum + (r.requiredQty - r.scannedQty),
        0
      );

      toast.info(
        `SKU ${matchingReq.sku} is already fully scanned for this order. SKU is remaining: ${remainingSkus.join(", ")} (${remainingPieces} piece(s) remain). Please scan remaining SKU.`,
        { duration: 6000 }
      );
      return;
    }

    // Record the scan for this requirement:
    matchingReq.scannedQty++;

    const remainingReqs = reqs.filter((r) => r.scannedQty < r.requiredQty);
    const totalRequired = reqs.reduce((sum, r) => sum + r.requiredQty, 0);
    const totalScanned = reqs.reduce((sum, r) => sum + r.scannedQty, 0);

    if (remainingReqs.length > 0) {
      const remainingSkus = Array.from(
        new Set(remainingReqs.map((r) => r.sku || r.fsn || "SKU").filter(Boolean))
      );
      const remainingPieces = remainingReqs.reduce(
        (sum, r) => sum + (r.requiredQty - r.scannedQty),
        0
      );

      if (orderType === "multiple_sku") {
        toast.warning(
          `SKU is remaining: ${remainingSkus.join(", ")} (${totalScanned}/${totalRequired} scanned for Order ${targetOrder.orderId}). Scan remaining SKU to print.`,
          { duration: 7000 }
        );
      } else {
        toast.warning(
          `SKU is remaining: ${remainingSkus.join(", ")} (${remainingPieces} piece(s) remaining, ${totalScanned}/${totalRequired} scanned for Order ${targetOrder.orderId}). Scan remaining piece to print.`,
          { duration: 7000 }
        );
      }
      return;
    }

    // ALL items/pieces scanned!
    toast.success(
      `All SKUs scanned (${totalScanned}/${totalRequired}) for Order ${targetOrder.orderId}! Printing shipping label...`,
      { duration: 4000 }
    );

    orderScanProgressRef.current.delete(targetOrder.pageIndex);

    try {
      await enqueuePrint(targetOrder);
      if (seqNotice) {
        toast.info(`Sequential Print (${seqNotice}): Customer ${targetOrder.customerName || "Customer"}`, {
          duration: 4000,
        });
      }
    } catch (err) {
      console.error("Auto print error for multi-item order:", err);
    }
    setTimeout(() => {
      autoPrintInputRef.current?.focus();
      autoPrintInputRef.current?.select();
    }, 50);
  };

  // Bulk Print Selected or All Unprinted Orders: immediately marks printed, persists to AWB scan as pending, and prints
  const handlePrintSelectedOrAll = async () => {
    if (missingSkus.length > 0) {
      toast.error(
        `Cannot print orders: ${missingSkus.length} SKU(s) are missing from Flipcart Imports. Please resolve missing SKUs first.`
      );
      setIsMissingSkuModalOpen(true);
      return;
    }

    const targetOrders =
      selectedRows.size > 0
        ? mappedOrders.filter((o) => selectedRows.has(o.index))
        : filteredOrders.filter((o) => !printedOrders.has(o.pageIndex));

    if (targetOrders.length === 0) {
      toast.info("No orders selected or available to print.");
      return;
    }

    const targetPageIndices = targetOrders.map((o) => o.pageIndex);

    // 1. Synchronously mark rows as printed in state & store immediately
    markOrdersAsPrinted(targetPageIndices);

    // 2. Clear selected checkboxes immediately
    setSelectedRows((prev) => {
      const next = new Set(prev);
      targetOrders.forEach((o) => next.delete(o.index));
      return next;
    });

    // 3. Immediately persist to database for AWB scan
    await persistPrintedOrdersToDb(targetOrders, true);

    // 4. Send to physical printer (pass skipPersist: true since persist is already initiated)
    await executePrintForOrders(targetOrders, true);
  };

  // Picklist Generation (Supports Excel, PDF download, PDF open, and Interactive print tab)
  const handlePicklistAction = async (
    action: "excel" | "pdf_download" | "pdf_open" | "tab_open" = "excel"
  ) => {
    if (missingSkus.length > 0) {
      toast.error(
        `Cannot generate picklist: ${missingSkus.length} SKU(s) are missing from Flipcart Imports.`
      );
      setIsMissingSkuModalOpen(true);
      return;
    }

    const targetSet =
      selectedRows.size > 0
        ? selectedRows
        : new Set(mappedOrders.filter((o) => !printedOrders.has(o.pageIndex)).map((o) => o.index));

    if (targetSet.size === 0 && mappedOrders.length === 0) {
      toast.error("No orders available to generate picklist.");
      return;
    }

    setIsGeneratingPicklist(true);
    try {
      const picklist = generateFlipcartPicklist(
        mappedOrders,
        targetSet.size > 0 ? targetSet : undefined,
        skuDetailsMap
      );

      const count = targetSet.size > 0 ? targetSet.size : mappedOrders.length;

      if (action === "excel") {
        await downloadFlipcartPicklistExcel(picklist, summary?.pdfFileName);
        toast.success(
          `Generated Excel Picklist for ${count} order(s) (${picklist.items.length} unique SKUs, ${picklist.totalQuantity} total qty)!`
        );
      } else if (action === "pdf_download") {
        await downloadFlipcartPicklistPDF(picklist, summary?.pdfFileName);
        toast.success(
          `Downloaded Picklist PDF for ${count} order(s)!`
        );
      } else if (action === "pdf_open") {
        await openFlipcartPicklistPDF(picklist, summary?.pdfFileName);
        toast.success(
          `Opened Picklist PDF preview for ${count} order(s)!`
        );
      } else if (action === "tab_open") {
        await openFlipcartPicklistTab(picklist, summary?.pdfFileName);
        toast.success(
          `Opened interactive Picklist print tab for ${count} order(s)!`
        );
      }
      setIsPicklistModalOpen(false);
    } catch (err) {
      console.error("Failed to generate picklist:", err);
      toast.error("Failed to generate Picklist.");
    } finally {
      setIsGeneratingPicklist(false);
    }
  };

  const handleOpenPicklistModal = () => {
    if (missingSkus.length > 0) {
      toast.error(
        `Cannot generate picklist: ${missingSkus.length} SKU(s) are missing from Flipcart Imports.`
      );
      setIsMissingSkuModalOpen(true);
      return;
    }
    setIsPicklistModalOpen(true);
  };

  const handleGeneratePicklist = () => handlePicklistAction("excel");

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return mappedOrders.filter((item) => {
      const isPrinted = printedOrders.has(item.pageIndex);
      if (showPrinted ? !isPrinted : isPrinted) return false;

      const numItems = item.items?.length || 1;
      const qty = item.totalQuantity || 1;

      if (orderTypeFilter === "single_quantity") {
        if (numItems > 1 || qty !== 1) return false;
      } else if (orderTypeFilter === "multiple_sku") {
        if (numItems <= 1) return false;
      } else if (orderTypeFilter === "multiple_pieces") {
        if (numItems > 1 || qty <= 1) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchOrder = (item.orderId || "").toLowerCase().includes(q);
        const matchAwb = (item.awb || "").toLowerCase().includes(q);
        const matchSku = (item.sku || "").toLowerCase().includes(q);
        const matchFsn = (item.fsn || "").toLowerCase().includes(q);
        const matchRack = (item.rackAddress || "").toLowerCase().includes(q);
        const matchCust = (item.customerName || "").toLowerCase().includes(q);
        const matchNum = String(item.orderNumber) === q;
        if (!matchOrder && !matchAwb && !matchSku && !matchFsn && !matchRack && !matchCust && !matchNum) {
          return false;
        }
      }

      return true;
    });
  }, [mappedOrders, printedOrders, showPrinted, orderTypeFilter, searchQuery]);

  // Pagination calculations
  const totalRecords = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredOrders.slice(start, start + limit);
  }, [filteredOrders, currentPage, limit]);

  // Checkbox multi-select helpers
  const allPageSelected = useMemo(() => {
    if (paginatedOrders.length === 0) return false;
    return paginatedOrders.every((o) => selectedRows.has(o.index));
  }, [paginatedOrders, selectedRows]);

  const toggleAllPage = () => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        paginatedOrders.forEach((o) => next.delete(o.index));
      } else {
        paginatedOrders.forEach((o) => next.add(o.index));
      }
      return next;
    });
  };

  const handleSelectRow = (index: number, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) next.add(index);
      else next.delete(index);
      return next;
    });
  };

  // Excel Downloads
  const handleDownloadUnprintedExcel = async () => {
    const unprinted = mappedOrders.filter((o) => !printedOrders.has(o.pageIndex));
    if (unprinted.length === 0) {
      toast.info("No unprinted orders to export.");
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Unprinted Orders");
    worksheet.columns = [
      { header: "Order #", key: "orderNumber", width: 12 },
      { header: "Order ID", key: "orderId", width: 25 },
      { header: "AWB Number", key: "awb", width: 25 },
      { header: "FSN Code", key: "fsn", width: 22 },
      { header: "SKU", key: "sku", width: 25 },
      { header: "Rack Address", key: "rackAddress", width: 18 },
      { header: "Customer", key: "customerName", width: 25 },
      { header: "Qty", key: "quantity", width: 10 },
      { header: "Status", key: "status", width: 15 },
    ];
    unprinted.forEach((item) => {
      worksheet.addRow({
        orderNumber: item.orderNumber,
        orderId: item.orderId,
        awb: item.awb,
        fsn: item.fsn !== "—" ? item.fsn : "",
        sku: item.sku,
        rackAddress: item.rackAddress !== "Not assigned" ? item.rackAddress : "",
        customerName: item.customerName || "",
        quantity: item.totalQuantity || 1,
        status: "Unprinted",
      });
    });
    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Flipcart_Unprinted_Orders_${Date.now()}.xlsx`);
    toast.success(`Exported ${unprinted.length} unprinted orders to Excel!`);
  };

  const handleDownloadPrintedExcel = async () => {
    const printed = mappedOrders.filter((o) => printedOrders.has(o.pageIndex));
    if (printed.length === 0) {
      toast.info("No printed orders to export.");
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Printed Orders");
    worksheet.columns = [
      { header: "Order #", key: "orderNumber", width: 12 },
      { header: "Order ID", key: "orderId", width: 25 },
      { header: "AWB Number", key: "awb", width: 25 },
      { header: "FSN Code", key: "fsn", width: 22 },
      { header: "SKU", key: "sku", width: 25 },
      { header: "Rack Address", key: "rackAddress", width: 18 },
      { header: "Customer", key: "customerName", width: 25 },
      { header: "Qty", key: "quantity", width: 10 },
      { header: "Status", key: "status", width: 15 },
    ];
    printed.forEach((item) => {
      worksheet.addRow({
        orderNumber: item.orderNumber,
        orderId: item.orderId,
        awb: item.awb,
        fsn: item.fsn !== "—" ? item.fsn : "",
        sku: item.sku,
        rackAddress: item.rackAddress !== "Not assigned" ? item.rackAddress : "",
        customerName: item.customerName || "",
        quantity: item.totalQuantity || 1,
        status: "Printed",
      });
    });
    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Flipcart_Printed_Orders_${Date.now()}.xlsx`);
    toast.success(`Exported ${printed.length} printed orders to Excel!`);
  };

  const printedCountVal = printedOrders.size > 0 ? printedOrders.size : printedCount;
  const remainingCount = Math.max(0, (summary?.totalOrders || 0) - printedCountVal);
  const printedPercentage =
    summary?.totalOrders && summary.totalOrders > 0
      ? Math.round((printedCountVal / summary.totalOrders) * 100)
      : 0;

  if (isLoading || !summary) {
    return (
      <DashboardLayout title="Flipcart Order Process Results">
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#E8C16D]" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading batch results...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Flipcart Order Process Results">
      <div ref={containerRef} className="flex flex-col gap-6">
        {/* ===================================================== */}
        {/* TOP CONTAINER CARD MATCHING AMAZON ORDER PROCESS UI   */}
        {/* ===================================================== */}
        <div ref={topCardRef} className="shrink-0 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          {/* Header Row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Flipcart Order Process Results
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-words">
                Files: <strong className="text-slate-800 dark:text-slate-200">{summary.pdfFileName}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] px-4 sm:px-5 text-xs sm:text-sm font-bold text-[#6A4D1D] dark:text-[#E8C16D] transition-all hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" />
                <span>New Batch</span>
              </button>
            </div>
          </div>

          {/* Modularized Summary Cards matching Amazon parity */}
          <FlipcartSummaryCards
            summary={summary}
            printedCount={printedCountVal}
            remainingCount={remainingCount}
            onSelectPdfType={(type) => setSelectedView(type)}
            onTabChange={(tab) => setActiveTab(tab)}
            onDownloadUnprintedExcel={handleDownloadUnprintedExcel}
            onDownloadPrintedExcel={handleDownloadPrintedExcel}
          />
        </div>

        {/* ===================================================== */}
        {/* LOWER SECTION: TABS & TOOLBAR & WORK AREA             */}
        {/* ===================================================== */}
        <div
          className="flex flex-col gap-3 sm:gap-4 flex-1 min-h-0"
          style={{
            height: isDesktop && targetHeight && activeTab === "pdf" ? `${targetHeight}px` : undefined,
            maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
          }}
        >
          {/* ===================================================== */}
          {/* TOP CONTROLS & TABLE TOOLBAR: UNIFIED 2-COLUMN ALIGNMENT */}
          {/* ===================================================== */}
          <div ref={row1Ref} className="shrink-0 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-x-3 gap-y-3 items-center">
            {/* ROW 1 LEFT: Shipping Data Tab & PDF Preview Tab */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full justify-start">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("table");
                  setPage(1);
                }}
                className={`inline-flex h-11 sm:h-12 w-full sm:w-auto sm:min-w-[180px] px-4 sm:px-5 items-center justify-center gap-2 rounded-2xl border text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                  activeTab === "table"
                    ? "border-transparent bg-[#E8C16D] text-[#0A0E1A] shadow-xs"
                    : "border-[#0A0E1A] dark:border-white/[0.15] bg-[#0A0E1A] dark:bg-[#080B11] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] hover:border-[#E8C16D]"
                }`}
              >
                Shipping Data ({showPrinted ? summary.totalOrders : remainingCount})
              </button>

              {/* Unified PDF Viewer Dropdown Selector (Shipping Labels, Tax Invoices, Original Uploaded PDF) */}
              <div
                className={`w-full sm:w-60 md:w-64 transition-all outline-none rounded-2xl shrink-0 ${
                  activeTab === "pdf" ? "ring-2 ring-[#E8C16D] shadow-xs" : ""
                }`}
                onClick={() => {
                  if (activeTab !== "pdf") {
                    setActiveTab("pdf");
                  }
                }}
              >
                <ReactSelect
                  borderRadius={16}
                  options={viewOptions}
                  value={
                    viewOptions.find((opt) => opt.value === selectedView) ??
                    viewOptions[0]
                  }
                  onChange={(opt) => {
                    if (opt?.value) {
                      setSelectedView(opt.value as FlipcartPdfViewType);
                      setActiveTab("pdf");
                    }
                  }}
                  height={48}
                  {...selectThemeStyles}
                />
              </div>
            </div>

            {/* ROW 1 RIGHT: Instant Auto-Print Scan Bar (Starts EXACTLY where Single Quantity Dropdown starts) */}
            <div className="w-full xl:min-w-[480px]">
              <div className="group relative flex items-center gap-2.5 rounded-2xl border-2 border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all w-full h-11 sm:h-12 focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FAF0D4] dark:bg-[#251E11] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/40">
                  <Zap className="h-3.5 w-3.5 animate-pulse" />
                </div>
                <input
                  ref={autoPrintInputRef}
                  type="text"
                  placeholder={
                    orderTypeFilter === "single_quantity"
                      ? "Scan Single Quantity SKU, Order ID, or AWB to print..."
                      : orderTypeFilter === "multiple_sku"
                      ? "Scan Multiple FSN items to print..."
                      : "Scan Multiple Pieces items to print..."
                  }
                  value={autoPrintQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAutoPrintQuery(val);
                    if (autoScanTimerRef.current) {
                      clearTimeout(autoScanTimerRef.current);
                    }
                    const trimmed = val.trim();
                    if (trimmed.length >= 8) {
                      autoScanTimerRef.current = setTimeout(() => {
                        const cur = autoPrintInputRef.current?.value.trim();
                        if (cur && cur === trimmed) {
                          autoPrintInputRef.current?.select();
                          handleAutoPrint(cur);
                        }
                      }, 180);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (autoScanTimerRef.current) {
                        clearTimeout(autoScanTimerRef.current);
                      }
                      const raw = e.currentTarget.value.trim() || autoPrintQuery.trim();
                      if (raw) {
                        autoPrintInputRef.current?.select();
                        handleAutoPrint(raw);
                      }
                    }
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 placeholder:font-normal outline-none"
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
                    className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer shrink-0"
                    title="Clear scanner input"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* FULL WIDTH DIVIDER BETWEEN ROW 1 (Tabs/Scan) AND ROW 2 (Filters/Actions) */}
            <div className="col-span-full border-b border-[#E7E0D2] dark:border-white/[0.08] my-0.5" />

            {/* ROW 2 (Rendered when activeTab === "table") */}
            {activeTab === "table" && (
              <>
                {/* ROW 2 LEFT: Search Box + Connected Printer Selection */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full">
                  {/* Search Box */}
                  <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:focus-within:bg-[#0B0F17] flex-1 min-w-[200px]">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
                      <Search className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search Order ID, Invoice #, ASIN, AWB, Customer..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setPage(1);
                        }}
                        className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer shrink-0"
                        title="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Connected Printer Selector */}
                  <div className="w-full sm:w-48 md:w-52 shrink-0">
                    <ReactSelect
                      borderRadius={16}
                      options={printerOptions}
                      value={
                        printerOptions.find((opt) => opt.value === selectedPrinter) ??
                        (selectedPrinter ? { label: selectedPrinter, value: selectedPrinter } : null)
                      }
                      onChange={(opt) => {
                        if (opt?.value) {
                          setSelectedPrinter(opt.value);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("flipcart_selected_printer", opt.value);
                            localStorage.setItem("lastUsedPrinter", opt.value);
                          }
                        }
                      }}
                      placeholder={
                        availablePrinters.length === 0 ? "No Printers Found" : "Select Printer"
                      }
                      height={48}
                      {...selectThemeStyles}
                    />
                  </div>
                </div>

                {/* ROW 2 RIGHT: Single Quantity Dropdown + Action Buttons (Starts EXACTLY below Scan Search Bar) */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
                  {/* Order Composition Filter Select Dropdown (Single Quantity) */}
                  <div className="w-full sm:w-52 md:w-56 shrink-0">
                    <ReactSelect
                      borderRadius={16}
                      options={orderTypeOptions}
                      value={
                        orderTypeOptions.find((opt) => opt.value === orderTypeFilter) ??
                        orderTypeOptions[0]
                      }
                      onChange={(opt) => {
                        if (opt?.value) {
                          setOrderTypeFilter(opt.value);
                          setPage(1);
                        }
                      }}
                      height={48}
                      {...selectThemeStyles}
                    />
                  </div>

                  {/* Picklist Button */}
                  <button
                    type="button"
                    disabled={isMappingsLoading || isGeneratingPicklist}
                    onClick={() => handlePicklistAction("excel")}
                    className={`inline-flex h-11 sm:h-12 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-2xl border px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] ${
                      isMappingsLoading || isGeneratingPicklist
                        ? "cursor-not-allowed border-[#E8C16D]/30 bg-[#FEFAEE]/60 text-[#6A4D1D]/60 dark:border-[#0A0E1A]/40 dark:bg-[#0A0E1A]/60 dark:text-[#E8C16D]/60"
                        : "cursor-pointer border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0"
                    }`}
                    title={
                      isMappingsLoading || isGeneratingPicklist
                        ? "Preparing SKU mappings for picklist..."
                        : "Download Excel picklist (2-column 40 left / 40 right A4 layout)"
                    }
                  >
                    {isGeneratingPicklist ? (
                      <>
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#E8C16D]" />
                        <span className="whitespace-nowrap">Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">
                          Picklist{" "}
                          {selectedRows.size > 0
                            ? `(${selectedRows.size})`
                            : `(All ${mappedOrders.length})`}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Toggle Show Printed / Unprinted Orders */}
                  {printedCountVal > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPrinted((prev) => !prev);
                        setPage(1);
                        setSelectedRows(new Set());
                      }}
                      className={`inline-flex h-11 sm:h-12 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-2xl border px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer ${
                        showPrinted
                          ? "border-emerald-300 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
                          : "border-[#E8C16D] dark:border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#251E11] ring-2 ring-[#E8C16D]/30"
                      }`}
                    >
                      {showPrinted ? (
                        <>
                          <EyeOff className="h-4 w-4 shrink-0" />
                          <span className="whitespace-nowrap">
                            Back to Unprinted ({remainingCount})
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="whitespace-nowrap">
                            Show Printed ({printedCountVal})
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Print Button */}
                  <button
                    type="button"
                    onClick={handlePrintSelectedOrAll}
                    className="inline-flex h-11 sm:h-12 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-2xl border border-transparent bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] px-4 sm:px-5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <Printer className="h-4 w-4 shrink-0" />
                    <span>
                      Print {selectedRows.size > 0 ? `(${selectedRows.size})` : ""}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ===================================================== */}
          {/* CONTENT AREA: TABLE TAB (WITH STOP-SCROLLING) OR PDF TAB */}
          {/* ===================================================== */}
          {activeTab === "table" ? (
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              {/* Active "Show Printed Only" Banner Indicator */}
              {showPrinted && (
                <div className="shrink-0 flex items-center justify-between rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/90 dark:bg-emerald-950/30 px-4 py-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold">
                      Viewing Printed Orders Only ({filteredOrders.length})
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                      — Displaying only orders that have already been printed.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrinted(false);
                      setPage(1);
                      setSelectedRows(new Set());
                    }}
                    className="font-bold underline underline-offset-4 hover:opacity-80 cursor-pointer text-xs ml-2 shrink-0 text-emerald-700 dark:text-emerald-400"
                  >
                    Back to Unprinted ({remainingCount})
                  </button>
                </div>
              )}

              {/* =================================================== */}
              {/* MOBILE VIEW: RESPONSIVE ORDER CARDS (< 768px)       */}
              {/* =================================================== */}
              <div className="space-y-3 md:hidden">
                {/* Mobile Select All Bar */}
                <div className="flex items-center justify-between rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] p-3 text-xs font-bold text-white shadow-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={toggleAllPage}
                    />
                    <span>Select All Page ({paginatedOrders.length})</span>
                  </label>
                  <span className="text-[#E8C16D] font-bold">
                    {selectedRows.size} Selected
                  </span>
                </div>

                {paginatedOrders.length === 0 ? (
                  <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 sm:p-8 text-center text-xs text-slate-500 dark:text-slate-400 shadow-sm space-y-2">
                    <p>
                      {showPrinted
                        ? "No printed orders match your current filter."
                        : printedOrders.size > 0
                        ? `All orders in this view have been printed! (${printedCountVal} printed)`
                        : "No orders match your current search or filter."}
                    </p>
                    {printedOrders.size > 0 && !showPrinted ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowPrinted(true);
                          setPage(1);
                          setSelectedRows(new Set());
                        }}
                        className="font-bold text-[#B88728] dark:text-[#E8C16D] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                      >
                        Click here to view printed orders ({printedCountVal})
                      </button>
                    ) : showPrinted ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowPrinted(false);
                          setPage(1);
                          setSelectedRows(new Set());
                        }}
                        className="font-bold text-[#B88728] dark:text-[#E8C16D] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                      >
                        Click here to return to unprinted orders ({remainingCount})
                      </button>
                    ) : null}
                  </div>
                ) : (
                  paginatedOrders.map((item) => (
                    <div
                      key={item.index}
                      className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm transition-all space-y-2.5 ${
                        selectedRows.has(item.index)
                          ? "border-[#E8C16D] bg-[#FFF9EC]/40 dark:bg-[#1A160E]/50 ring-1 ring-[#E8C16D]"
                          : "border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] hover:border-[#E8C16D]/40"
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2">
                        <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                          <Checkbox
                            checked={selectedRows.has(item.index)}
                            onCheckedChange={(checked) =>
                              handleSelectRow(item.index, Boolean(checked))
                            }
                          />
                          <span className="font-mono text-xs font-bold text-[#0A0E1A] dark:text-white truncate">
                            #{item.orderNumber} • {item.orderId}
                          </span>
                        </label>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => handlePrintSingleOrder(item)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] transition active:scale-95 cursor-pointer"
                            title={`Silently print shipping label for ${item.orderId}`}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <span className="rounded-lg bg-amber-100/80 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider border border-amber-200/60 dark:border-amber-900/40">
                            {item.orderType === "multiple_sku"
                              ? "Multiple FSN"
                              : item.orderType === "multiple_pieces"
                              ? "Multiple Pieces"
                              : "Single Quantity"}
                          </span>
                        </div>
                      </div>

                      {/* Card Detail Grid (2x2) */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* AWB Tracking */}
                        <div className="rounded-xl bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E7E0D2]/60 dark:border-white/[0.06] p-2 space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                            AWB Tracking
                          </span>
                          <div className="flex items-center justify-between gap-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
                            <span className="truncate block">{item.awb || "—"}</span>
                            {printedOrders.has(item.pageIndex) && (
                              <span className="rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 px-1.5 py-0.2 text-[9px] font-bold text-blue-700 dark:text-blue-300 inline-flex items-center gap-0.5 shrink-0">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Printed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* FSN Code */}
                        <div className="rounded-xl bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E7E0D2]/60 dark:border-white/[0.06] p-2 space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                            FSN Code
                          </span>
                          {item.items && item.items.length > 1 ? (
                            <div className="flex flex-col gap-0.5 font-medium text-[#0A0E1A] dark:text-white">
                              {item.items.map((i, idx) => (
                                <span key={idx} className="truncate">
                                  {i.fsn || skuDetailsMap.get((i.sku || "").trim().toLowerCase())?.fsn || "—"}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="font-medium text-[#0A0E1A] dark:text-white truncate block">
                              {item.fsn || "—"}
                            </span>
                          )}
                        </div>

                        {/* SKU */}
                        <div className="col-span-2 rounded-xl bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E7E0D2]/60 dark:border-white/[0.06] p-2 space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                            SKU
                          </span>
                          {item.items && item.items.length > 1 ? (
                            <div className="flex flex-col gap-1 font-medium text-slate-800 dark:text-slate-200">
                              {item.items.map((i, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                                  <span className="break-all">{i.sku}</span>
                                  {i.quantity > 1 && (
                                    <span className="inline-flex items-center rounded bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-800 dark:text-amber-300">
                                      {i.quantity} Pieces
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap font-medium text-slate-800 dark:text-slate-200">
                              <span className="break-all block">{item.sku || "—"}</span>
                              {Boolean(item.totalQuantity && item.totalQuantity > 1) && (
                                <span className="inline-flex items-center rounded bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-800 dark:text-amber-300">
                                  {item.totalQuantity} Pieces
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Customer */}
                        <div className="col-span-2 rounded-xl bg-[#FAF8F5] dark:bg-white/[0.02] border border-[#E7E0D2]/60 dark:border-white/[0.06] p-2 space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                            Customer
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                            {item.customerName || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Mobile Pagination */}
                <div className="md:hidden">
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    total={totalRecords}
                    limit={limit}
                    itemName="records"
                    variant="dark"
                    className="border border-[#E7E0D2] dark:border-white/[0.08] rounded-2xl bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 py-3"
                    onPageChange={setPage}
                    onLimitChange={(newLimit) => {
                      setLimit(newLimit);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              {/* =================================================== */}
              {/* DESKTOP VIEW: FULL TABLE (>= 768px)                 */}
              {/* =================================================== */}
              <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
                <div
                  ref={tableContainerRef}
                  className="w-full overflow-x-auto flex-1 min-h-0 max-h-[620px] lg:max-h-none overflow-y-auto custom-scrollbar"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <table className="w-full min-w-[940px] lg:min-w-[1000px] border-collapse text-left font-sans relative">
                    <thead className="sticky top-0 z-10 bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08] shadow-xs">
                      <tr>
                        <th className="w-12 min-w-[44px] px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={allPageSelected}
                              onCheckedChange={toggleAllPage}
                            />
                          </div>
                        </th>
                        <th className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                          Flipcart Order ID
                        </th>
                        <th className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                          AWB Tracking
                        </th>
                        <th className="w-36 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                          FSN Code
                        </th>
                        <th className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                          SKU
                        </th>
                        <th className="w-40 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                          Customer
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-sans">
                      {paginatedOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center text-slate-500 dark:text-slate-400"
                          >
                            <div className="flex flex-col items-center justify-center gap-2">
                              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                              <p className="font-bold text-[#0A0E1A] dark:text-white">
                                {showPrinted
                                  ? "No printed orders match your current filter."
                                  : printedOrders.size > 0
                                  ? `All orders in this view have been printed! (${printedCountVal} printed)`
                                  : "No orders match your current search or filter."}
                              </p>
                              {printedOrders.size > 0 && !showPrinted ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowPrinted(true);
                                    setPage(1);
                                    setSelectedRows(new Set());
                                  }}
                                  className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                                >
                                  Click here to view printed orders ({printedCountVal})
                                </button>
                              ) : showPrinted ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowPrinted(false);
                                    setPage(1);
                                    setSelectedRows(new Set());
                                  }}
                                  className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                                >
                                  Click here to return to unprinted orders ({remainingCount})
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedOrders.map((item) => (
                          <tr
                            key={item.index}
                            className="transition hover:bg-[#FAF8F5] dark:hover:bg-white/[0.06]"
                          >
                            {/* Checkbox */}
                            <td className="w-12 min-w-[44px] px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center">
                                <Checkbox
                                  checked={selectedRows.has(item.index)}
                                  onCheckedChange={(checked) =>
                                    handleSelectRow(item.index, Boolean(checked))
                                  }
                                />
                              </div>
                            </td>

                            {/* Flipcart Order ID */}
                            <td className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              <span>{item.orderId}</span>
                            </td>

                            {/* AWB Tracking + Printed status */}
                            <td className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-medium whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {item.awb || "—"}
                                </span>
                                {printedOrders.has(item.pageIndex) && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                    <CheckCircle2 className="h-3 w-3" /> Printed
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* FSN Code matched from DB */}
                            <td className="w-36 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-medium text-slate-900 dark:text-white">
                              {item.items && item.items.length > 0 ? (
                                <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                                  {item.items.map((i, idx) => {
                                    const isNotLast = idx < (item.items?.length || 1) - 1;
                                    const displayFsn =
                                      i.fsn ||
                                      skuDetailsMap.get((i.sku || "").trim().toLowerCase())?.fsn ||
                                      "—";
                                    return (
                                      <div
                                        key={idx}
                                        className="break-all sm:break-normal sm:whitespace-nowrap flex flex-wrap sm:flex-nowrap items-center justify-center gap-1"
                                      >
                                        <span>{displayFsn}</span>
                                        {isNotLast ? (
                                          <span className="font-bold text-slate-400 dark:text-slate-500 text-[11px] ml-1">/</span>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span>{item.fsn || "—"}</span>
                              )}
                            </td>

                            {/* SKU identified from Shipping Label */}
                            <td className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-medium text-slate-900 dark:text-white">
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                {item.items && item.items.length > 0 ? (
                                  item.items.map((i, idx) => {
                                    const isNotLast = idx < (item.items?.length || 1) - 1;
                                    const itemQty = i.quantity || 1;
                                    return (
                                      <div
                                        key={idx}
                                        className="break-all sm:break-normal sm:whitespace-nowrap flex flex-wrap sm:flex-nowrap items-center justify-center gap-1"
                                      >
                                        <span>{i.sku}</span>
                                        {itemQty > 1 && (
                                          <span className="inline-flex items-center rounded bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300 ml-0.5">
                                            {itemQty} Pieces
                                          </span>
                                        )}
                                        {isNotLast ? (
                                          <span className="font-bold text-slate-400 dark:text-slate-500 text-[11px] ml-1">/</span>
                                        ) : null}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="flex flex-col items-center justify-center gap-0.5">
                                    <span className="break-all sm:break-normal sm:whitespace-nowrap">{item.sku || "—"}</span>
                                    {Boolean(item.totalQuantity && item.totalQuantity > 1) && (
                                      <span className="inline-flex items-center rounded bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300 ml-0.5">
                                        {item.totalQuantity} Pieces
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Customer Name */}
                            <td className="w-40 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {item.customerName || "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  total={totalRecords}
                  limit={limit}
                  itemName="records"
                  variant="dark"
                  className="shrink-0 border-t border-[#F1E8D0] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
                  onPageChange={setPage}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          ) : (
            /* ===================================================== */
            /* PDF VIEWER TAB MATCHING AMAZON ORDER PROCESS RESULTS  */
            /* ===================================================== */
            <div
              ref={previewCardRef}
              className="flex flex-col flex-1 min-h-0 space-y-4 border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm"
              style={{
                height: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
                minHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#B88728] dark:text-[#E8C16D]" />
                    {currentConfig.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentConfig.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="w-full sm:w-60 md:w-64 shrink-0">
                    <ReactSelect
                      borderRadius={16}
                      options={viewOptions}
                      value={
                        viewOptions.find((opt) => opt.value === selectedView) ??
                        viewOptions[0]
                      }
                      onChange={(opt) => {
                        if (opt?.value) {
                          setSelectedView(opt.value as FlipcartPdfViewType);
                        }
                      }}
                      height={48}
                      {...selectThemeStyles}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={currentConfig.onDownload}
                    leftIcon={<Download className="h-4 w-4" />}
                    className="h-11 sm:h-12 w-full sm:w-auto rounded-2xl border-transparent bg-[#E8C16D] text-xs sm:text-sm font-bold text-[#0A0E1A] hover:bg-[#d4af5a] px-4 cursor-pointer shrink-0"
                  >
                    {currentConfig.downloadText}
                  </Button>
                </div>
              </div>

              {currentConfig.url ? (
                <div className="relative w-full flex-1 min-h-[300px] overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] shadow-inner">
                  <iframe
                    src={`${currentConfig.url}#toolbar=1&navpanes=1&statusbar=1`}
                    className="absolute inset-0 w-full h-full border-none"
                    title={currentConfig.title}
                  />
                </div>
              ) : (
                <div className="py-20 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Document preview is currently unavailable.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Missing SKU Modal (Matching Amazon Order Process HUD Emblem styling) */}
      <FlipcartMissingSkuModal
        isOpen={isMissingSkuModalOpen && modalMissingSkus.length > 0}
        onClose={() => setIsMissingSkuModalOpen(false)}
        missingSkus={modalMissingSkus}
        onRefreshMappings={fetchFlipcartMappings}
        onReset={handleReset}
      />
    </DashboardLayout>
  );
}
