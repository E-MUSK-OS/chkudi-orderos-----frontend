"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { toast } from "sonner";
import { ArrowRight, Printer } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

import Toolbar from "./components/Toolbar";
import OrderTable from "./components/OrderTable";
import { orders as initialOrders } from "./data";
import { generatePicklist } from "./utils/generatePicklist";
import { downloadPicklistPDF } from "./pdf/PicklistPDF";

const Order = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "OPEN" | "PRIORITY" | "PICKING" | "TRANSIT"
  >("OPEN");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Filtered orders matching original logic: Search by Order ID and match Status
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch = order.orderId
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus = order.status === status;

      return matchSearch && matchStatus;
    });
  }, [orders, search, status]);

  const totalRecords = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  // Prevent invalid page after filtering or page size change
  const currentPage = Math.min(page, totalPages);

  const start = (currentPage - 1) * limit;
  const end = start + limit;
  const currentOrders = filteredOrders.slice(start, end);

  // Stage summary counts
  const counts = useMemo(
    () => ({
      OPEN: orders.filter((o) => o.status === "OPEN").length,
      PRIORITY: orders.filter((o) => o.status === "PRIORITY").length,
      PICKING: orders.filter((o) => o.status === "PICKING").length,
      TRANSIT: orders.filter((o) => o.status === "TRANSIT").length,
    }),
    [orders]
  );

  const moveToPicking = () => {
    if (!selectedRows.length) return;

    setOrders((prev) =>
      prev.map((order) => {
        if (
          selectedRows.includes(order.id) &&
          (order.status === "OPEN" || order.status === "PRIORITY")
        ) {
          return {
            ...order,
            status: "PICKING",
          };
        }
        return order;
      })
    );

    toast.success(`Successfully moved ${selectedRows.length} order(s) to In Picking`);
    setSelectedRows([]);
  };

  const handleGeneratePicklist = () => {
    if (!selectedRows.length) return;

    const picklist = generatePicklist(orders, selectedRows);
    downloadPicklistPDF(picklist);
    toast.success(`Generated picklist for ${selectedRows.length} order(s)`);
  };

  const handleProcessPicking = () => {
    if (!selectedRows.length) return;

    setOrders((prev) =>
      prev.map((order) => {
        if (selectedRows.includes(order.id) && order.status === "PICKING") {
          return {
            ...order,
            status: "TRANSIT",
          };
        }
        return order;
      })
    );

    toast.success(`Processed ${selectedRows.length} order(s) to In Transit`);
    setSelectedRows([]);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const lowerSectionRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

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
  // past the Header Card on desktop (>= 1024px), the Lower Section (Stage Cards + Table)
  // fills the visible viewport exactly, stopping firmly as shown in user's image.
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

    const timer = setTimeout(calculateHeight, 100);
    const timer2 = setTimeout(calculateHeight, 300);

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    window.addEventListener("resize", calculateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });
      if (scrollContainer) resizeObserver.observe(scrollContainer);
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener("resize", calculateHeight);
      resizeObserver?.disconnect();
    };
  }, [calculateHeight]);

  // Reset scroll to top when page first loads
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, []);

  // Scroll table back to top on page, limit, search, or status change
  useEffect(() => {
    tableScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, limit, search, status]);

  // Seamless scroll coordinator:
  // 1. When scrolling down, outer page scrolls until Header Card is hidden and stops firmly at Lower Section.
  // 2. Once at the stopped position, scrolling down over the table or lower section scrolls the table rows internally.
  // 3. When scrolling up, table rows scroll up to the first row; scrolling up further reveals the Header Card.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

      const tableScrollEl = tableScrollRef.current;
      const lowerSectionEl = lowerSectionRef.current;
      const maxPageScroll = Math.max(
        0,
        scrollContainer.scrollHeight - scrollContainer.clientHeight
      );
      if (maxPageScroll <= 0) return;

      const isPageAtBottom = scrollContainer.scrollTop >= maxPageScroll - 2;

      const path = e.composedPath();
      const isOverLowerSection = lowerSectionEl && path.includes(lowerSectionEl);
      const isOverTable = tableScrollEl && path.includes(tableScrollEl);

      if (e.deltaY > 0) {
        // Scrolling DOWN
        if (!isPageAtBottom) {
          // Page is still scrolling to hide Header Card
          return;
        }

        // Page reached stop-scrolling bottom (Header is hidden, Lower Section fills view)
        if (isOverLowerSection && tableScrollEl) {
          const maxTableScroll = tableScrollEl.scrollHeight - tableScrollEl.clientHeight;
          if (maxTableScroll > 0) {
            e.preventDefault();
            tableScrollEl.scrollTop = Math.min(
              maxTableScroll,
              tableScrollEl.scrollTop + e.deltaY
            );
          }
        }
      } else if (e.deltaY < 0) {
        // Scrolling UP
        if (isOverTable && tableScrollEl) {
          if (tableScrollEl.scrollTop > 0) {
            e.preventDefault();
            tableScrollEl.scrollTop = Math.max(0, tableScrollEl.scrollTop + e.deltaY);
            return;
          }
        }

        // When table is at top (scrollTop === 0), let outer page scroll back up to reveal Header Card
      }
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <DashboardLayout title="Order Process">
      <div ref={containerRef} className="space-y-4 sm:space-y-6">
        {/* Header Card (Matching Amazon Analytics) */}
        <div
          ref={headerCardRef}
          className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Myntra Order Process
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage, prioritize, and process Myntra customer orders across Open, Priority, In Picking, and In Transit fulfillment stages.
              </p>
            </div>

            {/* Quick Action Buttons in Header when rows are selected */}
            {selectedRows.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
                {(status === "OPEN" || status === "PRIORITY") && (
                  <button
                    type="button"
                    onClick={moveToPicking}
                    className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span>Move to In Picking ({selectedRows.length})</span>
                  </button>
                )}

                {status === "PICKING" && (
                  <>
                    <button
                      type="button"
                      onClick={handleGeneratePicklist}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#251F14] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer"
                      title="Download formatted Picklist PDF"
                    >
                      <Printer className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                      <span>Picklist ({selectedRows.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleProcessPicking}
                      className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>Process ({selectedRows.length})</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lower Section (Shown in user's image): Stage Cards, Toolbar & Order Table */}
        <div
          ref={lowerSectionRef}
          style={{
            height: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
          }}
          className="flex flex-col gap-4 sm:gap-5 min-h-0"
        >
          {/* Toolbar: Metric Stage Cards & Search Bar */}
          <div className="shrink-0">
            <Toolbar
              search={search}
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
              status={status}
              onStatusChange={(value) => {
                setStatus(value);
                setSelectedRows([]);
                setPage(1);
              }}
              counts={counts}
              selectedRows={selectedRows}
              onMoveToPicking={moveToPicking}
              onGeneratePicklist={handleGeneratePicklist}
              onProcess={handleProcessPicking}
            />
          </div>

          {/* Order Table with Sticky Header and Pinned Pagination Footer */}
          <OrderTable
            tableScrollRef={tableScrollRef}
            orders={currentOrders}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            pagination={
              totalRecords > 0 ? (
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  total={totalRecords}
                  limit={limit}
                  itemName="orders"
                  variant="dark"
                  className="border-none bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5 text-slate-700 dark:text-white"
                  onPageChange={setPage}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                />
              ) : null
            }
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Order;
