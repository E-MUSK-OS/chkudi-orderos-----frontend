"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/ThemeProvider";
import {
  Zap,
  Printer,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  X,
  Layers,
  Sparkles,
  Send,
  LogOut,
  Table,
  Search,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import Pagination from "@/components/ui/Pagination";
import { Checkbox } from "@/components/ui/checkbox";
import {
  chromeExtensionPrintService,
  resolveCurrentlyConnectedPrinter,
  isPrinterConnectedAndOnline,
} from "@/components/Dashboard/Labels/services/printAgent.service";
import type { useCamera } from "../hooks/useCamera";
import type { useRecorder } from "../hooks/useRecorder";
import type { useScanner } from "../hooks/useScanner";
import { useFlipkartOrderStore } from "@/components/Dashboard/OrderProcess/Flipkart/OrderProcess/store/useFlipkartOrderStore";
import {
  FlipkartOrderItem,
  FlipkartOrderLineItem,
} from "@/components/Dashboard/OrderProcess/Flipkart/OrderProcess/types";
import {
  getOrderTypeForItem,
  getOrderTypeLabel,
} from "@/components/Dashboard/OrderProcess/Flipkart/OrderProcess/components/FlipkartResultView";
import { isSkuBidirectionalMatch } from "@/components/Dashboard/OrderProcess/Flipkart/OrderProcess/utils/flipkartSkuMatch";
import { flipkartImportService } from "@/components/Dashboard/Products/ManageProducts/services/flipkartImport.service";
import {
  resolveVmsPrinter,
  printSingleFlipkartOrder,
  syncOrderPrinted,
} from "../utils/flipkartVmsPrint";
import { CameraPreview, UploadQueue, RecentScans } from "./";
import FlipkartStageTransitionModal from "./FlipkartStageTransitionModal";
import { isQrCode } from "../utils/validateTracking";
import Input from "@/components/ui/Input";

interface OrderRequirement {
  sku: string;
  fsn?: string;
  asin?: string;
  requiredQty: number;
  scannedQty: number;
}

interface FlipkartVMSOperatorProps {
  camera: ReturnType<typeof useCamera>;
  recorder: ReturnType<typeof useRecorder>;
  scanner: ReturnType<typeof useScanner>;
  onLogout: () => void;
  operator: { operatorName: string } | null;
  selectedAccount: { accountName: string } | null;
  isFromOrderProcess?: boolean;
}

export const FlipkartVMSOperator: React.FC<FlipkartVMSOperatorProps> = ({
  camera,
  recorder,
  scanner,
  onLogout,
  operator,
  selectedAccount,
  isFromOrderProcess,
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const showBackToOrderProcess = useMemo(() => {
    if (typeof isFromOrderProcess === "boolean") return isFromOrderProcess;
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("from") === "order_process";
  }, [isFromOrderProcess]);

  const {
    summary,
    files,
    restoreProcessData,
    activeHistoryBatchId,
  } = useFlipkartOrderStore();

  const [isLoading, setIsLoading] = useState(!summary);
  const [activeStage, setActiveStage] = useState<"single_quantity" | "multiple_sku" | "multiple_pieces">("single_quantity");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isProcessingPrint, setIsProcessingPrint] = useState(false);
  const [connectedPrinter, setConnectedPrinter] = useState<string>("");
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("flipkart_selected_printer") ||
        localStorage.getItem("lastUsedPrinter") ||
        ""
      );
    }
    return "";
  });

  // Database SKU Mappings & Resolved FSN State
  const [skuDetailsMap, setSkuDetailsMap] = useState<
    Map<string, { fsn?: string; asin?: string; rackAddress?: string }>
  >(new Map());
  const [isMappingsLoading, setIsMappingsLoading] = useState(false);

  // Table View & Controls State (Parity with Flipkart Order Process Result Page)
  const [showTable, setShowTable] = useState(false);
  const [showPrintedTable, setShowPrintedTable] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [tableLimit, setTableLimit] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Transition Modal State
  const [transitionModal, setTransitionModal] = useState<{
    open: boolean;
    message: string;
    stageName?: string;
    nextStage: "single_quantity" | "multiple_sku" | "multiple_pieces";
  }>({
    open: false,
    message: "",
    stageName: "",
    nextStage: "multiple_sku",
  });

  // Multi-item order scanning progress tracker
  const multiScanProgressRef = useRef<Map<number, OrderRequirement[]>>(new Map());

  // Printed Orders Set
  const printedOrdersRef = useRef<Set<number>>(
    new Set(Array.isArray((summary as any)?.printedIndices) ? (summary as any).printedIndices : [])
  );
  const [printedOrders, setPrintedOrders] = useState<Set<number>>(
    () => new Set(Array.isArray((summary as any)?.printedIndices) ? (summary as any).printedIndices : [])
  );

  const activeBatchKey =
    activeHistoryBatchId ||
    (summary as any)?.id ||
    (summary as any)?.batchId ||
    "active";

  // 1. Hydrate batch data if page was refreshed
  useEffect(() => {
    if (!showBackToOrderProcess) {
      setIsLoading(false);
      return;
    }

    if (summary) {
      setIsLoading(false);
      return;
    }

    restoreProcessData().then((hasData) => {
      setIsLoading(false);
      if (!hasData) {
        toast.info("No active Flipkart batch found. Please upload a batch first.");
      }
    });
  }, [summary, restoreProcessData, showBackToOrderProcess]);

  // 2. Synchronize printed orders from store
  useEffect(() => {
    if (!showBackToOrderProcess) return;
    const existing = (summary as any)?.printedIndices;
    if (Array.isArray(existing)) {
      const s = new Set<number>(existing);
      printedOrdersRef.current = s;
      setPrintedOrders(s);
    }
  }, [summary, showBackToOrderProcess]);

  // 3. Resolve connected thermal printer on mount (matching Flipkart Order Process Result Page)
  useEffect(() => {
    if (!showBackToOrderProcess) return;
    let isMounted = true;
    async function loadPrinters() {
      try {
        const details = await chromeExtensionPrintService.getPrintersDetailed();
        let list = details.map((p) => p.name).filter(Boolean);
        if (list.length === 0) {
          list = await chromeExtensionPrintService.getPrinters();
        }
        if (isMounted && list && list.length > 0) {
          setAvailablePrinters(list);

          const saved =
            typeof window !== "undefined"
              ? localStorage.getItem("flipkart_selected_printer") ||
                localStorage.getItem("lastUsedPrinter")
              : null;

          setSelectedPrinter((current) => {
            const candidate = current || saved;
            if (candidate) {
              const matched = list.find(
                (p) => p.toLowerCase().trim() === candidate.toLowerCase().trim()
              );
              if (matched) {
                setConnectedPrinter(matched);
                if (typeof window !== "undefined") {
                  localStorage.setItem("flipkart_selected_printer", matched);
                  localStorage.setItem("lastUsedPrinter", matched);
                }
                return matched;
              }
            }

            const { printer: preferred } = resolveCurrentlyConnectedPrinter(list, details);
            const chosen = preferred && list.includes(preferred) ? preferred : list[0];
            setConnectedPrinter(chosen);
            if (typeof window !== "undefined" && chosen) {
              localStorage.setItem("flipkart_selected_printer", chosen);
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
    const t1 = setTimeout(loadPrinters, 500);
    return () => {
      isMounted = false;
      clearTimeout(t1);
    };
  }, []);

  // 4. Focus barcode input
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [activeStage]);

  // 5. Query backend database to resolve FSN codes and Rack Addresses for all batch SKUs
  useEffect(() => {
    if (!summary?.orders || summary.orders.length === 0) return;

    let isMounted = true;
    async function resolveBatchSkus() {
      try {
        setIsMappingsLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "";
        const rawOrders = summary?.orders || [];
        const skusToResolve = new Set<string>();

        rawOrders.forEach((o) => {
          if (o.items && o.items.length > 0) {
            o.items.forEach((it) => {
              if (it.sku) {
                it.sku
                  .split(/[\r\n\/,+|]+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .forEach((s) => skusToResolve.add(s));
              }
            });
          } else if (o.sku) {
            o.sku
              .split(/[\r\n\/,+|]+/)
              .map((s) => s.trim())
              .filter(Boolean)
              .forEach((s) => skusToResolve.add(s));
          }
        });

        const uniqueSkus = Array.from(skusToResolve);
        if (uniqueSkus.length === 0) {
          if (isMounted) setIsMappingsLoading(false);
          return;
        }

        const res = await flipkartImportService.resolveSkus(uniqueSkus, token);
        const map = new Map<string, { fsn?: string; asin?: string; rackAddress?: string }>();

        const mergeMapping = (key?: string | null, asin?: string | null, rack?: string | null, fsn?: string | null) => {
          if (!key) return;
          const cleanKey = String(key).trim();
          const lowerKey = cleanKey.toLowerCase();
          if (!lowerKey || lowerKey === "n/a" || lowerKey === "-" || lowerKey === "—") return;

          const cleanAsin = asin && typeof asin === "string" ? asin.trim() : "";
          const cleanFsn = fsn && typeof fsn === "string" ? fsn.trim() : (cleanAsin || "");
          const cleanRack = rack && typeof rack === "string" ? rack.trim() : "";

          const existing = map.get(lowerKey) || { asin: "", fsn: "", rackAddress: "" };
          const updated = {
            asin: existing.asin || cleanAsin || existing.fsn || cleanFsn || "",
            fsn: existing.fsn || cleanFsn || existing.asin || cleanAsin || "",
            rackAddress: existing.rackAddress || cleanRack || "",
          };

          map.set(lowerKey, updated);
          if (cleanKey !== lowerKey) {
            map.set(cleanKey, updated);
          }
        };

        if (res?.data && Array.isArray(res.data)) {
          res.data.forEach((item: any) => {
            const rawSku = item.sku || "";
            const rawAsin = item.asin || item.fsn || "";
            const rawFsn = item.fsn || item.asin || "";
            const rawRack = item.rackAddress || "";
            if (rawSku) mergeMapping(rawSku, rawAsin, rawRack, rawFsn);
            if (rawAsin) mergeMapping(rawAsin, rawAsin, rawRack, rawFsn);
            if (rawFsn && rawFsn !== rawAsin) mergeMapping(rawFsn, rawAsin, rawRack, rawFsn);
          });
        }

        if (isMounted) {
          setSkuDetailsMap(map);
        }
      } catch (err) {
        console.warn("Flipkart VMS SKU resolution failed:", err);
      } finally {
        if (isMounted) {
          setIsMappingsLoading(false);
        }
      }
    }

    resolveBatchSkus();

    return () => {
      isMounted = false;
    };
  }, [summary?.orders]);

  // Construct mapped orders with resolved FSN, ASIN & Rack Address
  const mappedOrders = useMemo((): FlipkartOrderItem[] => {
    const rawOrders = summary?.orders || [];
    return rawOrders.map((order, idx) => {
      const rawItems: FlipkartOrderLineItem[] =
        order.items && order.items.length > 0
          ? order.items
          : (order.sku || "")
            .split("/")
            .map((s) => ({
              sku: s.trim(),
              quantity: 1,
              description: order.description,
              asin: "",
              fsn: "",
              rackAddress: "",
            }))
            .filter((it) => Boolean(it.sku));

      const mappedItems: FlipkartOrderLineItem[] = rawItems.map((it) => {
        const cleanItemSku = (it.sku || "").trim();
        const normItemSku = cleanItemSku.toLowerCase();
        let itemMapped =
          skuDetailsMap.get(normItemSku) || skuDetailsMap.get(cleanItemSku);
        if (!itemMapped || (!itemMapped.asin && !itemMapped.rackAddress)) {
          for (const [dbSku, details] of skuDetailsMap.entries()) {
            if (
              (details.asin || details.rackAddress) &&
              isSkuBidirectionalMatch(dbSku, normItemSku)
            ) {
              itemMapped = details;
              break;
            }
          }
        }
        const resolvedAsin = itemMapped?.asin || it.asin || itemMapped?.fsn || it.fsn || "";
        const resolvedFsn = itemMapped?.fsn || it.fsn || itemMapped?.asin || "";
        const resolvedRack = itemMapped?.rackAddress || it.rackAddress || "";
        return {
          ...it,
          sku: cleanItemSku,
          asin: resolvedAsin,
          fsn: resolvedFsn,
          rackAddress: resolvedRack,
        };
      });

      let combinedAsin = "";
      if (mappedItems.length > 0) {
        combinedAsin = mappedItems.map((it) => it.asin || it.fsn || "—").join(" / ");
      } else {
        const cleanSku = (order.sku || "").trim();
        const mapped =
          skuDetailsMap.get(cleanSku.toLowerCase()) ||
          skuDetailsMap.get(cleanSku);
        combinedAsin = mapped?.asin || mapped?.fsn || order.asin || order.fsn || "—";
      }
      if (!combinedAsin || combinedAsin === "—") {
        combinedAsin = order.asin || order.fsn || "—";
      }

      const combinedFsn = combinedAsin;

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

      return {
        ...order,
        index: typeof order.index === "number" ? order.index : idx,
        asin: combinedAsin || "—",
        fsn: combinedFsn || "—",
        rackAddress: combinedRack,
        items: mappedItems,
      };
    });
  }, [summary?.orders, skuDetailsMap]);

  const orders = mappedOrders;

  // Stage classification counts
  const stageStats = useMemo(() => {
    const single = orders.filter((o) => getOrderTypeForItem(o) === "single_quantity");
    const multiSku = orders.filter((o) => getOrderTypeForItem(o) === "multiple_sku");
    const multiPiece = orders.filter((o) => getOrderTypeForItem(o) === "multiple_pieces");

    const singleCompleted = single.filter((o) => printedOrders.has(o.pageIndex)).length;
    const multiSkuCompleted = multiSku.filter((o) => printedOrders.has(o.pageIndex)).length;
    const multiPieceCompleted = multiPiece.filter((o) => printedOrders.has(o.pageIndex)).length;

    return {
      single: { total: single.length, completed: singleCompleted, remaining: single.length - singleCompleted },
      multiSku: { total: multiSku.length, completed: multiSkuCompleted, remaining: multiSku.length - multiSkuCompleted },
      multiPiece: { total: multiPiece.length, completed: multiPieceCompleted, remaining: multiPiece.length - multiPieceCompleted },
    };
  }, [orders, printedOrders]);

  // Determine starting active stage based on remaining orders
  useEffect(() => {
    if (orders.length === 0) return;

    if (stageStats.single.remaining > 0) {
      setActiveStage("single_quantity");
    } else if (stageStats.multiSku.remaining > 0) {
      setActiveStage("multiple_sku");
    } else if (stageStats.multiPiece.remaining > 0) {
      setActiveStage("multiple_pieces");
    }
  }, [orders.length, stageStats.single.remaining, stageStats.multiSku.remaining, stageStats.multiPiece.remaining]);

  const selectThemeStyles = useMemo(
    () => ({
      borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#E7E0D2",
      backgroundColor: isDark ? "#0A0E1A" : "#FFFFFF",
      textColor: isDark ? "#E8C16D" : "#0A0E1A",
      placeholderColor: isDark ? "#E8C16D" : "#64748B",
      indicatorColor: isDark ? "#E8C16D" : "#0A0E1A",
      menuBackgroundColor: isDark ? "#0A0E1A" : "#FFFFFF",
      optionHoverColor: isDark ? "#161D2E" : "#FFF9EC",
      optionSelectedColor: "#E8C16D",
      optionSelectedTextColor: "#0A0E1A",
      optionTextColor: isDark ? "#ffffff" : "#0A0E1A",
      menuPortalTarget: typeof window !== "undefined" ? document.body : undefined,
    }),
    [isDark]
  );

  const printerOptions: SelectOption[] = useMemo(
    () =>
      availablePrinters.map((p) => ({
        label: p,
        value: p,
      })),
    [availablePrinters]
  );

  const orderTypeOptions: SelectOption[] = useMemo(
    () => [
      {
        label: `Single Quantity (${stageStats.single.remaining})`,
        value: "single_quantity",
      },
      {
        label: `Multiple FSN (${stageStats.multiSku.remaining})`,
        value: "multiple_sku",
      },
      {
        label: `Multiple Pieces (${stageStats.multiPiece.remaining})`,
        value: "multiple_pieces",
      },
    ],
    [stageStats]
  );

  // Filtered orders for table based on activeStage + showPrintedTable + tableSearchQuery
  const filteredOrders = useMemo(() => {
    return orders.filter((item) => {
      // 1. Stage filter
      if (getOrderTypeForItem(item) !== activeStage) return false;

      // 2. Printed filter
      const isPrinted = printedOrders.has(item.pageIndex);
      if (showPrintedTable ? !isPrinted : isPrinted) return false;

      // 3. Search filter
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.toLowerCase().trim();
        const matchOrder = (item.orderId || "").toLowerCase().includes(q);
        const matchAwb = (item.awb || "").toLowerCase().includes(q);
        const matchSku = (item.sku || "").toLowerCase().includes(q);
        const matchFsn = (item.fsn || "").toLowerCase().includes(q);
        const matchCust = (item.customerName || "").toLowerCase().includes(q);
        const matchNum = String(item.orderNumber) === q;

        let matchItem = false;
        if (item.items && item.items.length > 0) {
          matchItem = item.items.some((it) => {
            const itSkuMatch = (it.sku || "").toLowerCase().includes(q);
            const itFsnMatch = (it.fsn || "").toLowerCase().includes(q);
            const details = skuDetailsMap.get((it.sku || "").trim().toLowerCase());
            const detailsFsnMatch = (details?.fsn || "").toLowerCase().includes(q);
            return itSkuMatch || itFsnMatch || detailsFsnMatch;
          });
        }
        const rootDetails = skuDetailsMap.get((item.sku || "").trim().toLowerCase());
        const rootDetailsFsnMatch = (rootDetails?.fsn || "").toLowerCase().includes(q);

        if (!matchOrder && !matchAwb && !matchSku && !matchFsn && !matchCust && !matchNum && !matchItem && !rootDetailsFsnMatch) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeStage, showPrintedTable, tableSearchQuery, printedOrders, skuDetailsMap]);

  const totalTableRecords = filteredOrders.length;
  const totalTablePages = Math.max(1, Math.ceil(totalTableRecords / tableLimit));
  const currentTablePage = Math.min(tablePage, totalTablePages);
  const paginatedOrders = useMemo(() => {
    const start = (currentTablePage - 1) * tableLimit;
    return filteredOrders.slice(start, start + tableLimit);
  }, [filteredOrders, currentTablePage, tableLimit]);

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

  // Audio alerts
  const playSound = useCallback((type: "success" | "warning" | "error") => {
    try {
      const src =
        type === "success"
          ? "/sounds/success.wav"
          : type === "warning"
            ? "/sounds/warning.wav"
            : "/sounds/error.wav";
      const audio = new Audio(src);
      audio.play().catch(() => { });
    } catch { }
  }, []);

  // Build requirements for multi-item orders
  const buildOrderRequirements = (order: FlipkartOrderItem): OrderRequirement[] => {
    if (order.items && order.items.length > 0) {
      const map = new Map<string, OrderRequirement>();
      order.items.forEach((it) => {
        const cleanSku = (it.sku || "").trim();
        const lower = cleanSku.toLowerCase();
        if (!lower) return;
        const existing = map.get(lower);
        const qty = it.quantity || 1;
        const mapped = skuDetailsMap.get(lower) || skuDetailsMap.get(cleanSku);
        const resolvedFsn = it.fsn || mapped?.fsn || mapped?.asin || order.fsn || "";
        const resolvedAsin = it.asin || mapped?.asin || mapped?.fsn || order.asin || "";
        if (existing) {
          existing.requiredQty += qty;
        } else {
          map.set(lower, {
            sku: cleanSku,
            fsn: resolvedFsn,
            asin: resolvedAsin,
            requiredQty: qty,
            scannedQty: 0,
          });
        }
      });
      if (map.size > 0) return Array.from(map.values());
    }

    const rawSkus = (order.sku || "").split("/").map((s) => s.trim()).filter(Boolean);
    if (rawSkus.length > 1) {
      const map = new Map<string, OrderRequirement>();
      rawSkus.forEach((s) => {
        const lower = s.toLowerCase();
        const existing = map.get(lower);
        const mapped = skuDetailsMap.get(lower) || skuDetailsMap.get(s);
        const resolvedFsn = mapped?.fsn || mapped?.asin || order.fsn || "";
        const resolvedAsin = mapped?.asin || mapped?.fsn || order.asin || "";
        if (existing) {
          existing.requiredQty += 1;
        } else {
          map.set(lower, {
            sku: s,
            fsn: resolvedFsn,
            asin: resolvedAsin,
            requiredQty: 1,
            scannedQty: 0,
          });
        }
      });
      return Array.from(map.values());
    }

    const totalQty = order.totalQuantity || 1;
    const cleanSku = (order.sku || "").trim();
    const mapped = skuDetailsMap.get(cleanSku.toLowerCase()) || skuDetailsMap.get(cleanSku);
    return [
      {
        sku: order.sku || "",
        fsn: order.fsn || mapped?.fsn || mapped?.asin || "",
        asin: order.asin || mapped?.asin || mapped?.fsn || "",
        requiredQty: totalQty,
        scannedQty: 0,
      },
    ];
  };

  const isReqMatch = (req: OrderRequirement, query: string): boolean => {
    const qN = query.trim().toUpperCase();
    if (!qN) return false;
    const fsnN = (req.fsn || "").trim().toUpperCase();
    const asinN = (req.asin || "").trim().toUpperCase();

    // ONLY match FSN or ASIN (which represents FSN). SKU matching is explicitly blocked.
    if (fsnN && fsnN !== "N/A" && fsnN !== "—" && fsnN !== "-") {
      if (fsnN === qN || (qN.length >= 6 && fsnN.includes(qN))) return true;
    }
    if (asinN && asinN !== "N/A" && asinN !== "—" && asinN !== "-") {
      if (asinN === qN || (qN.length >= 6 && asinN.includes(qN))) return true;
    }

    return false;
  };

  const isOrderLevelMatch = (order: FlipkartOrderItem, query: string): boolean => {
    const qN = query.trim().toUpperCase();
    if (!qN) return false;
    const cleanAwb = (order.awb || "").trim().toUpperCase();
    // ONLY AWB Tracking ID is matched. Order ID and order numbers are strictly blocked.
    if (!cleanAwb || cleanAwb === "N/A" || cleanAwb === "—" || cleanAwb === "-") return false;
    return cleanAwb === qN;
  };

  const doesOrderMatchQuery = (order: FlipkartOrderItem, query: string): boolean => {
    const qN = query.trim().toUpperCase();
    if (!qN) return false;

    // 1. AWB Tracking ID match
    if (isOrderLevelMatch(order, query)) return true;

    // 2. Multi-scan FSN requirements match
    const reqs = multiScanProgressRef.current.get(order.pageIndex) || buildOrderRequirements(order);
    if (reqs.some((r) => isReqMatch(r, query))) return true;

    // 3. Check direct skuDetailsMap for FSN/ASIN match
    const cleanOrderSku = (order.sku || "").trim().toLowerCase();
    const details = skuDetailsMap.get(cleanOrderSku);
    if (details) {
      const dFsn = (details.fsn || "").toUpperCase();
      const dAsin = (details.asin || "").toUpperCase();
      if (dFsn && dFsn !== "N/A" && dFsn !== "—" && dFsn !== "-" && (dFsn === qN || (qN.length >= 6 && dFsn.includes(qN)))) return true;
      if (dAsin && dAsin !== "N/A" && dAsin !== "—" && dAsin !== "-" && (dAsin === qN || (qN.length >= 6 && dAsin.includes(qN)))) return true;
    }

    // 4. Order-level FSN/ASIN match
    const orderFsn = (order.fsn || "").trim().toUpperCase();
    if (orderFsn && orderFsn !== "—" && orderFsn !== "N/A" && orderFsn !== "-") {
      if (orderFsn === qN || (qN.length >= 6 && orderFsn.includes(qN))) return true;
    }
    const orderAsin = (order.asin || "").trim().toUpperCase();
    if (orderAsin && orderAsin !== "—" && orderAsin !== "N/A" && orderAsin !== "-") {
      if (orderAsin === qN || (qN.length >= 6 && orderAsin.includes(qN))) return true;
    }

    // 5. Line item level FSN/ASIN match
    if (order.items && order.items.length > 0) {
      for (const it of order.items) {
        const itFsn = (it.fsn || "").trim().toUpperCase();
        if (itFsn && itFsn !== "—" && itFsn !== "N/A" && itFsn !== "-") {
          if (itFsn === qN || (qN.length >= 6 && itFsn.includes(qN))) return true;
        }
        const itAsin = (it.asin || "").trim().toUpperCase();
        if (itAsin && itAsin !== "—" && itAsin !== "N/A" && itAsin !== "-") {
          if (itAsin === qN || (qN.length >= 6 && itAsin.includes(qN))) return true;
        }
        const itDetails = skuDetailsMap.get((it.sku || "").trim().toLowerCase());
        if (itDetails) {
          const dFsn = (itDetails.fsn || "").toUpperCase();
          const dAsin = (itDetails.asin || "").toUpperCase();
          if (dFsn && dFsn !== "N/A" && dFsn !== "—" && dFsn !== "-" && (dFsn === qN || (qN.length >= 6 && dFsn.includes(qN)))) return true;
          if (dAsin && dAsin !== "N/A" && dAsin !== "—" && dAsin !== "-" && (dAsin === qN || (qN.length >= 6 && dAsin.includes(qN)))) return true;
        }
      }
    }

    // SKU is strictly NOT matched
    return false;
  };

  // Helper to trigger automated continuous VMS recording
  const triggerVmsRecordingForOrder = useCallback(
    (order: FlipkartOrderItem) => {
      const stream = camera.streamRef.current;
      const trackingId = (order.awb || order.orderId || `ORDER_${order.index}`).trim();

      if (!stream) {
        console.warn("VMS Camera stream not ready");
        return;
      }

      if (recorder.isRecorderRunning()) {
        // Stop current recording (enqueues upload) and immediately queue new order
        recorder.queueNextRecording(stream, trackingId);
        recorder.stopRecording();
      } else {
        recorder.startRecording(stream, trackingId);
      }
    },
    [camera.streamRef, recorder]
  );

  // Mark order printed in local state & store
  const markOrderCompleted = useCallback(
    async (order: FlipkartOrderItem) => {
      printedOrdersRef.current.add(order.pageIndex);
      const nextSet = new Set(printedOrdersRef.current);
      setPrintedOrders(nextSet);

      await syncOrderPrinted(order, activeBatchKey);
    },
    [activeBatchKey]
  );

  // Bulk print selected rows from table
  const handlePrintSelectedFromTable = async () => {
    const printer = selectedPrinter || connectedPrinter || (await resolveVmsPrinter());
    if (!printer) {
      toast.error("Cannot print label: No thermal printer connected.");
      return;
    }

    const selectedOrders = filteredOrders.filter((o) => selectedRows.has(o.index));
    if (selectedOrders.length === 0) {
      toast.info("No orders selected to print.");
      return;
    }

    toast.loading(`Printing ${selectedOrders.length} selected shipping labels...`, { id: "bulk-table-print" });
    try {
      for (const order of selectedOrders) {
        await printSingleFlipkartOrder(order, files, activeBatchKey, printer);
        await markOrderCompleted(order);
        const trackVal = order.awb || order.orderId;
        if (trackVal) {
          void scanner.processScan(trackVal);
        }
      }
      toast.success(`Printed ${selectedOrders.length} shipping labels!`, { id: "bulk-table-print" });
      setSelectedRows(new Set());
      playSound("success");
    } catch (err: any) {
      console.error("Bulk print failed:", err);
      playSound("error");
      toast.error(`Bulk print failed: ${err.message || "Printer error"}`, { id: "bulk-table-print" });
    }
  };

  // Transition evaluator after order completion
  const evaluateStageTransition = useCallback(
    (completedStage: "single_quantity" | "multiple_sku" | "multiple_pieces") => {
      const nextRemainingSingle = stageStats.single.remaining - (completedStage === "single_quantity" ? 1 : 0);
      const nextRemainingMultiSku = stageStats.multiSku.remaining - (completedStage === "multiple_sku" ? 1 : 0);
      const nextRemainingMultiPiece = stageStats.multiPiece.remaining - (completedStage === "multiple_pieces" ? 1 : 0);

      if (completedStage === "single_quantity" && nextRemainingSingle <= 0) {
        // Stage 1 completed!
        if (nextRemainingMultiSku > 0 && nextRemainingMultiPiece > 0) {
          setTransitionModal({
            open: true,
            message: "All single quantity orders completed. Now starting multiple FSN / multiple piece orders.",
            stageName: "Single Quantity",
            nextStage: "multiple_sku",
          });
        } else if (nextRemainingMultiSku > 0) {
          setTransitionModal({
            open: true,
            message: "All single quantity orders completed. Now starting multiple FSN orders.",
            stageName: "Single Quantity",
            nextStage: "multiple_sku",
          });
        } else if (nextRemainingMultiPiece > 0) {
          setTransitionModal({
            open: true,
            message: "All single quantity orders completed. Now starting multiple piece orders.",
            stageName: "Single Quantity",
            nextStage: "multiple_pieces",
          });
        } else {
          toast.success("All single quantity orders completed! All orders in batch are done.", {
            duration: 6000,
          });
        }
      } else if (completedStage === "multiple_sku" && nextRemainingMultiSku <= 0) {
        // Stage 2 completed!
        if (nextRemainingMultiPiece > 0) {
          setTransitionModal({
            open: true,
            message: "All multiple FSN orders completed. Now starting multiple piece orders.",
            stageName: "Multiple FSN",
            nextStage: "multiple_pieces",
          });
        } else {
          toast.success("All multiple FSN orders completed! All orders in batch are done.", {
            duration: 6000,
          });
        }
      } else if (completedStage === "multiple_pieces" && nextRemainingMultiPiece <= 0) {
        toast.success("All multiple piece orders completed! Batch packing finished successfully.", {
          duration: 6000,
        });
      }
    },
    [stageStats]
  );

  // Main Barcode Processing logic
  const handleBarcodeScan = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || isProcessingPrint) return;

    if (isQrCode(code)) {
      playSound("warning");
      toast.error("Not valid QR code", {
        description: "QR codes are not supported. Please scan the linear Barcode / Tracking ID.",
        duration: 4000,
      });
      setBarcodeInput("");
      return;
    }

    setBarcodeInput("");
    setIsProcessingPrint(true);

    try {
      // If NOT from Order Process, handle as pure Tracking ID scan (matching other accounts)
      if (!showBackToOrderProcess) {
        try {
          const result = await scanner.processScan(code);
          if (!result?.success) {
            playSound("warning");
            toast.error(result?.message || "Invalid tracking ID");
            return;
          }

          setBarcodeInput(result.trackingId);

          const stream = camera.streamRef.current;
          if (stream) {
            if (recorder.isRecorderRunning()) {
              recorder.queueNextRecording(stream, result.trackingId);
              recorder.stopRecording();
            } else {
              recorder.startRecording(stream, result.trackingId);
            }
          }
          playSound("success");
        } finally {
          setIsProcessingPrint(false);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 50);
        }
        return;
      }

      const upperCode = code.toUpperCase();

      // 1. Block Flipkart Order ID scans
      const isOrderId = /^OD\d+/i.test(upperCode) || orders.some((o) => (o.orderId || "").toUpperCase() === upperCode);
      if (isOrderId) {
        playSound("warning");
        toast.error("Order ID scan is blocked", {
          description: "Only product FSN code and AWB Tracking ID scans are allowed for Flipkart.",
        });
        return;
      }

      // 2. Block Seller SKU scans
      const isSkuScan = orders.some((o) => {
        const isRootSku = (o.sku || "").toUpperCase() === upperCode;
        const isItemSku = o.items?.some((it) => (it.sku || "").toUpperCase() === upperCode);
        return isRootSku || isItemSku;
      });

      const isFsnOrAwb = orders.some((o) => {
        const isAwb = (o.awb || "").toUpperCase() === upperCode;
        const isFsn = (o.fsn || "").toUpperCase() === upperCode;
        const isItemFsn = o.items?.some((it) => (it.fsn || "").toUpperCase() === upperCode);
        const isDetailsFsn = skuDetailsMap.get(code.toLowerCase())?.fsn?.toUpperCase() === upperCode;
        return isAwb || isFsn || isItemFsn || isDetailsFsn;
      });

      if (isSkuScan && !isFsnOrAwb) {
        playSound("warning");
        toast.error("SKU scan is blocked", {
          description: "Only product FSN code and AWB Tracking ID scans are allowed for Flipkart.",
        });
        return;
      }

      // 3. Find all matching orders in the entire batch by FSN or AWB
      const matchingOrders = orders.filter((o) => doesOrderMatchQuery(o, code));

      if (matchingOrders.length === 0) {
        playSound("error");
        toast.error(`No Flipkart order found matching barcode "${code}"`);
        return;
      }

      // 2. Check if scanned item belongs to the CURRENT active stage
      const stageMatches = matchingOrders.filter((o) => getOrderTypeForItem(o) === activeStage);

      if (stageMatches.length === 0) {
        playSound("warning");
        const foundTypes = Array.from(new Set(matchingOrders.map(getOrderTypeForItem))).map(getOrderTypeLabel);
        toast.warning(
          `Please complete ${getOrderTypeLabel(activeStage)} orders first! This item belongs to a ${foundTypes.join(" / ")} order.`,
          { duration: 6000 }
        );
        return;
      }

      // 3. Filter to unprinted orders in this stage
      const unprinted = stageMatches.filter((o) => !printedOrdersRef.current.has(o.pageIndex));
      if (unprinted.length === 0) {
        playSound("warning");
        toast.info(`Order for "${code}" has already been printed and completed!`);
        return;
      }

      // Sort FIFO by index
      unprinted.sort((a, b) => a.index - b.index);
      const targetOrder = unprinted[0];
      const trackingId = (targetOrder.awb || targetOrder.orderId || code).trim();
      setBarcodeInput(trackingId);

      // =========================================================================
      // STAGE 1: SINGLE QUANTITY ORDERS
      // =========================================================================
      if (activeStage === "single_quantity") {
        const printer = selectedPrinter || connectedPrinter || (await resolveVmsPrinter());
        if (!printer) {
          toast.error("Cannot print label: No thermal printer connected.");
          return;
        }

        toast.loading(`Printing shipping label for ${targetOrder.orderId}...`, { id: "vms-print" });

        try {
          await printSingleFlipkartOrder(targetOrder, files, activeBatchKey, printer);
          toast.success(`Printed label for ${targetOrder.orderId} (4" x 6")!`, { id: "vms-print" });

          // Start automated continuous VMS recording
          triggerVmsRecordingForOrder(targetOrder);

          // Mark completed
          await markOrderCompleted(targetOrder);
          const trackVal = targetOrder.awb || targetOrder.orderId;
          if (trackVal) {
            void scanner.processScan(trackVal);
          }
          playSound("success");

          // Evaluate stage transition
          evaluateStageTransition("single_quantity");
        } catch (err: any) {
          console.error("Print failed:", err);
          playSound("error");
          toast.error(`Print failed: ${err.message || "Printer error"}`, { id: "vms-print" });
        }
        return;
      }

      // =========================================================================
      // STAGE 2 / 3: MULTIPLE FSN & MULTIPLE PIECES
      // =========================================================================
      let reqs = multiScanProgressRef.current.get(targetOrder.pageIndex);
      if (!reqs) {
        reqs = buildOrderRequirements(targetOrder);
        multiScanProgressRef.current.set(targetOrder.pageIndex, reqs);
      }

      // If user scanned order-level identifier (Order ID / AWB):
      if (isOrderLevelMatch(targetOrder, code)) {
        const allScanned = reqs.every((r) => r.scannedQty >= r.requiredQty);
        if (allScanned) {
          const printer = connectedPrinter || (await resolveVmsPrinter());
          if (!printer) {
            toast.error("Cannot print label: No thermal printer connected.");
            return;
          }

          toast.loading(`Printing shipping label for ${targetOrder.orderId}...`, { id: "vms-print" });
          await printSingleFlipkartOrder(targetOrder, files, activeBatchKey, printer);
          toast.success(`Printed label for ${targetOrder.orderId}!`, { id: "vms-print" });

          triggerVmsRecordingForOrder(targetOrder);
          await markOrderCompleted(targetOrder);
          multiScanProgressRef.current.delete(targetOrder.pageIndex);
          playSound("success");

          evaluateStageTransition(activeStage);
        } else {
          playSound("warning");
          const remainingReqs = reqs.filter((r) => r.scannedQty < r.requiredQty);
          const remainingSkus = Array.from(new Set(remainingReqs.map((r) => r.sku || r.fsn || "SKU")));
          toast.warning(`Cannot print Order ${targetOrder.orderId}: Remaining SKU: ${remainingSkus.join(", ")}`);
        }
        return;
      }

      // User scanned an item SKU / FSN / Barcode
      let matchingReq = reqs.find((r) => r.scannedQty < r.requiredQty && isReqMatch(r, code));
      if (!matchingReq) {
        matchingReq = reqs.find((r) => isReqMatch(r, code));
      }

      if (!matchingReq) {
        playSound("error");
        toast.error(`Scanned item "${code}" does not belong to Order ${targetOrder.orderId}`);
        return;
      }

      if (matchingReq.scannedQty >= matchingReq.requiredQty) {
        playSound("warning");
        toast.info(`Item ${matchingReq.sku} is already fully scanned for this order.`);
        return;
      }

      // Start recording on first item scan if not already running for this order
      triggerVmsRecordingForOrder(targetOrder);

      // Increment count
      matchingReq.scannedQty++;
      const totalReq = reqs.reduce((sum, r) => sum + r.requiredQty, 0);
      const totalScan = reqs.reduce((sum, r) => sum + r.scannedQty, 0);

      const hasRemaining = reqs.some((r) => r.scannedQty < r.requiredQty);
      if (hasRemaining) {
        playSound("success");
        toast.info(`Scanned ${matchingReq.sku} (${totalScan}/${totalReq} items for Order ${targetOrder.orderId})`);
        return;
      }

      // ALL ITEMS SCANNED FOR THIS ORDER!
      const printer = selectedPrinter || connectedPrinter || (await resolveVmsPrinter());
      if (!printer) {
        toast.error("All items scanned! Please connect thermal printer to print.");
        return;
      }

      toast.loading(`All items scanned (${totalScan}/${totalReq})! Printing label for ${targetOrder.orderId}...`, {
        id: "vms-print",
      });

      try {
        await printSingleFlipkartOrder(targetOrder, files, activeBatchKey, printer);
        toast.success(`Printed label for ${targetOrder.orderId}!`, { id: "vms-print" });

        await markOrderCompleted(targetOrder);
        const trackVal = targetOrder.awb || targetOrder.orderId;
        if (trackVal) {
          void scanner.processScan(trackVal);
        }
        multiScanProgressRef.current.delete(targetOrder.pageIndex);
        playSound("success");

        evaluateStageTransition(activeStage);
      } catch (err: any) {
        console.error("Print error:", err);
        playSound("error");
        toast.error(`Print failed: ${err.message || "Printer error"}`, { id: "vms-print" });
      }
    } finally {
      setIsProcessingPrint(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleManualTypingBlocked = useCallback(() => {
    toast.warning("Manual keyboard typing is disabled. Please use barcode scanner.", {
      id: "scanner-only-hint",
      duration: 2500,
    });
  }, []);

  const clearInput = useCallback(() => {
    setBarcodeInput("");
    inputRef.current?.focus();
  }, []);

  // Handle final stop recording (e.g. on Enter key when recording is active)
  const handleStopCurrentRecording = useCallback(() => {
    if (recorder.isRecorderRunning()) {
      recorder.clearNextRecording();
      recorder.stopRecording();
      setBarcodeInput("");
      toast.success("Stopped VMS recording. Video saved to upload queue.");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [recorder]);

  // Keyboard capture for hardware barcode scanner and Enter key to end VMS
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (transitionModal.open) return;

      // Ignore if user is typing inside another input (e.g. table search filter or modal)
      const isOtherInput =
        document.activeElement &&
        document.activeElement !== inputRef.current &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA" ||
          (document.activeElement as HTMLElement).isContentEditable);
      if (isOtherInput) return;

      if (document.activeElement === inputRef.current) {
        event.preventDefault();
      }

      const isScannerScan = scanner.processKeyboardInput(
        event.key,
        async (barcode) => {
          setBarcodeInput(barcode);
          await handleBarcodeScan(barcode);
        },
        handleManualTypingBlocked
      );

      // Enter key functionality: end VMS recording if active, or submit pending barcode
      if (event.key === "Enter" && !isScannerScan) {
        event.preventDefault();
        if (recorder.isRecorderRunning()) {
          handleStopCurrentRecording();
        } else {
          const raw = barcodeInput.trim();
          if (raw) {
            void handleBarcodeScan(raw);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    scanner.processKeyboardInput,
    transitionModal.open,
    handleManualTypingBlocked,
    handleBarcodeScan,
    recorder,
    handleStopCurrentRecording,
    barcodeInput,
  ]);

  const [isReturning, setIsReturning] = useState(false);

  const handleReturnToFlipkartResult = async () => {
    if (isReturning) return;
    setIsReturning(true);

    try {
      if (recorder.isRecorderRunning()) {
        recorder.clearNextRecording();
        recorder.stopRecording();
      }
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("vms_from_order_process");
        sessionStorage.removeItem("vms_source");
        localStorage.removeItem("vms_source");
      }
      await onLogout();
    } catch (e) {
      console.error("Logout error on returning to order process:", e);
    } finally {
      router.push("/dashboard/order-process/flipkart/order-process/result");
    }
  };

  return (
    <>
      {/* ===================================================== */}
      {/* TOP BAR: SCANNER & CONTROLS (UNIFORM HEIGHT & COMPACT)*/}
      {/* ===================================================== */}
      <div className="mb-6 flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center">
        {/* Scanner on the left */}
        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <Input
                  ref={inputRef}
                  type="text"
                  readOnly={true}
                  value={barcodeInput}
                  rightIcon={
                    barcodeInput ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearInput();
                        }}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                        title="Clear Barcode"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : undefined
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      return;
                    }
                    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    handleManualTypingBlocked();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                  }}
                  disabled={isProcessingPrint}
                  autoComplete="off"
                  spellCheck={false}
                  floatingLabel={false}
                  placeholder={
                    showBackToOrderProcess
                      ? "Scan FSN or AWB Tracking ID (SKU & Order ID blocked)..."
                      : "Scan tracking ID with scanner (Manual typing disabled)..."
                  }
                  containerClassName="space-y-0"
                  className="!h-11 sm:!h-12 w-full px-3.5 sm:px-4 bg-white dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white font-mono font-bold text-xs sm:text-sm border-2 border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D] outline-none shadow-xs rounded-xl sm:rounded-2xl placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 cursor-default"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (recorder.isRecorderRunning()) {
                    handleStopCurrentRecording();
                    return;
                  }
                  const raw = barcodeInput.trim();
                  if (raw) handleBarcodeScan(raw);
                }}
                disabled={isProcessingPrint || (!barcodeInput.trim() && !recorder.isRecorderRunning())}
                className="h-11 sm:h-12 shrink-0 flex items-center justify-center gap-2 bg-[#0A0E1A] dark:bg-[#080B11] hover:bg-[#161D2E] dark:hover:bg-[#131926] border border-[#0A0E1A] dark:border-white/[0.08] px-4 sm:px-5 font-semibold text-xs sm:text-sm text-white dark:text-[#E8C16D] transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs rounded-xl sm:rounded-2xl"
              >
                <span>Submit</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            {isProcessingPrint && (
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
                Processing barcode & printing...
              </p>
            )}
          </div>
        </div>

        {/* Right Info Cards & Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          {/* Back to Order Process (only visible if navigating from order process) */}
          {showBackToOrderProcess && (
            <button
              type="button"
              onClick={handleReturnToFlipkartResult}
              disabled={isReturning}
              className="h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] hover:bg-slate-50 dark:hover:bg-white/[0.04] px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white shadow-xs transition-colors cursor-pointer disabled:opacity-60 shrink-0"
              title="Back to Order Process"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span className="whitespace-nowrap">
                {isReturning ? "Returning..." : "Back to Order Process"}
              </span>
            </button>
          )}

          {/* Operator Card */}
          <div className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-4 min-w-[120px] shadow-xs flex flex-col justify-center shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
              Operator
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white truncate leading-tight mt-0.5">
              {operator?.operatorName ?? "-"}
            </p>
          </div>

          {/* Account Card */}
          <div className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-4 min-w-[120px] shadow-xs flex flex-col justify-center shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
              Account
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white truncate leading-tight mt-0.5">
              {selectedAccount?.accountName ?? "Flipkart"}
            </p>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={async () => {
              if (recorder?.isRecording) {
                recorder.stopRecording();
              }
              if (typeof window !== "undefined") {
                localStorage.removeItem("vms_source");
                localStorage.removeItem("vms_from_order_process");
                sessionStorage.removeItem("vms_source");
                sessionStorage.removeItem("vms_from_order_process");
                window.history.replaceState(null, "", window.location.pathname);
              }
              await onLogout();
            }}
            className="h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 shadow-xs transition-colors cursor-pointer shrink-0"
            title="Logout Operator"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* TOOLBAR CONTROLS: PRINTER + STAGE DROPDOWN + SHOW TABLE */}
      {/* ===================================================== */}
      {showBackToOrderProcess && (
        <div className="mb-6 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Dropdowns (Printer + Single Quantity/Order Type) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* 1. Printer Dropdown */}
            <div className="w-full sm:w-60 md:w-64 shrink-0">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 block">
                Thermal Printer
              </label>
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
                    setConnectedPrinter(opt.value);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("flipkart_selected_printer", opt.value);
                      localStorage.setItem("lastUsedPrinter", opt.value);
                    }
                  }
                }}
                placeholder={availablePrinters.length === 0 ? "No Printers Found" : "Select Printer"}
                height={48}
                {...selectThemeStyles}
              />
            </div>

            {/* 2. Order Type / Single Quantity Dropdown */}
            <div className="w-full sm:w-64 md:w-72 shrink-0">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 block">
                Order Composition
              </label>
              <ReactSelect
                borderRadius={16}
                options={orderTypeOptions}
                value={
                  orderTypeOptions.find((opt) => opt.value === activeStage) ??
                  orderTypeOptions[0]
                }
                onChange={(opt) => {
                  if (opt?.value) {
                    setActiveStage(opt.value as any);
                    setTablePage(1);
                    setSelectedRows(new Set());
                  }
                }}
                height={48}
                {...selectThemeStyles}
              />
            </div>
          </div>

          {/* Right: Toggle Table Button */}
          <div className="flex items-center gap-2 self-start lg:self-end">
            <button
              type="button"
              onClick={() => setShowTable((prev) => !prev)}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                showTable
                  ? "border-transparent bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#d4af5a]"
                  : "border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A]"
              }`}
            >
              {isMappingsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#6A4D1D] dark:text-[#E8C16D]" />
              ) : (
                <Table className="h-4 w-4" />
              )}
              <span>{showTable ? "Hide Table" : `Show Table (${filteredOrders.length})`}</span>
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* COLLAPSIBLE ORDER TABLE (SAME AS FLIPKART RESULT PAGE) */}
        {/* ===================================================== */}
        {showTable && (
          <div className="pt-3 border-t border-[#E7E0D2] dark:border-white/[0.08] space-y-3">
            {/* Table Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Search Box */}
              <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 flex-1 max-w-md">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Search Order ID, Invoice #, FSN, AWB, Customer..."
                  value={tableSearchQuery}
                  onChange={(e) => {
                    setTableSearchQuery(e.target.value);
                    setTablePage(1);
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                />
                {tableSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setTableSearchQuery("");
                      setTablePage(1);
                    }}
                    className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer shrink-0"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Show Printed / Back to Unprinted & Print Selected */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintedTable((prev) => !prev);
                    setTablePage(1);
                    setSelectedRows(new Set());
                  }}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] px-4 text-xs font-bold text-[#6A4D1D] dark:text-[#E8C16D] hover:bg-[#FDF2D1] dark:hover:bg-white/[0.06] transition shadow-xs cursor-pointer"
                >
                  {showPrintedTable ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>Back to Unprinted ({stageStats[activeStage === "single_quantity" ? "single" : activeStage === "multiple_sku" ? "multiSku" : "multiPiece"].remaining})</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Show Printed ({stageStats[activeStage === "single_quantity" ? "single" : activeStage === "multiple_sku" ? "multiSku" : "multiPiece"].completed})</span>
                    </>
                  )}
                </button>

                {selectedRows.size > 0 && (
                  <button
                    type="button"
                    onClick={handlePrintSelectedFromTable}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-transparent bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] px-4 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print ({selectedRows.size})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active "Show Printed Only" Banner Indicator */}
            {showPrintedTable && (
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
                    setShowPrintedTable(false);
                    setTablePage(1);
                    setSelectedRows(new Set());
                  }}
                  className="font-bold underline underline-offset-4 hover:opacity-80 cursor-pointer text-xs ml-2 shrink-0 text-emerald-700 dark:text-emerald-400"
                >
                  Back to Unprinted ({stageStats[activeStage === "single_quantity" ? "single" : activeStage === "multiple_sku" ? "multiSku" : "multiPiece"].remaining})
                </button>
              </div>
            )}

            {/* Desktop Table View */}
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
              <div className="w-full overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
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
                      <th className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">Flipkart Order ID</th>
                      <th className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">AWB Tracking</th>
                      <th className="w-36 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">FSN Code</th>
                      <th className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">SKU</th>
                      <th className="w-40 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">Customer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-sans">
                    {paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            <p className="font-bold text-[#0A0E1A] dark:text-white">
                              {showPrintedTable
                                ? "No printed orders match your filter."
                                : `All orders in this view have been printed! (${stageStats[activeStage === "single_quantity" ? "single" : activeStage === "multiple_sku" ? "multiSku" : "multiPiece"].completed} printed)`}
                            </p>
                            {showPrintedTable ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPrintedTable(false);
                                  setTablePage(1);
                                  setSelectedRows(new Set());
                                }}
                                className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                              >
                                Click here to return to unprinted orders ({stageStats[activeStage === "single_quantity" ? "single" : activeStage === "multiple_sku" ? "multiSku" : "multiPiece"].remaining})
                              </button>
                            ) : stageStats[activeStage === "single_quantity" ? "single" : activeStage === "multiple_sku" ? "multiSku" : "multiPiece"].completed > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPrintedTable(true);
                                  setTablePage(1);
                                  setSelectedRows(new Set());
                                }}
                                className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] underline underline-offset-4 hover:opacity-80 cursor-pointer"
                              >
                                Click here to view printed orders ({stageStats[activeStage === "single_quantity" ? "single" : activeStage === "multiple_sku" ? "multiSku" : "multiPiece"].completed})
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((item) => (
                        <tr
                          key={item.index}
                          className={`transition hover:bg-[#FAF8F5] dark:hover:bg-white/[0.06] ${
                            selectedRows.has(item.index)
                              ? "bg-[#FFF9EC]/40 dark:bg-[#1A160E]/50 ring-1 ring-[#E8C16D]"
                              : ""
                          }`}
                        >
                          <td className="w-12 min-w-[44px] px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={selectedRows.has(item.index)}
                                onCheckedChange={(checked: boolean | "indeterminate") => handleSelectRow(item.index, Boolean(checked))}
                              />
                            </div>
                          </td>
                          <td className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {item.orderId}
                          </td>
                          <td className="w-44 min-w-[150px] px-3 sm:px-4 py-3.5 text-center font-medium whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-white">{item.awb || "—"}</span>
                              {printedOrders.has(item.pageIndex) && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                                  <CheckCircle2 className="h-3 w-3" /> Printed
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="w-36 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-medium text-slate-900 dark:text-white font-mono">
                            {item.items && item.items.length > 0 ? (
                              <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                                {item.items.map((i, idx) => {
                                  const isNotLast = idx < (item.items?.length || 1) - 1;
                                  const displayFsn =
                                    i.fsn ||
                                    skuDetailsMap.get((i.sku || "").trim().toLowerCase())?.fsn ||
                                    skuDetailsMap.get((i.sku || "").trim().toLowerCase())?.asin ||
                                    item.fsn ||
                                    "—";
                                  return (
                                    <div
                                      key={idx}
                                      className="break-all sm:break-normal sm:whitespace-nowrap flex flex-wrap sm:flex-nowrap items-center justify-center gap-1 font-mono"
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
                              <span className="font-mono">
                                {item.fsn ||
                                  skuDetailsMap.get((item.sku || "").trim().toLowerCase())?.fsn ||
                                  skuDetailsMap.get((item.sku || "").trim().toLowerCase())?.asin ||
                                  "—"}
                              </span>
                            )}
                          </td>
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
                          <td className="w-40 min-w-[130px] px-3 sm:px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {item.customerName || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              {totalTableRecords > 0 && (
                <div className="p-3 border-t border-[#E7E0D2] dark:border-white/[0.08]">
                  <Pagination
                    page={currentTablePage}
                    totalPages={totalTablePages}
                    total={totalTableRecords}
                    limit={tableLimit}
                    itemName="orders"
                    variant="dark"
                    className="border border-[#E7E0D2] dark:border-white/[0.08] rounded-2xl bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 py-3"
                    onPageChange={setTablePage}
                    onLimitChange={(newLimit) => {
                      setTableLimit(newLimit);
                      setTablePage(1);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* ===================================================== */}
      {/* VMS CAMERA PREVIEW                                    */}
      {/* ===================================================== */}
      <CameraPreview camera={camera} />

      {/* ===================================================== */}
      {/* VMS UPLOAD QUEUE & RECENT SCANS                       */}
      {/* ===================================================== */}
      <UploadQueue />
      <RecentScans scanner={scanner} />

      {/* ===================================================== */}
      {/* 1-SECOND STAGE TRANSITION MODAL                       */}
      {/* ===================================================== */}
      {showBackToOrderProcess && (
        <FlipkartStageTransitionModal
          open={transitionModal.open}
          message={transitionModal.message}
          stageName={transitionModal.stageName}
          onClose={() => {
            const next = transitionModal.nextStage;
            setTransitionModal((prev) => ({ ...prev, open: false }));
            setActiveStage(next);
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          }}
        />
      )}
    </>
  );
};

export default FlipkartVMSOperator;
