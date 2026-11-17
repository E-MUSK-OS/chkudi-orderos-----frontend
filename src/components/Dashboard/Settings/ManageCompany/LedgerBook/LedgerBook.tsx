"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import LedgerBookHeader from "./components/LedgerBookHeader";
import LedgerBookFilterBar from "./components/LedgerBookFilterBar";
import LedgerBookTable from "./components/LedgerBookTable";
import LedgerBookPagination from "./components/LedgerBookPagination";
import UploadLedgerModal from "./components/UploadLedgerModal";
import DeleteLedgerModal from "./components/DeleteLedgerModal";
import { Ledger, LedgerFilterState } from "./types/ledger.types";
import { ledgerService } from "./services/ledger.service";
import { downloadBlankLedgerTemplate } from "./utils/excelTemplate";
import { toast } from "sonner";

export default function LedgerBook() {
  const router = useRouter();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingLedger, setDeletingLedger] = useState<Ledger | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    no: true,
    logo: true,
    partyName: true,
    accountCode: true,
    accountHead: true,
    contactPerson: true,
    gstin: true,
    email: true,
    addedBy: true,
    actions: true,
  });

  // Filter state
  const [filters, setFilters] = useState<LedgerFilterState>({
    search: "",
    ledgerName: "",
    accountHead: "All",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    pageSize: 20,
  });

  const filtersRef = useRef(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll & Height coordinator refs & state
  const containerRef = useRef<HTMLDivElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Calculate available height on desktop (>= 1024px)
  // so the table takes only the height needed for available records,
  // up to the available viewport space, and scrolls internally if there are more records.
  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setTargetHeight(null);
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
      setTargetHeight(Math.floor(available));
      const headerHeight = headerCardRef.current?.offsetHeight || 88;
      const filterBarHeight = filterBarRef.current?.offsetHeight || 60;
      const gap = 32; // 2x gap-4 (16px each)
      const maxForTable = available - headerHeight - filterBarHeight - gap;
      if (maxForTable > 150) {
        setTableMaxHeight(Math.floor(maxForTable));
      }
    }
  }, []);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
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
  }, [ledgers.length, calculateHeight]);

  // Lock outer scroll at header position on desktop:
  // Since this page has Header Card + Filter Bar + Table, the Header Card stays fixed at the top,
  // outer page does not scroll, and scrolling forwards to the internal table.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    scrollContainer.scrollTop = 0;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      scrollContainer.scrollTop = 0;

      const tableContainer = tableContainerRef.current;
      if (!tableContainer) return;

      // If wheel occurred over the header card or filter bar, scroll the table internally
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

  const fetchLedgers = useCallback(async (currentFilters?: LedgerFilterState) => {
    try {
      setLoading(true);
      const active = currentFilters || filtersRef.current;
      const res = await ledgerService.getLedgers(active);
      setLedgers(res.data || []);
      setTotalCount(res.meta?.total || (res.data ? res.data.length : 0));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load ledger accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  const handleFilterChange = (key: keyof LedgerFilterState, value: any) => {
    const nextFilters = { ...filters, [key]: value, page: 1 };
    setFilters(nextFilters);
    filtersRef.current = nextFilters;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (key === "accountHead") {
      fetchLedgers(nextFilters);
    } else {
      debounceTimerRef.current = setTimeout(() => {
        fetchLedgers(nextFilters);
      }, 300);
    }
  };

  const handleResetFilters = () => {
    const initial: LedgerFilterState = {
      search: "",
      ledgerName: "",
      accountHead: "All",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      pageSize: 20,
    };
    setFilters(initial);
    filtersRef.current = initial;
    fetchLedgers(initial);
  };

  const handlePageChange = (newPage: number) => {
    const next = { ...filters, page: newPage };
    setFilters(next);
    filtersRef.current = next;
    fetchLedgers(next);
  };

  const handlePageSizeChange = (newSize: number) => {
    const next = { ...filters, pageSize: newSize, page: 1 };
    setFilters(next);
    filtersRef.current = next;
    fetchLedgers(next);
  };

  const handleToggleColumn = (colKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colKey]: !prev[colKey],
    }));
  };

  const handleCreate = () => {
    router.push("/dashboard/setting/manage-company/ledger-book/new");
  };

  const handleView = (ledger: Ledger) => {
    router.push(`/dashboard/setting/manage-company/ledger-book/view/${ledger.id}`);
  };

  const handleEdit = (ledger: Ledger) => {
    router.push(`/dashboard/setting/manage-company/ledger-book/edit/${ledger.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLedger) return;
    try {
      setIsDeleting(true);
      await ledgerService.deleteLedger(deletingLedger.id);
      toast.success(`Ledger "${deletingLedger.partyName}" deleted successfully.`);
      setDeletingLedger(null);
      fetchLedgers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete ledger.");
    } finally {
      setIsDeleting(false);
    }
  };

  const startIndex = (filters.page - 1) * filters.pageSize;

  return (
    <DashboardLayout title="Ledger Book">
      <div
        ref={containerRef}
        className="flex flex-col gap-4 font-sans text-slate-100 max-w-[1600px] mx-auto min-h-0"
        style={{
          maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
        }}
      >
        {/* Header with Title & Action Buttons matching Image 5 */}
        <div ref={headerCardRef} className="shrink-0">
          <LedgerBookHeader
            onCreateClick={handleCreate}
            onDownloadTemplate={downloadBlankLedgerTemplate}
            onUploadClick={() => setUploadModalOpen(true)}
          />
        </div>

        {/* Filter Bar with Ledger Name, Account Head, Global Search, Columns toggle matching Image 5 */}
        <div ref={filterBarRef} className="shrink-0">
          <LedgerBookFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
            totalCount={totalCount}
          />
        </div>

        {/* Data Table matching Image 5 */}
        <div
          className="flex flex-col min-h-0"
          style={{
            maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
          }}
        >
          <LedgerBookTable
            ledgers={ledgers}
            loading={loading}
            visibleColumns={visibleColumns}
            startIndex={startIndex}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={(item) => setDeletingLedger(item)}
            tableContainerRef={tableContainerRef}
            pagination={
              totalCount > 0 ? (
                <LedgerBookPagination
                  total={totalCount}
                  page={filters.page}
                  pageSize={filters.pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              ) : null
            }
          />
        </div>
      </div>

      {/* Upload Ledger Modal */}
      <UploadLedgerModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => fetchLedgers()}
      />

      {/* Delete Confirmation Modal */}
      <DeleteLedgerModal
        open={Boolean(deletingLedger)}
        ledgerName={deletingLedger?.partyName}
        loading={isDeleting}
        onClose={() => setDeletingLedger(null)}
        onConfirm={handleDeleteConfirm}
      />
    </DashboardLayout>
  );
}

