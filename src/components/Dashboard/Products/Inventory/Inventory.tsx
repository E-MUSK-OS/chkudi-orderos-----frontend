"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Warehouse,
  Boxes,
} from "lucide-react";

import {
  useInventories,
  useUpdateInventory,
  useAdjustInventory,
  useDeleteInventory,
  useExportInventory,
} from "./hooks/useInventories";

import type { Inventory, InventoryFilters } from "./types/inventory.types";

import InventoryToolbar from "./components/InventoryToolbar";
import DashboardLayout from "../../layout/DashboardLayout";
import InventoryTable from "./components/InventoryTable";
import InventoryModal from "./components/InventoryModal";
import AdjustInventoryModal from "./components/AdjustInventoryModal";
import DeleteInventoryModal from "./components/DeleteInventoryModal";

const InventoryPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
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

  // Calculate available height inside the scroll container so that when scrolled
  // past the Header Card on desktop (>= 1024px), the lower section fills the visible
  // viewport exactly. On mobile (< 1024px), it leaves height unconstrained for natural scrolling.
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

  // Seamless scroll coordinator:
  // 1. When scrolling down, outer page scrolls until Header Card is hidden and stops at the fixed position (view shown in img).
  // 2. Once at the fixed position, scrolling down over the table scrolls the table rows internally.
  // 3. When scrolling up, table scrolls up to the first row; then scrolling up reveals the Header Card.
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

      const isPageAtBottom = scrollContainer.scrollTop >= maxPageScroll - 2;
      const isPageAtTop = scrollContainer.scrollTop <= 2;

      const isOverTable =
        tableContainer &&
        (e.composedPath().includes(tableContainer) ||
          tableContainer.contains(e.target as Node));

      if (e.deltaY > 0) {
        // Scrolling DOWN
        if (!isPageAtBottom) {
          // Outer page has not reached the fixed view yet -> scroll page down
          e.preventDefault();
          scrollContainer.scrollTop = Math.min(
            maxPageScroll,
            scrollContainer.scrollTop + e.deltaY
          );
        } else if (!isOverTable) {
          // At the fixed point and outside the table -> forward scroll to table
          if (tableContainer) {
            tableContainer.scrollTop += e.deltaY;
          }
        }
        // If isPageAtBottom and isOverTable, allow table to scroll natively
      } else if (e.deltaY < 0) {
        // Scrolling UP
        if (!isOverTable) {
          // Cursor is outside table -> scroll outer page up if not at top
          if (!isPageAtTop) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        } else {
          // Cursor is inside table
          const isTableAtTop = !tableContainer || tableContainer.scrollTop <= 1;
          if (isTableAtTop && !isPageAtTop) {
            // Table is at top row -> scroll outer page up to reveal Header Card
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
          // If table is not at top, allow table to scroll natively upwards
        }
      }
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

  // ======================================================
  // Filters
  // ======================================================

  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 10,
    search: "",
    warehouseId: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // ======================================================
  // Selected Inventory
  // ======================================================

  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(
    null,
  );

  // ======================================================
  // Modals
  // ======================================================

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ======================================================
  // Query
  // ======================================================

  const { data, isLoading, isError, refetch } = useInventories(filters);
  const exportInventoryMutation = useExportInventory();

  const handleRefresh = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: "",
      warehouseId: "",
      status: "",
    }));
    refetch();
  };

  const inventories =
    data?.data?.filter((inventory) => {
      switch (filters.status) {
        case "OUT_OF_STOCK":
          return inventory.availableStock === 0;

        case "LOW_STOCK":
          return (
            inventory.availableStock > 0 &&
            inventory.availableStock <= inventory.reorderLevel
          );

        case "IN_STOCK":
          return inventory.availableStock > inventory.reorderLevel;

        default:
          return true;
      }
    }) ?? [];

  // ======================================================
  // KPI Statistics
  // ======================================================

  const stats = useMemo(() => {
    const list = data?.data ?? [];
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalAvailable = 0;
    let totalReserved = 0;

    list.forEach((item) => {
      totalAvailable += item.availableStock || 0;
      totalReserved += item.reservedStock || 0;
      if (item.availableStock === 0) {
        outOfStock++;
      } else if (item.availableStock <= item.reorderLevel) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return {
      totalItems: data?.pagination?.total ?? list.length,
      inStock,
      lowStock,
      outOfStock,
      totalAvailable,
      totalReserved,
    };
  }, [data]);

  // ======================================================
  // Render
  // ======================================================

  return (
    <DashboardLayout title="Inventory">
      <div ref={containerRef} className="flex flex-col gap-4 sm:gap-6">
        {/* Header Information Banner matching Product Analytics Amazon */}
        <div className="shrink-0 rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                    Product Inventory
                  </h1>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Track real-time stock levels, allocations, and inventory transfers.
              </p>
            </div>
          </div>
        </div>

        {/* Lower Section (KPI Stats Cards + Toolbar + InventoryTable) */}
        <div
          className="flex flex-col gap-4 sm:gap-6"
          style={{
            height: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
            minHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
          }}
        >
          {/* KPI Stats Cards */}
          <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Total Records */}
            <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3.5 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Total Items</p>
              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                <h3 className="text-xl sm:text-2xl xl:text-3xl font-black text-[#0A0E1A] dark:text-white truncate">
                  {stats.totalItems.toLocaleString()}
                </h3>
                <span className="rounded-xl border border-blue-200/60 bg-blue-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400 whitespace-nowrap shrink-0">
                  Records
                </span>
              </div>
            </article>

            {/* Total Available Units */}
            <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3.5 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Available Units</p>
              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                <h3 className="text-xl sm:text-2xl xl:text-3xl font-black text-[#0A0E1A] dark:text-white truncate">
                  {stats.totalAvailable.toLocaleString()}
                </h3>
                <span className="rounded-xl border border-amber-200/60 bg-[#FFF9EC] px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-[#B88728] dark:border-[#F5C451]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] whitespace-nowrap shrink-0">
                  Units
                </span>
              </div>
            </article>

            {/* In Stock */}
            <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3.5 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">In Stock</p>
              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                <h3 className="text-xl sm:text-2xl xl:text-3xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                  {stats.inStock.toLocaleString()}
                </h3>
                <span className="rounded-xl border border-emerald-200/60 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400 whitespace-nowrap shrink-0">
                  Healthy
                </span>
              </div>
            </article>

            {/* Low Stock */}
            <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3.5 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Low Stock</p>
              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                <h3 className="text-xl sm:text-2xl xl:text-3xl font-black text-amber-600 dark:text-amber-400 truncate">
                  {stats.lowStock.toLocaleString()}
                </h3>
                <span className="rounded-xl border border-amber-200/60 bg-amber-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400 whitespace-nowrap shrink-0">
                  Reorder
                </span>
              </div>
            </article>

            {/* Out of Stock */}
            <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3.5 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
              <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Out of Stock</p>
              <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
                <h3 className="text-xl sm:text-2xl xl:text-3xl font-black text-rose-600 dark:text-rose-400 truncate">
                  {stats.outOfStock.toLocaleString()}
                </h3>
                <span className="rounded-xl border border-rose-200/60 bg-rose-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400 whitespace-nowrap shrink-0">
                  Zero Stock
                </span>
              </div>
            </article>
          </div>

          {/* Toolbar */}
          <div className="shrink-0">
            <InventoryToolbar
              filters={filters}
              setFilters={setFilters}
              onRefresh={refetch}
              onExport={() => exportInventoryMutation.mutate(filters)}
              isExporting={exportInventoryMutation.isPending}
            />
          </div>

          {/* Table Container */}
          <div className="lg:flex-1 lg:min-h-0 flex flex-col">
            <InventoryTable
              // inventories={data?.data ?? []}
              inventories={inventories}
              pagination={data?.pagination}
              isLoading={isLoading}
              isError={isError}
              tableContainerRef={tableContainerRef}
              onEdit={(inventory) => {
                setSelectedInventory(inventory);
                setIsUpdateOpen(true);
              }}
              onAdjust={(inventory) => {
                setSelectedInventory(inventory);
                setIsAdjustOpen(true);
              }}
              onDelete={(inventory) => {
                setSelectedInventory(inventory);
                setIsDeleteOpen(true);
              }}
              onPageChange={(page) =>
                setFilters((prev) => ({
                  ...prev,
                  page,
                }))
              }
              onPageSizeChange={(limit) =>
                setFilters((prev) => ({
                  ...prev,
                  page: 1,
                  limit,
                }))
              }
            />
          </div>
        </div>

        <InventoryModal
          open={isUpdateOpen}
          onOpenChange={setIsUpdateOpen}
          inventory={selectedInventory}
        />

        <AdjustInventoryModal
          open={isAdjustOpen}
          onOpenChange={setIsAdjustOpen}
          inventory={selectedInventory}
        />

        <DeleteInventoryModal
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          inventory={selectedInventory}
        />
      </div>
    </DashboardLayout>
  );
};

export default InventoryPage;
