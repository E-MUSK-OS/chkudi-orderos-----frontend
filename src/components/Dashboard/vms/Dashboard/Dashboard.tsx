"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import StatsCards from "./StatsCards";
import OperatorTable from "./OperatorTable";

import { useOperators } from "../Admin/User/operator/hooks/useOperators";
import { useAccounts } from "../../vms/Admin/Account/hooks/useAccounts";
import { useVMS } from "../../vms/Scans/VMS/Admin/hooks/useVMS";

const Dashboard = () => {
  const { operators, loading, fetchOperators } = useOperators();
  const { accounts, loading: accountLoading, fetchAccounts } = useAccounts();
  const { data: vmsData, loading: vmsLoading } = useVMS();

  const containerRef = useRef<HTMLDivElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const lowerSectionRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    fetchOperators();
    fetchAccounts();
  }, []);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Calculate available height inside the scroll container so that when scrolled
  // past the Header Card on desktop (>= 1024px), the lower section fits within the visible
  // viewport without forcing extra empty space when rows are few, and capping at available
  // height when rows are many so only the table content scrolls.
  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setTargetHeight(null);
      setTableMaxHeight(null);
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
      const statsH = statsRef.current?.offsetHeight || 116;
      const gap = 24; // gap-6
      const maxTableH = Math.floor(available - statsH - gap);
      setTableMaxHeight(maxTableH > 200 ? maxTableH : null);
    }
  }, []);

  useEffect(() => {
    calculateHeight();

    const timer = setTimeout(calculateHeight, 150);
    const timer2 = setTimeout(calculateHeight, 350);

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    window.addEventListener("resize", calculateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });
      if (scrollContainer) resizeObserver.observe(scrollContainer);
      if (statsRef.current) resizeObserver.observe(statsRef.current);
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener("resize", calculateHeight);
      resizeObserver?.disconnect();
    };
  }, [calculateHeight]);

  // Seamless scroll coordinator:
  // 1. When scrolling down, the outer page scrolls until Header Card is hidden and stops at the fixed position.
  // 2. Once at the fixed position, scrolling down over the table or lower section scrolls the table rows internally.
  // 3. When scrolling up, table scrolls up to the first row; then scrolling up reveals the Header Card.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

      const tableScrollEl = tableContainerRef.current;
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
          // Outer page has not reached the stopped view yet -> let outer page scroll down
          return;
        }

        // Once at stopped position, scroll table internally if table has overflow
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
    <DashboardLayout title="Dashboard">
      <div ref={containerRef} className="flex flex-col gap-6">
        {/* Header Card */}
        <div
          ref={headerCardRef}
          className="shrink-0 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm"
        >
          <div className="space-y-1.5">
            <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
              VMS Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Operator performance and average recording time per VMS (Today, Last 7 Days, Total)
            </p>
          </div>
        </div>

        {/* Lower Section (StatsCards + OperatorTable) */}
        <div
          ref={lowerSectionRef}
          className="flex flex-col gap-6 min-h-0"
        >
          <div ref={statsRef} className="shrink-0">
            <StatsCards />
          </div>

          <div
            style={{
              maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
            }}
            className="flex flex-col min-h-0"
          >
            <OperatorTable
              operators={operators}
              loading={loading}
              vmsData={vmsData}
              vmsLoading={vmsLoading}
              tableContainerRef={tableContainerRef}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
