"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import VMSList from "./Admin/components/VMSList";
import { coordinateTableWheelScroll } from "@/utils/tableScrollCoordinator";

export default function ScansVMS() {
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
  // 1. When scrolling down, outer page scrolls until Header Card is hidden and stops at the fixed position.
  // 2. Once at the fixed position, scrolling down over the table scrolls the table rows internally.
  // 3. When scrolling up, table scrolls up to the first row; then scrolling up reveals the Header Card.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      coordinateTableWheelScroll({
        e,
        scrollContainer,
        tableContainer: tableContainerRef.current,
      });
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <DashboardLayout title="Scans VMS">
      <div ref={containerRef} className="flex flex-col gap-6">
        {/* Header Card (Matching Amazon Analytics & Order Process UI) */}
        <div className="shrink-0 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                VMS Scans
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage all uploaded scan recordings.
              </p>
            </div>
          </div>
        </div>

        {/* Lower Section (Toolbar + DataTable) */}
        <div
          className="flex flex-col gap-6"
          style={{
            height: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
            minHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
          }}
        >
          <VMSList tableContainerRef={tableContainerRef} />
        </div>
      </div>
    </DashboardLayout>
  );
}