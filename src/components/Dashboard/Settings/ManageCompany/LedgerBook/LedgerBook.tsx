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
      <div className="space-y-4 font-sans text-slate-100 max-w-[1600px] mx-auto pb-6">
        {/* Header with Title & Action Buttons matching Image 5 */}
        <LedgerBookHeader
          onCreateClick={handleCreate}
          onDownloadTemplate={downloadBlankLedgerTemplate}
          onUploadClick={() => setUploadModalOpen(true)}
        />

        {/* Filter Bar with Ledger Name, Account Head, Global Search, Columns toggle matching Image 5 */}
        <LedgerBookFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
          totalCount={totalCount}
        />

        {/* Data Table matching Image 5 */}
        <LedgerBookTable
          ledgers={ledgers}
          loading={loading}
          visibleColumns={visibleColumns}
          startIndex={startIndex}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={(item) => setDeletingLedger(item)}
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

