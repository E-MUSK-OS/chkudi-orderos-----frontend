"use client";

import { useEffect, useState, useRef, useCallback } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { SkuMapping } from "./types/skuMapping.types";

import Toolbar from "./components/Toolbar";
import SkuMappingTable from "./components/SkuMappingTable";
import ImportSkuMappingModal from "./components/ImportModal";
import SkuMappingModal from "./components/SkuMappingModal";
import DeleteSkuMappingModal from "./components/DeleteSkuMappingModal";
import { useSkuMappings } from "./hooks/useSkuMappings";
import GenerateSheetModal from "./components/GenerateSheetModal";

export default function SkuMappingPage() {
  const [importOpen, setImportOpen] = useState(false);
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedSku, setSelectedSku] = useState<SkuMapping | null>(null);
  const [search, setSearch] = useState("");

  const [page] = useState(1);
  const [pageSize] = useState(10);

  const { data } = useSkuMappings({
    page,
    limit: pageSize,
    search,
  });

  // Scroll & Height coordinator refs & state
  const containerRef = useRef<HTMLDivElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Calculate available height inside the scroll container so that the
  // Header Card and Toolbar stay fixed at the top, and the table takes
  // the remaining viewport height and scrolls internally.
  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setTableMaxHeight(null);
      return;
    }
    if (!containerRef.current) return;
    const scrollContainer = containerRef.current.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    scrollContainer.scrollTop = 0;

    const style = window.getComputedStyle(scrollContainer);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    const available = scrollContainer.clientHeight - paddingTop - paddingBottom;
    if (available > 320) {
      const headerHeight = headerCardRef.current?.offsetHeight || 88;
      const toolbarHeight = toolbarRef.current?.offsetHeight || 60;
      const gap = 48; // 2x gap-6 = 48px
      const maxForTable = available - headerHeight - toolbarHeight - gap;
      if (maxForTable > 160) {
        setTableMaxHeight(Math.floor(maxForTable));
      }
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

  useEffect(() => {
    calculateHeight();
  }, [data?.pagination.total, search, calculateHeight]);

  // Lock outer scroll at header position on desktop:
  // Header Card and Toolbar stay fixed at the top, outer page does not scroll,
  // and scrolling forwards to the internal table.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    scrollContainer.scrollTop = 0;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      scrollContainer.scrollTop = 0;

      const tableContainer = tableContainerRef.current;
      if (!tableContainer) return;

      // If wheel occurred over the header card or toolbar, scroll the table internally
      if (!e.composedPath().includes(tableContainer) && !tableContainer.contains(e.target as Node)) {
        tableContainer.scrollTop += e.deltaY;
      }
    };

    const onScroll = () => {
      if (window.innerWidth >= 1024 && scrollContainer.scrollTop !== 0) {
        scrollContainer.scrollTop = 0;
      }
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: true });
    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <DashboardLayout title="Godown Inventory Sheet">
      <div ref={containerRef} className="flex flex-col gap-4 sm:gap-6 font-sans text-slate-900 dark:text-slate-100 pb-8">
        {/* Top Header Card (locked at top) */}
        <div
          ref={headerCardRef}
          className="shrink-0 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Manage Label Printing and SKU Mappings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage SKU barcode mappings and generate godown inventory sheets for warehouse operations.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div ref={toolbarRef} className="shrink-0">
          <Toolbar
            search={search}
            total={data?.pagination.total ?? 0}
            onSearchChange={setSearch}
            onImport={() => setImportOpen(true)}
            onGenerateSheet={() => setGenerateSheetOpen(true)}
          />
        </div>

        {/* Table Container (takes remaining height and scrolls internally) */}
        <div
          className="flex flex-col min-h-0 flex-1"
          style={{
            maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
          }}
        >
          <SkuMappingTable
            search={search}
            tableContainerRef={tableContainerRef}
            onEdit={(row) => {
              setSelectedSku(row);
              setEditOpen(true);
            }}
            onDelete={(row) => {
              setSelectedSku(row);
              setDeleteOpen(true);
            }}
          />
        </div>
      </div>

      <ImportSkuMappingModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />

      <SkuMappingModal
        open={editOpen}
        skuMapping={selectedSku}
        onClose={() => setEditOpen(false)}
      />

      <DeleteSkuMappingModal
        open={deleteOpen}
        skuMapping={selectedSku}
        onClose={() => setDeleteOpen(false)}
      />

      <GenerateSheetModal
        open={generateSheetOpen}
        onClose={() => setGenerateSheetOpen(false)}
      />
    </DashboardLayout>
  );
}
