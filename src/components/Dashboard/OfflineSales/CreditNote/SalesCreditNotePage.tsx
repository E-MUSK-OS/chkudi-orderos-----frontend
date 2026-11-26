"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import CreditNoteListHeader from "./components/CreditNoteListHeader";
import CreditNoteFilters from "./components/CreditNoteFilters";
import CreditNoteTable from "./components/CreditNoteTable";
import CreditNoteCreateForm from "./components/CreditNoteCreateForm";
import DeleteCreditNoteModal from "./components/DeleteCreditNoteModal";
import {
  SalesCreditNote,
  CreditNoteFilterState,
} from "./types/salesCreditNote.types";
import { salesCreditNoteService } from "./services/salesCreditNote.service";

export default function SalesCreditNotePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [creditNotes, setCreditNotes] = useState<SalesCreditNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCreditNote, setActiveCreditNote] = useState<SalesCreditNote | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState<SalesCreditNote | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState<CreditNoteFilterState>({
    search: "",
    creditNoteNo: "",
    party: "",
    salesFor: "All",
    startDate: "",
    endDate: "",
  });

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    creditNoteNo: true,
    date: true,
    partyName: true,
    quantity: true,
    netAmount: true,
    salesFor: true,
    invoiceType: true,
    preparedBy: true,
    actions: true,
  });

  const [sortField, setSortField] = useState<keyof SalesCreditNote>("creditNoteDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [showAggregations, setShowAggregations] = useState(true);

  const fetchCreditNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await salesCreditNoteService.getCreditNotes(filters);
      setCreditNotes(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load Credit Notes");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (viewMode === "list") {
      fetchCreditNotes();
    }
  }, [viewMode, fetchCreditNotes]);

  const handleFilterChange = (key: keyof CreditNoteFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      creditNoteNo: "",
      party: "",
      salesFor: "All",
      startDate: "",
      endDate: "",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    try {
      setDeleting(true);
      await salesCreditNoteService.deleteCreditNote(deletingTarget.id);
      toast.success(`Credit Note ${deletingTarget.creditNoteNo} deleted!`);
      setDeleteModalOpen(false);
      setDeletingTarget(null);
      fetchCreditNotes();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete Credit Note");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (cn: SalesCreditNote) => {
    router.push(`/dashboard/offline-sales/credit-note/${cn.id}/edit`);
  };

  const handleDownload = async () => {
    try {
      await salesCreditNoteService.exportExcel(filters);
      toast.success("Credit Notes exported to Excel");
    } catch (err: any) {
      toast.error(err.message || "Failed to export");
    }
  };

  return (
    <DashboardLayout title="Credit Note">
      <div className="space-y-4">
        {viewMode === "list" ? (
          <>
            <CreditNoteListHeader
              onCreate={() => {
                router.push("/dashboard/offline-sales/credit-note/new");
              }}
              onDownload={handleDownload}
            />

            <CreditNoteFilters
              filters={filters}
              onChange={handleFilterChange}
              onDateRangeChange={(s, e) =>
                setFilters((prev) => ({ ...prev, startDate: s, endDate: e }))
              }
              onSearch={fetchCreditNotes}
              onReset={handleResetFilters}
              visibleColumns={visibleColumns}
              onToggleColumn={(key) =>
                setVisibleColumns((prev) => ({ ...prev, [key]: prev[key] === false }))
              }
              onClearSorting={() => {
                setSortField("creditNoteDate");
                setSortAsc(false);
              }}
              onClearAggregations={() => setShowAggregations((p) => !p)}
              onResetPinning={() => {}}
            />

            <CreditNoteTable
              creditNotes={creditNotes}
              loading={loading}
              onEdit={handleEdit}
              onDelete={(cn) => {
                setDeletingTarget(cn);
                setDeleteModalOpen(true);
              }}
              visibleColumns={visibleColumns}
              sortField={sortField}
              sortAsc={sortAsc}
              onSortChange={(f, a) => {
                setSortField(f);
                setSortAsc(a);
              }}
              showAggregations={showAggregations}
            />

            <DeleteCreditNoteModal
              open={deleteModalOpen}
              creditNoteNo={deletingTarget?.creditNoteNo}
              deleting={deleting}
              onConfirm={handleConfirmDelete}
              onCancel={() => {
                setDeleteModalOpen(false);
                setDeletingTarget(null);
              }}
            />
          </>
        ) : (
          <CreditNoteCreateForm
            creditNote={viewMode === "edit" ? activeCreditNote : null}
            onSuccess={() => {
              setActiveCreditNote(null);
              setViewMode("list");
            }}
            onCancel={() => {
              setActiveCreditNote(null);
              setViewMode("list");
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
