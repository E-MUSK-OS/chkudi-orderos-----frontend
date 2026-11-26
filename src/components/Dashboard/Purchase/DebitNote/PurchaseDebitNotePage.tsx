"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import DebitNoteListHeader from "./components/DebitNoteListHeader";
import DebitNoteFilters from "./components/DebitNoteFilters";
import DebitNoteTable from "./components/DebitNoteTable";
import DebitNoteCreateForm from "./components/DebitNoteCreateForm";
import DeleteDebitNoteModal from "./components/DeleteDebitNoteModal";
import {
  PurchaseDebitNote,
  DebitNoteFilterState,
} from "./types/purchaseDebitNote.types";
import { purchaseDebitNoteService } from "./services/purchaseDebitNote.service";

export default function PurchaseDebitNotePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [debitNotes, setDebitNotes] = useState<PurchaseDebitNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDebitNote, setActiveDebitNote] = useState<PurchaseDebitNote | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState<PurchaseDebitNote | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState<DebitNoteFilterState>({
    search: "",
    productSku: "",
    lotNo: "",
    party: "",
    debitNoteNo: "",
    invoiceType: "All",
    selectedSku: "All",
    startDate: "",
    endDate: "",
  });

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    debitNoteNo: true,
    lotOrSku: true,
    date: true,
    partyName: true,
    quantity: true,
    netAmount: true,
    invoiceType: true,
    preparedBy: true,
    actions: true,
  });

  const [sortField, setSortField] = useState<keyof PurchaseDebitNote>("debitNoteDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [showAggregations, setShowAggregations] = useState(true);

  const fetchDebitNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await purchaseDebitNoteService.getDebitNotes(filters);
      setDebitNotes(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load Debit Notes");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (viewMode === "list") {
      fetchDebitNotes();
    }
  }, [viewMode, fetchDebitNotes]);

  const handleFilterChange = (key: keyof DebitNoteFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      productSku: "",
      lotNo: "",
      party: "",
      debitNoteNo: "",
      invoiceType: "All",
      selectedSku: "All",
      startDate: "",
      endDate: "",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    try {
      setDeleting(true);
      await purchaseDebitNoteService.deleteDebitNote(deletingTarget.id);
      toast.success(`Deleted Debit Note ${deletingTarget.debitNoteNo}`);
      setDeleteModalOpen(false);
      setDeletingTarget(null);
      fetchDebitNotes();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete Debit Note");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Debit Note">
      <div className="flex flex-col gap-4 sm:gap-5 max-w-[1700px] mx-auto min-h-0">
        {viewMode === "list" ? (
          <>
            <DebitNoteListHeader
              onCreate={() => {
                router.push("/dashboard/purchase/finish-goods/debit-note/new");
              }}
              onDownload={async () => {
                try {
                  await purchaseDebitNoteService.downloadExcel(filters);
                  toast.success("Downloaded Debit Notes Excel");
                } catch (err: any) {
                  toast.error(err.message || "Failed to download Excel");
                }
              }}
            />

            <DebitNoteFilters
              filters={filters}
              onChange={handleFilterChange}
              onDateRangeChange={(startDate, endDate) =>
                setFilters((prev) => ({ ...prev, startDate, endDate }))
              }
              onSearch={fetchDebitNotes}
              onReset={handleResetFilters}
              visibleColumns={visibleColumns}
              onToggleColumn={(key) =>
                setVisibleColumns((prev) => ({
                  ...prev,
                  [key]: prev[key] === false,
                }))
              }
              onClearSorting={() => {
                setSortField("debitNoteDate");
                setSortAsc(false);
              }}
              onClearAggregations={() => setShowAggregations((p) => !p)}
              onResetPinning={() => toast.info("Column pinning reset")}
            />

            <DebitNoteTable
              debitNotes={debitNotes}
              loading={loading}
              visibleColumns={visibleColumns}
              sortField={sortField}
              sortAsc={sortAsc}
              onSortChange={(field, asc) => {
                setSortField(field);
                setSortAsc(asc);
              }}
              showAggregations={showAggregations}
              onEdit={(dn) => {
                router.push(`/dashboard/purchase/finish-goods/debit-note/${dn.id}/edit`);
              }}
              onDelete={(dn) => {
                setDeletingTarget(dn);
                setDeleteModalOpen(true);
              }}
            />
          </>
        ) : (
          <DebitNoteCreateForm
            debitNote={activeDebitNote}
            onSuccess={() => {
              setActiveDebitNote(null);
              setViewMode("list");
              fetchDebitNotes();
            }}
            onCancel={() => {
              setActiveDebitNote(null);
              setViewMode("list");
            }}
          />
        )}

        <DeleteDebitNoteModal
          isOpen={deleteModalOpen}
          debitNoteNo={deletingTarget?.debitNoteNo}
          loading={deleting}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeletingTarget(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </DashboardLayout>
  );
}
