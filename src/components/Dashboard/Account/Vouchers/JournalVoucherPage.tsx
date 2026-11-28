"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { coordinateTableWheelScroll } from "@/utils/tableScrollCoordinator";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import JournalVoucherFilters from "./components/JournalVoucherFilters";
import JournalVoucherTable, { type JournalPinnedSide } from "./components/JournalVoucherTable";
import { journalVoucherService } from "./services/journalVoucher.service";
import type {
  JournalVoucher,
  JournalVoucherFilterState,
} from "./types/journalVoucher.types";

const BASE_ROUTE = "/dashboard/account/vouchers/journal-vouchers";

const INITIAL_FILTERS: JournalVoucherFilterState = {
  search: "",
  startDate: "",
  endDate: "",
};

export default function JournalVoucherPage() {
  const router = useRouter();

  const [vouchers, setVouchers] = useState<JournalVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<JournalVoucherFilterState>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmountSum, setTotalAmountSum] = useState(0);

  const [sortField, setSortField] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [showAggregations, setShowAggregations] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [pinnedColumns, setPinnedColumns] = useState<Record<string, JournalPinnedSide>>({});

  const [downloading, setDownloading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JournalVoucher | null>(null);
  const [deleting, setDeleting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

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
      const headerHeight = headerCardRef.current?.offsetHeight || 96;
      const filterBarHeight = filterBarRef.current?.offsetHeight || 62;
      const gap = 32;
      const maxForTable = available - headerHeight - filterBarHeight - gap;
      if (maxForTable > 180) {
        setTableMaxHeight(Math.floor(maxForTable));
      }
    }
  }, []);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    calculateHeight();
    window.addEventListener("resize", checkDesktop);
    window.addEventListener("resize", calculateHeight);
    const t = setTimeout(calculateHeight, 100);
    return () => {
      window.removeEventListener("resize", checkDesktop);
      window.removeEventListener("resize", calculateHeight);
      clearTimeout(t);
    };
  }, [calculateHeight, vouchers.length, loading]);

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
    return () => scrollContainer.removeEventListener("wheel", onWheel);
  }, [isDesktop, vouchers.length]);

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await journalVoucherService.list({
        ...filters,
        page,
        limit,
        sortField,
        sortAsc,
      });
      setVouchers(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setTotalAmountSum(res.totalAmountSum);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load journal vouchers.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit, sortField, sortAsc]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVouchers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchVouchers]);

  const handleFilterChange = (field: keyof JournalVoucherFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters((prev) => ({ ...prev, startDate, endDate }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const handleToggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: prev[key] === false,
    }));
  };

  const handleSortChange = (field: string, asc?: boolean) => {
    if (typeof asc === "boolean") {
      setSortField(field);
      setSortAsc(asc);
    } else if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handlePinColumn = (colKey: string, side: JournalPinnedSide | null) => {
    setPinnedColumns((prev) => {
      const next = { ...prev };
      if (!side) delete next[colKey];
      else next[colKey] = side;
      return next;
    });
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const blob = await journalVoucherService.exportExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `journalvouchers-${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Journal vouchers exported to Excel.");
    } catch {
      toast.error("Failed to export journal vouchers.");
    } finally {
      setDownloading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await journalVoucherService.remove(deleteTarget.id);
      toast.success(`Journal Voucher #${deleteTarget.voucherNo} deleted.`);
      setDeleteTarget(null);
      await fetchVouchers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete journal voucher.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Journal Voucher">
      <div
        ref={containerRef}
        className="flex flex-col gap-4 font-sans max-w-[1600px] mx-auto min-h-0"
        style={{
          maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
        }}
      >
        <div ref={headerCardRef} className="shrink-0">
          <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 lg:p-7 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-[26px] font-black font-heading tracking-tight text-[#0A0E1A] dark:text-white">
                  Journal Voucher
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Track and manage journal voucher entries.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={downloading}
                  className="inline-flex min-h-[38px] sm:h-11 items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] px-3.5 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#6A4D1D] dark:text-[#E8C16D] transition-all hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 shrink-0" />
                  )}
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`${BASE_ROUTE}/new`)}
                  className="inline-flex min-h-[38px] sm:h-11 items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] px-4 sm:px-6 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <PlusCircle className="h-4 w-4 shrink-0 stroke-[2.5]" />
                  <span>Create</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <div ref={filterBarRef} className="shrink-0">
          <JournalVoucherFilters
            filters={filters}
            onChange={handleFilterChange}
            onDateRangeChange={handleDateRangeChange}
            onReset={handleResetFilters}
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
            onClearSorting={() => {
              setSortField("");
              setSortAsc(false);
            }}
            onResetPinning={() => {
              setPinnedColumns({});
              toast.success("Column pinning cleared.");
            }}
            onToggleAggregations={() => setShowAggregations((p) => !p)}
            showAggregations={showAggregations}
          />
        </div>

        <div
          className="flex flex-col min-h-0"
          style={{
            maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
          }}
        >
          <JournalVoucherTable
            vouchers={vouchers}
            loading={loading}
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            totalAmountSum={totalAmountSum}
            visibleColumns={visibleColumns}
            pinnedColumns={pinnedColumns}
            showAggregations={showAggregations}
            sortField={sortField}
            sortAsc={sortAsc}
            onSortChange={handleSortChange}
            onClearSort={() => {
              setSortField("");
              setSortAsc(false);
            }}
            onPinColumn={handlePinColumn}
            onHideColumn={handleToggleColumn}
            onPageChange={setPage}
            onLimitChange={setLimit}
            onView={(v) => router.push(`${BASE_ROUTE}/view/${v.id}`)}
            onEdit={(v) => router.push(`${BASE_ROUTE}/edit/${v.id}`)}
            onDelete={(v) => setDeleteTarget(v)}
            tableContainerRef={tableContainerRef}
          />
        </div>
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete Journal Voucher"
        description={`Are you sure you want to delete J.V. #${deleteTarget?.voucherNo}?`}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="h-9 px-4 rounded-xl text-xs font-medium border border-[#E7E0D2] dark:border-white/[0.12] text-[#0A0E1A] dark:text-slate-200 hover:bg-[#F7F5F0] dark:hover:bg-white/[0.06]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </button>
          </div>
        }
      >
        <p className="text-xs text-[#6B7280] dark:text-slate-400">
          This journal voucher will be archived safely from your active register.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
