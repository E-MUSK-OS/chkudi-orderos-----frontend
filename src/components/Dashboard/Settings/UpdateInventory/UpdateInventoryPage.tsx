"use client";

import React, { Fragment, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Barcode,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Copy,
  Palette,
  Ruler,
  Search,
  Trash2,
  Warehouse,
  X,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import Pagination from "@/components/ui/Pagination";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import MobileCameraScanner from "@/components/Dashboard/vms/Scans/TrackingIdScan/components/MobileCameraScanner";
import { useWarehouses } from "@/components/Dashboard/Warehouse/hooks/useWarehouse";
import { useAllProductVariants } from "@/components/Dashboard/Products/ManageProducts/hooks/useProductVariants";
import {
  useInventories,
  useAdjustInventory,
} from "@/components/Dashboard/Products/Inventory/hooks/useInventories";
import type { Inventory } from "@/components/Dashboard/Products/Inventory/types/inventory.types";
import type { Product } from "@/components/Dashboard/Products/ManageProducts/types/product.types";
import type { ProductVariant } from "@/components/Dashboard/Products/ManageProducts/types/productVariant.types";
import {
  getColorHex,
  getColorValue,
  getSizeValue,
} from "@/components/Dashboard/Products/ManageProducts/utils/productVariant.utils";

type VariantWithProduct = ProductVariant & { product?: Product };

interface InventoryRow {
  variantId: string;
  productId: string;
  inventoryId: string | null;
  warehouseName: string;
  asin: string;
  sku: string;
  masterSku: string;
  productName: string;
  color: string;
  size: string;
  currentStock: number;
}

interface ScanFeedback {
  type: "success" | "warning" | "error";
  text: string;
}

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  const isTouch = "maxTouchPoints" in navigator && navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  return (isTouch && isSmallScreen) || isMobileUA || isSmallScreen;
};

export default function UpdateInventoryPage() {
  const router = useRouter();

  const { data: warehouseRes } = useWarehouses();

  const warehouses = useMemo(() => {
    const list = Array.isArray(warehouseRes?.data) ? warehouseRes.data : [];
    const active = list.filter((w) => w.isActive !== false);
    return active.length > 0 ? active : list;
  }, [warehouseRes]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");

  const effectiveWarehouseId = useMemo(() => {
    if (selectedWarehouseId && warehouses.some((w) => w.id === selectedWarehouseId)) {
      return selectedWarehouseId;
    }
    return warehouses.find((w) => w.isDefault)?.id || warehouses[0]?.id || "";
  }, [selectedWarehouseId, warehouses]);

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({
        label: w.warehouseName,
        value: w.id,
      })),
    [warehouses]
  );

  const {
    data: variantsRes,
    isLoading: isLoadingVariants,
    isError: isVariantsError,
  } = useAllProductVariants();

  const {
    data: inventoriesRes,
    isLoading: isLoadingInventories,
  } = useInventories({
    page: 1,
    limit: 1000,
    warehouseId: effectiveWarehouseId || undefined,
  });

  const adjustInventoryMutation = useAdjustInventory();

  const variants: VariantWithProduct[] = useMemo(
    () =>
      Array.isArray(variantsRes?.data)
        ? (variantsRes.data as VariantWithProduct[])
        : [],
    [variantsRes]
  );

  const inventories: Inventory[] = useMemo(
    () =>
      Array.isArray(inventoriesRes?.data)
        ? (inventoriesRes.data as Inventory[])
        : [],
    [inventoriesRes]
  );

  // Map productVariantId -> inventory record for the active/selected warehouse
  const inventoryByVariantId = useMemo(() => {
    const map = new Map<string, Inventory>();
    for (const inv of inventories) {
      const vid = inv.productVariant?.id;
      if (!vid) continue;
      if (effectiveWarehouseId && inv.warehouse?.id && inv.warehouse.id !== effectiveWarehouseId) {
        continue;
      }
      if (!map.has(vid)) {
        map.set(vid, inv);
      }
    }
    return map;
  }, [inventories, effectiveWarehouseId]);

  // Build lookup map of product variants with live stock
  const rowByVariantId = useMemo(() => {
    const map = new Map<string, InventoryRow>();
    for (const variant of variants) {
      const inv = inventoryByVariantId.get(variant.id);
      const colorVal = getColorValue(variant, variant.product) || "--";
      const sizeVal = getSizeValue(variant, variant.product) || "--";
      map.set(variant.id, {
        variantId: variant.id,
        productId: variant.productId || variant.product?.id || "",
        inventoryId: inv?.id ?? null,
        warehouseName: inv?.warehouse?.warehouseName || "Default",
        asin: (variant.asin || variant.product?.asin || "--").trim() || "--",
        sku: variant.variantSku || "--",
        masterSku: variant.product?.masterSku || "--",
        productName: variant.product?.productName || variant.product?.masterSku || "--",
        color: colorVal,
        size: sizeVal,
        currentStock: typeof inv?.availableStock === "number" ? inv.availableStock : 0,
      });
    }
    return map;
  }, [variants, inventoryByVariantId]);

  // Group all variants by Master SKU / productId
  const variantsByMasterKey = useMemo(() => {
    const map = new Map<string, InventoryRow[]>();
    for (const row of rowByVariantId.values()) {
      const key = (row.productId || row.masterSku || "").trim();
      if (!key || key === "--") continue;
      const existing = map.get(key);
      if (existing) existing.push(row);
      else map.set(key, [row]);
    }
    return map;
  }, [rowByVariantId]);

  // Fast ASIN lookup
  const asinMap = useMemo(() => {
    const map = new Map<string, InventoryRow[]>();
    for (const row of rowByVariantId.values()) {
      if (!row.asin || row.asin === "--") continue;
      const key = row.asin.toUpperCase();
      const existing = map.get(key);
      if (existing) existing.push(row);
      else map.set(key, [row]);
    }
    return map;
  }, [rowByVariantId]);

  const [scanInput, setScanInput] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  // Ordered list of scanned variant IDs (most recently scanned Master SKU group first)
  const [scannedVariantIds, setScannedVariantIds] = useState<string[]>([]);
  const [highlightedVariantIds, setHighlightedVariantIds] = useState<string[]>([]);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [updatingVariantId, setUpdatingVariantId] = useState<string | null>(null);
  const [doneVariantIds, setDoneVariantIds] = useState<Record<string, boolean>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const lastAutoMatchedRef = useRef<string>("");
  const successSound = useRef<HTMLAudioElement | null>(null);
  const warningSound = useRef<HTMLAudioElement | null>(null);
  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
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
  }, [calculateHeight]);

  // Lock desktop page height to viewport so only the table scrolls internally (no outer page scroll)
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      const tableEl = tableContainerRef.current;
      if (!tableEl) return;
      if (tableEl.contains(e.target as Node)) return;
      if (tableEl.scrollHeight > tableEl.clientHeight) {
        if (e.cancelable) e.preventDefault();
        tableEl.scrollTop += e.deltaY;
      }
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    successSound.current = new Audio("/sounds/success.wav");
    warningSound.current = new Audio("/sounds/warning.wav");
    return () => {
      successSound.current = null;
      warningSound.current = null;
    };
  }, []);

  const playSound = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } catch {
      // ignore autoplay restrictions
    }
  };

  const focusAndSelectInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    if (isMobileDevice() || isCameraOpen) {
      if (document.activeElement === input) input.blur();
      return;
    }
    input.focus();
    input.setSelectionRange(0, input.value.length);
  }, [isCameraOpen]);

  useEffect(() => {
    if (!isMobileDevice()) {
      focusAndSelectInput();
    }
  }, [focusAndSelectInput]);

  const processAsinScan = useCallback(
    (rawCode: string) => {
      const trimmed = rawCode.trim();
      const cleanUpper = trimmed.toUpperCase();
      if (!cleanUpper) return;

      setScanInput(trimmed);
      lastAutoMatchedRef.current = cleanUpper;

      const matches = asinMap.get(cleanUpper);

      if (!matches || matches.length === 0) {
        playSound(warningSound);
        setHighlightedVariantIds([]);
        setFeedback({
          type: "warning",
          text: `No product found in Product table for ASIN "${cleanUpper}".`,
        });
        toast.warning(`ASIN "${cleanUpper}" not found`);
      } else {
        playSound(successSound);

        const directIds = matches.map((m) => m.variantId);
        setHighlightedVariantIds(directIds);

        // Expand to all variant SKUs under the matched Master SKU(s)
        const groupIds: string[] = [...directIds];
        const seen = new Set<string>(directIds);

        for (const m of matches) {
          const masterKey = (m.productId || m.masterSku || "").trim();
          const siblings = masterKey ? variantsByMasterKey.get(masterKey) : undefined;
          if (siblings) {
            for (const sib of siblings) {
              if (!seen.has(sib.variantId)) {
                seen.add(sib.variantId);
                groupIds.push(sib.variantId);
              }
            }
          }
        }

        setScannedVariantIds(groupIds);

        const first = matches[0];
        const firstGroupKey = `${(first.productId || first.masterSku || "").trim()}::${(first.color || "--").trim().toLowerCase()}`;
        setSelectedColorKey(firstGroupKey);

        setFeedback({
          type: "success",
          text: `Master SKU: ${first.masterSku} • Loaded ${groupIds.length} variant${
            groupIds.length === 1 ? "" : "s"
          } (Scanned ASIN: ${cleanUpper})`,
        });
      }

      if (!isMobileDevice() && !isCameraOpen) {
        requestAnimationFrame(() => {
          focusAndSelectInput();
        });
        setTimeout(() => {
          focusAndSelectInput();
        }, 30);
      }
    },
    [asinMap, variantsByMasterKey, focusAndSelectInput, isCameraOpen]
  );

  const handleSubmitScan = () => {
    if (!scanInput.trim()) return;
    processAsinScan(scanInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cleanUpper = scanInput.trim().toUpperCase();
      if (!cleanUpper) return;
      // If onChange already auto-matched this exact ASIN, just ensure text stays selected
      if (lastAutoMatchedRef.current === cleanUpper && asinMap.has(cleanUpper)) {
        if (!isMobileDevice() && !isCameraOpen) {
          requestAnimationFrame(focusAndSelectInput);
        }
        return;
      }
      handleSubmitScan();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setScanInput(nextVal);
    const cleanUpper = nextVal.trim().toUpperCase();
    if (!cleanUpper) {
      lastAutoMatchedRef.current = "";
      return;
    }
    if (asinMap.has(cleanUpper) && lastAutoMatchedRef.current !== cleanUpper) {
      processAsinScan(nextVal);
    }
  };

  const handleCameraScan = useCallback(
    (code: string) => {
      processAsinScan(code);
    },
    [processAsinScan]
  );

  const handleCameraClose = useCallback(() => {
    setIsCameraOpen(false);
    if (!isMobileDevice()) {
      setTimeout(() => focusAndSelectInput(), 50);
    }
  }, [focusAndSelectInput]);

  const handleCopy = (text: string, label: string) => {
    if (!text || text === "--") return;
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied: ${text}`);
  };

  const getDraftValue = (row: InventoryRow): string => {
    if (stockDrafts[row.variantId] !== undefined) {
      return stockDrafts[row.variantId];
    }
    return String(row.currentStock);
  };

  const setDraftNumber = (row: InventoryRow, nextVal: number) => {
    const clamped = Math.max(0, Math.floor(nextVal));
    setStockDrafts((prev) => ({
      ...prev,
      [row.variantId]: String(clamped),
    }));
    setDoneVariantIds((prev) => {
      if (!prev[row.variantId]) return prev;
      const copy = { ...prev };
      delete copy[row.variantId];
      return copy;
    });
  };

  const handleDoneRow = async (row: InventoryRow) => {
    const rawDraft = getDraftValue(row).trim();
    const targetStock = Number(rawDraft);

    if (!Number.isFinite(targetStock) || targetStock < 0 || !Number.isInteger(targetStock)) {
      toast.error("Please enter a valid whole number for stock.");
      return;
    }

    const delta = targetStock - row.currentStock;

    if (delta === 0) {
      setDoneVariantIds((prev) => ({ ...prev, [row.variantId]: true }));
      toast.success(`Verified ${row.sku} (Stock: ${row.currentStock})`);
      return;
    }

    if (!row.inventoryId) {
      toast.error(
        `No inventory record exists yet for ${row.sku}. Open Edit or Inventory page to initialize it.`
      );
      return;
    }

    setUpdatingVariantId(row.variantId);
    try {
      await adjustInventoryMutation.mutateAsync({
        id: row.inventoryId,
        payload: {
          quantity: Math.abs(delta),
          adjustmentType: delta > 0 ? "IN" : "OUT",
          reason: "Updated from Update Inventory page",
        },
      });
      setDoneVariantIds((prev) => ({ ...prev, [row.variantId]: true }));
      setStockDrafts((prev) => {
        const copy = { ...prev };
        delete copy[row.variantId];
        return copy;
      });
    } finally {
      setUpdatingVariantId(null);
    }
  };

  // Only show scanned rows in the table, always hydrated with latest stock
  const scannedRows: InventoryRow[] = useMemo(() => {
    return scannedVariantIds
      .map((id) => rowByVariantId.get(id))
      .filter((row): row is InventoryRow => !!row);
  }, [scannedVariantIds, rowByVariantId]);

  // Group scanned rows by Master SKU + Color so table shows one row per color
  const colorGroups = useMemo(() => {
    const groups: {
      groupKey: string;
      masterSku: string;
      color: string;
      items: InventoryRow[];
      totalCurrentStock: number;
      hasScannedMatch: boolean;
    }[] = [];
    const indexByKey = new Map<string, number>();

    for (const row of scannedRows) {
      const masterPart = (row.productId || row.masterSku || "").trim();
      const colorPart = (row.color || "--").trim().toLowerCase();
      const groupKey = `${masterPart}::${colorPart}`;
      const isDirectMatch = highlightedVariantIds.includes(row.variantId);

      const existingIdx = indexByKey.get(groupKey);
      if (existingIdx !== undefined) {
        groups[existingIdx].items.push(row);
        groups[existingIdx].totalCurrentStock += row.currentStock;
        if (isDirectMatch) groups[existingIdx].hasScannedMatch = true;
      } else {
        indexByKey.set(groupKey, groups.length);
        groups.push({
          groupKey,
          masterSku: row.masterSku,
          color: row.color,
          items: [row],
          totalCurrentStock: row.currentStock,
          hasScannedMatch: isDirectMatch,
        });
      }
    }
    return groups;
  }, [scannedRows, highlightedVariantIds]);

  const [selectedColorKey, setSelectedColorKey] = useState<string>("");
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(10);

  const allCatalogRows: InventoryRow[] = useMemo(() => {
    const list = Array.from(rowByVariantId.values()).sort((a, b) =>
      a.masterSku.localeCompare(b.masterSku, undefined, { sensitivity: "base" })
    );
    const q = scanInput.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.masterSku.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.asin.toLowerCase().includes(q) ||
        r.color.toLowerCase().includes(q) ||
        r.size.toLowerCase().includes(q)
    );
  }, [rowByVariantId, scanInput]);

  const totalCatalogPages = Math.max(1, Math.ceil(allCatalogRows.length / catalogPageSize));
  const safeCatalogPage = Math.min(catalogPage, totalCatalogPages);
  const paginatedCatalogRows = useMemo(() => {
    const start = (safeCatalogPage - 1) * catalogPageSize;
    return allCatalogRows.slice(start, start + catalogPageSize);
  }, [allCatalogRows, safeCatalogPage, catalogPageSize]);

  const activeColorGroup = useMemo(() => {
    if (colorGroups.length === 0) return null;
    return (
      colorGroups.find((g) => g.groupKey === selectedColorKey) || colorGroups[0]
    );
  }, [colorGroups, selectedColorKey]);

  const isLoading = isLoadingVariants || isLoadingInventories;

  return (
    <DashboardLayout title="Update Inventory">
      <div
        ref={containerRef}
        style={isDesktop && targetHeight ? { height: targetHeight } : undefined}
        className="w-full space-y-4 sm:space-y-5 font-sans pb-8 lg:pb-0 lg:flex lg:flex-col lg:overflow-hidden"
      >
        {/* Header + Scanner Card */}
        <section className="w-full shrink-0 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Update Inventory
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Scan ASIN barcode to fetch SKU, Color, Size, and update Current Stock.
              </p>
            </div>

            {warehouses.length > 1 && (
              <div className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-xs min-w-0 shrink-0">
                <ThemeSelectDropdown
                  ariaLabel="Select Warehouse"
                  value={effectiveWarehouseId}
                  onChange={(val) => {
                    setSelectedWarehouseId(val);
                    setStockDrafts({});
                    setDoneVariantIds({});
                  }}
                  options={warehouseOptions}
                  placeholder="Select Warehouse"
                  align="right"
                  className="w-full"
                  buttonClassName="w-full justify-between dark:bg-[#131926] dark:border-white/[0.08]"
                  menuClassName="w-full min-w-[220px]"
                  icon={<Warehouse className="h-3.5 w-3.5" />}
                />
              </div>
            )}
          </div>

          {/* Scan Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={scanInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (inputRef.current && !isMobileDevice()) {
                    inputRef.current.setSelectionRange(0, inputRef.current.value.length);
                  }
                }}
                onClick={() => {
                  if (inputRef.current && !isMobileDevice()) {
                    inputRef.current.setSelectionRange(0, inputRef.current.value.length);
                  }
                }}
                placeholder="Scan or enter ASIN barcode (e.g. B0...)"
                autoComplete="off"
                spellCheck={false}
                className="h-12 w-full rounded-2xl border-2 border-[#E8C16D]/70 bg-[#FFFDF5] dark:bg-[#131926] focus:bg-white dark:focus:bg-[#131926] pl-10 pr-10 text-sm sm:text-base font-mono font-bold text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-sans placeholder:font-normal outline-none transition focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30"
              />
              {scanInput && (
                <button
                  type="button"
                  onClick={() => {
                    setScanInput("");
                    lastAutoMatchedRef.current = "";
                    if (!isMobileDevice()) {
                      inputRef.current?.focus();
                    }
                  }}
                  className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  title="Clear input"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSubmitScan}
                disabled={!scanInput.trim() || isLoading}
                className="flex-1 sm:flex-none h-12 rounded-2xl bg-[#E8C16D] px-5 text-sm font-bold text-[#0A0E1A] transition hover:bg-[#d4af5a] active:scale-[0.98] disabled:opacity-40 cursor-pointer shadow-xs inline-flex items-center justify-center gap-2"
              >
                <Barcode className="h-4 w-4" />
                <span>Find ASIN</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex-1 sm:flex-none h-12 rounded-2xl border border-[#E8C16D]/70 bg-[#FFF9EC] dark:bg-[#1A160E] px-4 text-sm font-bold text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#252014] transition shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Camera className="h-4 w-4" />
                <span>Camera Scan</span>
              </button>
            </div>
          </div>

          {isVariantsError && (
            <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 p-3.5 text-xs sm:text-sm font-semibold text-red-900 dark:text-red-300">
              Failed to load product catalog.
            </div>
          )}

          {feedback && (
            <div
              className={`rounded-2xl border p-3.5 text-xs sm:text-sm font-semibold transition-all ${
                feedback.type === "success"
                  ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300"
                  : feedback.type === "warning"
                  ? "border-amber-200 dark:border-amber-500/20 bg-amber-50/80 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300"
                  : "border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 text-red-900 dark:text-red-300"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                )}
                <div className="leading-snug break-words min-w-0">{feedback.text}</div>
              </div>
            </div>
          )}
        </section>

        {/* Full-Width Inventory Section: Scanned Color Tabs OR Before-Scan Table */}
        <section className="w-full lg:flex-1 lg:min-h-0 flex flex-col rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-[#E7E0D2] dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
                {scannedRows.length > 0 ? "Scanned Products" : "Product Inventory"}
              </h2>
              <span className="rounded-full bg-[#FFF9EC] dark:bg-[#F5C451]/15 border border-[#E8C16D]/40 dark:border-[#F5C451]/30 px-2.5 py-0.5 text-xs font-bold text-[#B88728] dark:text-[#F5C451]">
                {scannedRows.length > 0
                  ? `${colorGroups.length} ${colorGroups.length === 1 ? "Color" : "Colors"}`
                  : `${allCatalogRows.length}`}
              </span>
            </div>

            {scannedRows.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setScannedVariantIds([]);
                  setHighlightedVariantIds([]);
                  setSelectedColorKey("");
                  setStockDrafts({});
                  setDoneVariantIds({});
                  setFeedback(null);
                  setScanInput("");
                  lastAutoMatchedRef.current = "";
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {colorGroups.length === 0 || !activeColorGroup ? (
            isLoading ? (
              <div className="p-8 sm:p-12 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Loading product catalog...
              </div>
            ) : paginatedCatalogRows.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                No matching products found.
              </div>
            ) : (
              <>
                {/* Before-Scan Mobile Card List (< md) */}
                <div className="divide-y divide-[#E7E0D2]/70 dark:divide-white/[0.06] md:hidden">
                  {paginatedCatalogRows.map((row) => {
                    const draftStr = getDraftValue(row);
                    const draftNum = Number(draftStr);
                    const hasChanged =
                      Number.isFinite(draftNum) && draftNum !== row.currentStock;
                    const isUpdating = updatingVariantId === row.variantId;
                    const isDone = !!doneVariantIds[row.variantId];

                    return (
                      <div key={row.variantId} className="p-4 space-y-3">
                        <div className="min-w-0 space-y-1">
                          <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                            Master SKU: <span className="text-xs font-bold text-[#0A0E1A] dark:text-white">{row.masterSku}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/dashboard/settings/manage-product/product-profile/edit-product-varient/${row.variantId}?from=update-inventory`
                              )
                            }
                            className="font-sans text-sm font-bold text-[#B88728] dark:text-[#F5C451] hover:underline text-left break-all cursor-pointer block"
                          >
                            {row.sku}
                          </button>
                          <div className="flex items-center gap-1.5 font-sans text-xs text-slate-500 dark:text-slate-400">
                            <span>ASIN: {row.asin}</span>
                            {row.asin !== "--" && (
                              <button
                                type="button"
                                onClick={() => handleCopy(row.asin, "ASIN")}
                                className="p-0.5 text-slate-400 hover:text-[#B88728] cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Row 1: Current Stock & Stock side by side */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Current Stock
                            </span>
                            <div className="flex items-center justify-between rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-[#FFFDF5] dark:bg-[#131926] overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftNumber(
                                    row,
                                    (Number.isFinite(draftNum) ? draftNum : row.currentStock) - 1
                                  )
                                }
                                className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={draftStr}
                                onChange={(e) =>
                                  setStockDrafts((prev) => ({
                                    ...prev,
                                    [row.variantId]: e.target.value,
                                  }))
                                }
                                className="h-9 w-full min-w-0 bg-transparent text-center font-sans text-sm font-bold text-[#0A0E1A] dark:text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftNumber(
                                    row,
                                    (Number.isFinite(draftNum) ? draftNum : row.currentStock) + 1
                                  )
                                }
                                className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Stock
                            </span>
                            <div className="flex items-center justify-between rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-[#FFFDF5] dark:bg-[#131926] overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftNumber(
                                    row,
                                    (Number.isFinite(draftNum) ? draftNum : row.currentStock) - 1
                                  )
                                }
                                className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={draftStr}
                                onChange={(e) =>
                                  setStockDrafts((prev) => ({
                                    ...prev,
                                    [row.variantId]: e.target.value,
                                  }))
                                }
                                className="h-9 w-full min-w-0 bg-transparent text-center font-sans text-sm font-bold text-[#0A0E1A] dark:text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftNumber(
                                    row,
                                    (Number.isFinite(draftNum) ? draftNum : row.currentStock) + 1
                                  )
                                }
                                className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Done Button */}
                        <button
                          type="button"
                          onClick={() => handleDoneRow(row)}
                          disabled={isUpdating}
                          className={`w-full h-10 rounded-xl px-4 text-xs font-bold transition active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                            isDone && !hasChanged
                              ? "bg-emerald-600 text-white"
                              : hasChanged
                              ? "bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#d4af5a]"
                              : "bg-[#0A0E1A] dark:bg-white/[0.1] text-white hover:opacity-90"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                          <span>
                            {isUpdating ? "Updating..." : isDone && !hasChanged ? "Updated" : "Done"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Before-Scan Desktop Full-Width Table (>= md) */}
                <div
                  ref={tableContainerRef}
                  className="hidden md:block w-full lg:flex-1 lg:min-h-0 overflow-x-auto overflow-y-auto"
                >
                  <table className="w-full border-collapse text-center font-sans text-sm">
                    <thead className="sticky top-0 z-10 bg-[#FEFAEE] dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08]">
                      <tr>
                        <th className="px-4 py-3.5 w-14 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">No.</th>
                        <th className="px-4 py-3.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">Master SKU</th>
                        <th className="px-4 py-3.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">Variant SKU</th>
                        <th className="px-4 py-3.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">ASIN</th>
                        <th className="px-4 py-3.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">Current Stock</th>
                        <th className="px-4 py-3.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">Stock</th>
                        <th className="px-4 py-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE4D8]/80 dark:divide-white/[0.06]">
                      {paginatedCatalogRows.map((row, idx) => {
                        const rowNumber = (safeCatalogPage - 1) * catalogPageSize + idx + 1;
                        const isFirstInMasterGroup =
                          idx === 0 || paginatedCatalogRows[idx - 1].masterSku !== row.masterSku;
                        let masterSpan = 1;
                        if (isFirstInMasterGroup) {
                          while (
                            idx + masterSpan < paginatedCatalogRows.length &&
                            paginatedCatalogRows[idx + masterSpan].masterSku === row.masterSku
                          ) {
                            masterSpan++;
                          }
                        }
                        const draftStr = getDraftValue(row);
                        const draftNum = Number(draftStr);
                        const hasChanged =
                          Number.isFinite(draftNum) && draftNum !== row.currentStock;
                        const isUpdating = updatingVariantId === row.variantId;
                        const isDone = !!doneVariantIds[row.variantId];

                        return (
                          <tr
                            key={row.variantId}
                            className="hover:bg-[#FEFAEE]/60 dark:hover:bg-white/[0.025] transition-colors"
                          >
                            <td className="px-4 py-3 text-center font-semibold text-slate-500 dark:text-slate-400 border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                              {rowNumber}
                            </td>
                            {isFirstInMasterGroup && (
                              <td
                                rowSpan={masterSpan}
                                className="px-4 py-3 text-center font-bold text-[#0A0E1A] dark:text-white align-middle border-r border-[#EAE4D8]/80 dark:border-white/[0.06] bg-[#FFFDF8]/70 dark:bg-white/[0.015]"
                              >
                                {row.masterSku}
                              </td>
                            )}
                            <td className="px-4 py-3 text-center border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/settings/manage-product/product-profile/edit-product-varient/${row.variantId}?from=update-inventory`
                                  )
                                }
                                className="font-bold text-[#B88728] dark:text-[#F5C451] hover:underline text-center cursor-pointer"
                              >
                                {row.sku}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-[#0A0E1A] dark:text-white border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                              <div className="inline-flex items-center justify-center gap-1.5">
                                <span>{row.asin}</span>
                                {row.asin !== "--" && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(row.asin, "ASIN")}
                                    className="p-1 rounded-md text-slate-400 hover:text-[#B88728] dark:hover:text-[#F5C451] cursor-pointer"
                                    title="Copy ASIN"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                              <div className="inline-flex items-center justify-center rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-[#FFFDF5] dark:bg-[#131926] overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftNumber(
                                      row,
                                      (Number.isFinite(draftNum) ? draftNum : row.currentStock) - 1
                                    )
                                  }
                                  className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={draftStr}
                                  onChange={(e) =>
                                    setStockDrafts((prev) => ({
                                      ...prev,
                                      [row.variantId]: e.target.value,
                                    }))
                                  }
                                  className="h-8 w-16 bg-transparent text-center font-sans text-sm font-bold text-[#0A0E1A] dark:text-white outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftNumber(
                                      row,
                                      (Number.isFinite(draftNum) ? draftNum : row.currentStock) + 1
                                    )
                                  }
                                  className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                              <div className="inline-flex items-center justify-center gap-2">
                                <div className="inline-flex items-center rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-[#FFFDF5] dark:bg-[#131926] overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraftNumber(
                                        row,
                                        (Number.isFinite(draftNum) ? draftNum : row.currentStock) - 1
                                      )
                                    }
                                    className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={draftStr}
                                    onChange={(e) =>
                                      setStockDrafts((prev) => ({
                                        ...prev,
                                        [row.variantId]: e.target.value,
                                      }))
                                    }
                                    className="h-8 w-16 bg-transparent text-center font-sans text-sm font-bold text-[#0A0E1A] dark:text-white outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraftNumber(
                                        row,
                                        (Number.isFinite(draftNum) ? draftNum : row.currentStock) + 1
                                      )
                                    }
                                    className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                {hasChanged && (
                                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    (was {row.currentStock})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDoneRow(row)}
                                disabled={isUpdating}
                                className={`h-8 rounded-xl px-3.5 text-xs font-bold transition active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                                  isDone && !hasChanged
                                    ? "bg-emerald-600 text-white"
                                    : hasChanged
                                    ? "bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#d4af5a]"
                                    : "bg-[#0A0E1A] dark:bg-white/[0.1] text-white hover:opacity-90"
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>
                                  {isUpdating
                                    ? "Updating..."
                                    : isDone && !hasChanged
                                    ? "Updated"
                                    : "Done"}
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Before-Scan Pagination */}
                <div className="shrink-0">
                  <Pagination
                    variant="theme"
                    page={safeCatalogPage}
                    totalPages={totalCatalogPages}
                    totalRecords={allCatalogRows.length}
                    pageSize={catalogPageSize}
                    options={[10, 20, 50, 100]}
                    className="px-4 sm:px-6 py-3.5 border-t border-[#EAE4D8] dark:border-white/[0.08] bg-[#FEFAEE]/60 dark:bg-[#080B11] rounded-b-2xl sm:rounded-b-3xl"
                    onPageChange={setCatalogPage}
                    onPageSizeChange={(size) => {
                      setCatalogPageSize(size);
                      setCatalogPage(1);
                    }}
                  />
                </div>
              </>
            )
          ) : (
            <>
              {/* Color Tabs Bar */}
              <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-3 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#FEFAEE]/60 dark:bg-[#0B101B]">
                {colorGroups.map((group) => {
                  const isActive = group.groupKey === activeColorGroup.groupKey;
                  return (
                    <button
                      key={group.groupKey}
                      type="button"
                      onClick={() => setSelectedColorKey(group.groupKey)}
                      className={`inline-flex items-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold border transition cursor-pointer ${
                        isActive
                          ? "bg-[#E8C16D] border-[#d4af5a] text-[#0A0E1A] shadow-xs"
                          : "bg-white dark:bg-[#131926] border-[#E7E0D2] dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      {group.color !== "--" && (
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/20 dark:border-white/25 shrink-0"
                          style={{ backgroundColor: getColorHex(group.color) }}
                        />
                      )}
                      <span>{group.color}</span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-[#0A0E1A]/15 text-[#0A0E1A]"
                            : "bg-[#FFF9EC] dark:bg-[#F5C451]/15 text-[#B88728] dark:text-[#F5C451]"
                        }`}
                      >
                        {group.items.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Color Meta Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 bg-[#FFFDF8] dark:bg-[#0D1320] border-b border-[#EAE4D8]/80 dark:border-white/[0.06] text-xs">
                <div className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  Master SKU: <span className="text-[#B88728] dark:text-[#F5C451]">{activeColorGroup.masterSku}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  Color Total Stock: <strong className="font-mono text-[#0A0E1A] dark:text-white">{activeColorGroup.totalCurrentStock}</strong>
                </div>
              </div>

              {/* Mobile Card List (< md) */}
              <div className="divide-y divide-[#E7E0D2]/70 dark:divide-white/[0.06] md:hidden">
                {activeColorGroup.items.map((row) => {
                  const isHighlighted = highlightedVariantIds.includes(row.variantId);
                  const draftStr = getDraftValue(row);
                  const draftNum = Number(draftStr);
                  const hasChanged =
                    Number.isFinite(draftNum) && draftNum !== row.currentStock;
                  const isUpdating = updatingVariantId === row.variantId;
                  const isDone = !!doneVariantIds[row.variantId];

                  return (
                    <div
                      key={row.variantId}
                      className={`p-4 space-y-3 ${
                        isHighlighted ? "bg-[#FFF9EC]/90 dark:bg-[#F5C451]/[0.08]" : ""
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-lg border border-[#E8C16D]/40 dark:border-[#F5C451]/30 bg-[#FFF9EC] dark:bg-[#F5C451]/10 px-2.5 py-0.5 text-xs font-bold text-[#B88728] dark:text-[#F5C451]">
                            <Ruler className="h-3 w-3" />
                            <span>{row.size}</span>
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Master: <span className="text-xs font-bold text-[#0A0E1A] dark:text-white">{row.masterSku}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/settings/manage-product/product-profile/edit-product-varient/${row.variantId}?from=update-inventory`
                            )
                          }
                          className="font-sans text-sm font-bold text-[#B88728] dark:text-[#F5C451] hover:underline text-left break-all cursor-pointer block"
                        >
                          {row.sku}
                        </button>
                        <div className="flex items-center gap-1.5 font-sans text-xs text-slate-500 dark:text-slate-400">
                          <span>ASIN: {row.asin}</span>
                          {row.asin !== "--" && (
                            <button
                              type="button"
                              onClick={() => handleCopy(row.asin, "ASIN")}
                              className="p-0.5 text-slate-400 hover:text-[#B88728] cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 1: Current Stock & Stock side by side */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Current Stock
                          </span>
                          <div className="flex items-center justify-between rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#131926] overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                setDraftNumber(row, (Number.isFinite(draftNum) ? draftNum : row.currentStock) - 1)
                              }
                              className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={draftStr}
                              onChange={(e) => {
                                setStockDrafts((prev) => ({
                                  ...prev,
                                  [row.variantId]: e.target.value,
                                }));
                              }}
                              className="h-9 w-full min-w-0 bg-transparent text-center font-sans text-sm font-bold text-[#0A0E1A] dark:text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraftNumber(row, (Number.isFinite(draftNum) ? draftNum : row.currentStock) + 1)
                              }
                              className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Stock
                          </span>
                          <div className="flex items-center justify-between rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#131926] overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                setDraftNumber(row, (Number.isFinite(draftNum) ? draftNum : row.currentStock) - 1)
                              }
                              className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={draftStr}
                              onChange={(e) => {
                                setStockDrafts((prev) => ({
                                  ...prev,
                                  [row.variantId]: e.target.value,
                                }));
                              }}
                              className="h-9 w-full min-w-0 bg-transparent text-center font-sans text-sm font-bold text-[#0A0E1A] dark:text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setDraftNumber(row, (Number.isFinite(draftNum) ? draftNum : row.currentStock) + 1)
                              }
                              className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Done Button */}
                      <button
                        type="button"
                        onClick={() => handleDoneRow(row)}
                        disabled={isUpdating}
                        className={`w-full h-10 rounded-xl px-4 text-xs font-bold transition active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                          isDone && !hasChanged
                            ? "bg-emerald-600 text-white"
                            : hasChanged
                            ? "bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#d4af5a]"
                            : "bg-[#0A0E1A] dark:bg-white/[0.1] text-white hover:opacity-90"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                        <span>
                          {isUpdating ? "Updating..." : isDone && !hasChanged ? "Updated" : "Done"}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Full-Width Table (>= md) */}
              <div
                ref={tableContainerRef}
                className="hidden md:block w-full lg:flex-1 lg:min-h-0 overflow-x-auto overflow-y-auto"
              >
                <table className="w-full border-collapse text-center font-sans text-sm">
                  <thead className="sticky top-0 z-10 bg-[#FEFAEE] dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08]">
                    <tr>
                      <th className="px-4 py-3.5 w-14 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">No.</th>
                      <th className="px-4 py-3.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">Size</th>
                      <th className="px-4 py-3.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">ASIN</th>
                      <th className="px-4 py-3.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">Variant SKU</th>
                      <th className="px-4 py-3.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">Current Stock</th>
                      <th className="px-4 py-3.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">Stock</th>
                      <th className="px-4 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE4D8]/80 dark:divide-white/[0.06]">
                    {activeColorGroup.items.map((row, idx) => {
                      const isHighlighted = highlightedVariantIds.includes(row.variantId);
                      const draftStr = getDraftValue(row);
                      const draftNum = Number(draftStr);
                      const hasChanged =
                        Number.isFinite(draftNum) && draftNum !== row.currentStock;
                      const isUpdating = updatingVariantId === row.variantId;
                      const isDone = !!doneVariantIds[row.variantId];

                      return (
                        <tr
                          key={row.variantId}
                          className={`transition-colors ${
                            isHighlighted
                              ? "bg-[#FFF9EC] dark:bg-[#F5C451]/[0.08]"
                              : "hover:bg-[#FEFAEE]/60 dark:hover:bg-white/[0.025]"
                          }`}
                        >
                          <td className="px-4 py-3 text-center font-semibold text-slate-500 dark:text-slate-400 border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                            {idx + 1}
                          </td>

                          <td className="px-4 py-3 text-center border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                            <span className="inline-flex items-center justify-center rounded-lg border border-[#E8C16D]/40 dark:border-[#F5C451]/30 bg-[#FFF9EC] dark:bg-[#F5C451]/10 px-2.5 py-0.5 text-xs font-bold text-[#B88728] dark:text-[#F5C451]">
                              {row.size}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center font-semibold text-[#0A0E1A] dark:text-white border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                            <div className="inline-flex items-center justify-center gap-1.5">
                              <span>{row.asin}</span>
                              {row.asin !== "--" && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(row.asin, "ASIN")}
                                  className="p-1 rounded-md text-slate-400 hover:text-[#B88728] dark:hover:text-[#F5C451] cursor-pointer"
                                  title="Copy ASIN"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/dashboard/settings/manage-product/product-profile/edit-product-varient/${row.variantId}?from=update-inventory`
                                )
                              }
                              className="font-bold text-[#B88728] dark:text-[#F5C451] hover:underline text-center cursor-pointer"
                            >
                              {row.sku}
                            </button>
                          </td>

                          <td className="px-4 py-3 text-center border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                            <div className="inline-flex items-center justify-center gap-2">
                              <div className="inline-flex items-center rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#131926] overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftNumber(
                                      row,
                                      (Number.isFinite(draftNum) ? draftNum : row.currentStock) - 1
                                    )
                                  }
                                  className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                  title="Decrease current stock"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={draftStr}
                                  onChange={(e) =>
                                    setStockDrafts((prev) => ({
                                      ...prev,
                                      [row.variantId]: e.target.value,
                                    }))
                                  }
                                  className="h-8 w-16 bg-transparent text-center font-sans text-sm font-bold text-[#0A0E1A] dark:text-white outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftNumber(
                                      row,
                                      (Number.isFinite(draftNum) ? draftNum : row.currentStock) + 1
                                    )
                                  }
                                  className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                  title="Increase current stock"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center border-r border-[#EAE4D8]/80 dark:border-white/[0.06]">
                            <div className="inline-flex items-center justify-center gap-2">
                              <div className="inline-flex items-center rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#131926] overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftNumber(
                                      row,
                                      (Number.isFinite(draftNum) ? draftNum : row.currentStock) - 1
                                    )
                                  }
                                  className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                  title="Decrease"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={draftStr}
                                  onChange={(e) =>
                                    setStockDrafts((prev) => ({
                                      ...prev,
                                      [row.variantId]: e.target.value,
                                    }))
                                  }
                                  className="h-8 w-16 bg-transparent text-center font-sans text-sm font-bold text-[#0A0E1A] dark:text-white outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftNumber(
                                      row,
                                      (Number.isFinite(draftNum) ? draftNum : row.currentStock) + 1
                                    )
                                  }
                                  className="h-8 w-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                  title="Increase"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              {hasChanged && (
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  (was {row.currentStock})
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDoneRow(row)}
                                disabled={isUpdating}
                                className={`h-8 rounded-xl px-3.5 text-xs font-bold transition active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 ${
                                  isDone && !hasChanged
                                    ? "bg-emerald-600 text-white"
                                    : hasChanged
                                    ? "bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#d4af5a]"
                                    : "bg-[#0A0E1A] dark:bg-white/[0.1] text-white hover:opacity-90"
                                }`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>
                                  {isUpdating
                                    ? "Updating..."
                                    : isDone && !hasChanged
                                    ? "Updated"
                                    : "Done"}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <MobileCameraScanner
        isOpen={isCameraOpen}
        onClose={handleCameraClose}
        onScan={handleCameraScan}
        message={feedback?.text}
      />
    </DashboardLayout>
  );
}
