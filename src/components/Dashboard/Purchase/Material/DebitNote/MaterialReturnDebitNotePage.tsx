"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileMinus2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { materialOrderService } from "../Order/services/materialOrder.service";
import MaterialDebitNoteFilters, {
  MaterialDebitNoteColumnOption,
} from "./components/MaterialDebitNoteFilters";
import MaterialDebitNoteTable from "./components/MaterialDebitNoteTable";
import { MaterialPurchaseDebitNote } from "./types/materialDebitNote.types";
import { materialDebitNoteService } from "./services/materialDebitNote.service";

export default function MaterialReturnDebitNotePage() {
  const router = useRouter();
  const [debitNotes, setDebitNotes] = useState<MaterialPurchaseDebitNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [total, setTotal] = useState(0);
  const [sumTotalQty, setSumTotalQty] = useState(0);
  const [sumNetAmount, setSumNetAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showSumRow, setShowSumRow] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [supplier, setSupplier] = useState("");
  const [debitNoteNo, setDebitNoteNo] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [material, setMaterial] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [materialOptions, setMaterialOptions] = useState<ThemeSelectOption[]>([]);

  const [columns, setColumns] = useState<MaterialDebitNoteColumnOption[]>([
    { id: "no", label: "No.", visible: true },
    { id: "checkbox", label: "Checkbox", visible: true },
    { id: "debitNoteNo", label: "Debit Note No.", visible: true },
    { id: "date", label: "Date.", visible: true },
    { id: "partyName", label: "Party Name.", visible: true },
    { id: "qty", label: "Quantity.", visible: true },
    { id: "netAmount", label: "Net Amount.", visible: true },
    { id: "invoiceType", label: "Invoice Type.", visible: true },
    { id: "preparedBy", label: "Prepared By.", visible: true },
  ]);

  useEffect(() => {
    materialOrderService
      .getMaterials()
      .then((list) => {
        const opts: ThemeSelectOption[] = list.map((m) => ({
          value: m.sku || m.masterSku || m.materialName,
          label: m.materialName || m.sku || m.masterSku,
        }));
        setMaterialOptions(opts);
      })
      .catch(() => {});
  }, []);

  const fetchDebitNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await materialDebitNoteService.getDebitNotes({
        search,
        supplier,
        debitNoteNo,
        debitNoteType: "Return",
        invoiceType,
        material,
        startDate,
        endDate,
        page,
        limit,
      });
      if (res?.data) {
        setDebitNotes(res.data.debitNotes || []);
        setTotal(res.data.total || 0);
        setSumTotalQty(res.data.sumTotalQty || 0);
        setSumNetAmount(res.data.sumNetAmount || 0);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load material debit notes");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    supplier,
    debitNoteNo,
    invoiceType,
    material,
    startDate,
    endDate,
    page,
    limit,
  ]);

  useEffect(() => {
    fetchDebitNotes();
  }, [fetchDebitNotes]);

  const handleToggleColumn = (colId: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleClearFilters = () => {
    setSupplier("");
    setDebitNoteNo("");
    setInvoiceType("");
    setMaterial("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
  };

  const handleDelete = async (dn: MaterialPurchaseDebitNote) => {
    if (!window.confirm(`Delete Debit Note ${dn.debitNoteNo}?`)) return;
    try {
      await materialDebitNoteService.deleteDebitNote(dn.id);
      setSelectedIds((prev) => prev.filter((id) => id !== dn.id));
      toast.success("Material Purchase Debit Note deleted.");
      fetchDebitNotes();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete debit note");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected Debit Note(s)?`)) return;
    try {
      await Promise.all(
        selectedIds.map((id) => materialDebitNoteService.deleteDebitNote(id))
      );
      toast.success(`Deleted ${selectedIds.length} Material Purchase Debit Note(s).`);
      setSelectedIds([]);
      fetchDebitNotes();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete selected debit notes");
    }
  };

  const handleDownload = async () => {
    try {
      await materialDebitNoteService.exportExcel({
        ids: selectedIds.length > 0 ? selectedIds : undefined,
        search,
        supplier,
        debitNoteNo,
        debitNoteType: "Return",
        invoiceType,
        material,
        startDate,
        endDate,
      });
      if (selectedIds.length > 0) {
        toast.success(`Downloaded ${selectedIds.length} Selected Debit Note(s) Excel`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to export Excel");
    }
  };

  const memoizedMaterialOptions = useMemo(() => materialOptions, [materialOptions]);

  return (
    <DashboardLayout title="Debit Note [ Material & Service ]">
      <div className="w-full space-y-4">
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
                <FileMinus2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base xl:text-xl font-bold text-[#0A0E1A] dark:text-white leading-snug">
                  Debit Note{" "}
                  <span className="inline-block whitespace-nowrap">
                    [ Material &amp; Service ]
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Manage Purchase Material &amp; Service debit note
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 whitespace-nowrap md:ml-auto">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2 h-9 sm:h-10 px-3.5 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedIds.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
                <span>
                  {selectedIds.length > 0
                    ? `Download (${selectedIds.length})`
                    : "Download"}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/purchase/material/debit-note/return/new")
                }
                className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
            </div>
          </div>
        </div>

        <MaterialDebitNoteFilters
          supplier={supplier}
          onSupplierChange={(v) => {
            setSupplier(v);
            setPage(1);
          }}
          debitNoteNo={debitNoteNo}
          onDebitNoteNoChange={(v) => {
            setDebitNoteNo(v);
            setPage(1);
          }}
          invoiceType={invoiceType}
          onInvoiceTypeChange={(v) => {
            setInvoiceType(v);
            setPage(1);
          }}
          material={material}
          onMaterialChange={(v) => {
            setMaterial(v);
            setPage(1);
          }}
          materialOptions={memoizedMaterialOptions}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setPage(1);
          }}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onClearFilters={handleClearFilters}
          onToggleAggregations={() => setShowSumRow((p) => !p)}
        />

        <MaterialDebitNoteTable
          debitNotes={debitNotes}
          loading={loading}
          columns={columns}
          showSumRow={showSumRow}
          page={page}
          limit={limit}
          total={total}
          sumTotalQty={sumTotalQty}
          sumNetAmount={sumNetAmount}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          onView={(dn) => {
            router.push(`/dashboard/purchase/material/debit-note/return/view/${dn.id}`);
          }}
          onEdit={(dn) => {
            router.push(`/dashboard/purchase/material/debit-note/return/${dn.id}/edit`);
          }}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
}
