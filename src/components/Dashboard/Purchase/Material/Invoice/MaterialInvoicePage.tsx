"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, ReceiptText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { materialOrderService } from "../Order/services/materialOrder.service";
import MaterialInvoiceFilters, {
  MaterialInvoiceColumnOption,
} from "./components/MaterialInvoiceFilters";
import MaterialInvoiceTable from "./components/MaterialInvoiceTable";
import { MaterialPurchaseInvoice } from "./types/materialInvoice.types";
import { materialInvoiceService } from "./services/materialInvoice.service";

export default function MaterialInvoicePage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<MaterialPurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [total, setTotal] = useState(0);
  const [sumTotalQty, setSumTotalQty] = useState(0);
  const [sumNetAmount, setSumNetAmount] = useState(0);
  const [sumDebitNoteAmount, setSumDebitNoteAmount] = useState(0);
  const [sumDiscDebitNoteAmount, setSumDiscDebitNoteAmount] = useState(0);
  const [sumPaidAmount, setSumPaidAmount] = useState(0);
  const [sumBalanceAmount, setSumBalanceAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showSumRow, setShowSumRow] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [party, setParty] = useState("");
  const [partyChallanNo, setPartyChallanNo] = useState("");
  const [partyBillNo, setPartyBillNo] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [material, setMaterial] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [materialOptions, setMaterialOptions] = useState<ThemeSelectOption[]>([]);

  const [columns, setColumns] = useState<MaterialInvoiceColumnOption[]>([
    { id: "no", label: "No.", visible: true },
    { id: "checkbox", label: "Checkbox", visible: true },
    { id: "invoiceNo", label: "Invoice No.", visible: true },
    { id: "date", label: "Date.", visible: true },
    { id: "party", label: "Party.", visible: true },
    { id: "partyBillNo", label: "Party Bill No.", visible: true },
    { id: "partyChallanNo", label: "Party Challan No.", visible: true },
    { id: "invoiceType", label: "Invoice Type.", visible: true },
    { id: "qty", label: "Qty.", visible: true },
    { id: "netAmount", label: "Net Amount.", visible: true },
    { id: "debitNote", label: "Debit Note.", visible: true },
    { id: "discDebitNote", label: "Disc. Debit Note.", visible: true },
    { id: "paid", label: "Paid.", visible: true },
    { id: "balance", label: "Balance.", visible: true },
    { id: "paymentStatus", label: "Payment Status.", visible: true },
    { id: "dnStatus", label: "DN Status.", visible: true },
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

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await materialInvoiceService.getInvoices({
        search,
        party,
        partyChallanNo,
        partyBillNo,
        invoiceType,
        material,
        startDate,
        endDate,
        page,
        limit,
      });
      if (res?.data) {
        setInvoices(res.data.invoices || []);
        setTotal(res.data.total || 0);
        setSumTotalQty(res.data.sumTotalQty || 0);
        setSumNetAmount(res.data.sumNetAmount || 0);
        setSumDebitNoteAmount(res.data.sumDebitNoteAmount || 0);
        setSumDiscDebitNoteAmount(res.data.sumDiscDebitNoteAmount || 0);
        setSumPaidAmount(res.data.sumPaidAmount || 0);
        setSumBalanceAmount(res.data.sumBalanceAmount || 0);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load material invoices");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    party,
    partyChallanNo,
    partyBillNo,
    invoiceType,
    material,
    startDate,
    endDate,
    page,
    limit,
  ]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleToggleColumn = (colId: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleClearFilters = () => {
    setParty("");
    setPartyChallanNo("");
    setPartyBillNo("");
    setInvoiceType("");
    setMaterial("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
  };

  const handleDelete = async (inv: MaterialPurchaseInvoice) => {
    if (!window.confirm(`Delete Material Invoice ${inv.invoiceNo}?`)) return;
    try {
      await materialInvoiceService.deleteInvoice(inv.id);
      setSelectedIds((prev) => prev.filter((id) => id !== inv.id));
      toast.success("Material Purchase Invoice deleted.");
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete invoice");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.length} selected Material Invoice(s)?`
      )
    ) {
      return;
    }
    try {
      await Promise.all(
        selectedIds.map((id) => materialInvoiceService.deleteInvoice(id))
      );
      toast.success(`Deleted ${selectedIds.length} Material Purchase Invoice(s).`);
      setSelectedIds([]);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete selected invoices");
    }
  };

  const handleDownload = async () => {
    try {
      await materialInvoiceService.exportExcel({
        ids: selectedIds.length > 0 ? selectedIds : undefined,
        search,
        party,
        partyChallanNo,
        partyBillNo,
        invoiceType,
        material,
        startDate,
        endDate,
      });
      if (selectedIds.length > 0) {
        toast.success(
          `Downloaded ${selectedIds.length} Selected Invoice(s) Excel`
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to export Excel");
    }
  };

  const memoizedMaterialOptions = useMemo(() => materialOptions, [materialOptions]);

  return (
    <DashboardLayout title="Invoice [ Purchase Material & Service ]">
      <div className="w-full space-y-4">
        {/* Header Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base xl:text-xl font-bold text-[#0A0E1A] dark:text-white leading-snug">
                  Invoice{" "}
                  <span className="inline-block whitespace-nowrap">
                    [ Purchase Material &amp; Service ]
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Manage purchase materials bills
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
                onClick={() => router.push("/dashboard/purchase/material/invoice/new")}
                className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <MaterialInvoiceFilters
          party={party}
          onPartyChange={(v) => {
            setParty(v);
            setPage(1);
          }}
          partyChallanNo={partyChallanNo}
          onPartyChallanNoChange={(v) => {
            setPartyChallanNo(v);
            setPage(1);
          }}
          partyBillNo={partyBillNo}
          onPartyBillNoChange={(v) => {
            setPartyBillNo(v);
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

        {/* Table */}
        <MaterialInvoiceTable
          invoices={invoices}
          loading={loading}
          columns={columns}
          showSumRow={showSumRow}
          page={page}
          limit={limit}
          total={total}
          sumTotalQty={sumTotalQty}
          sumNetAmount={sumNetAmount}
          sumDebitNoteAmount={sumDebitNoteAmount}
          sumDiscDebitNoteAmount={sumDiscDebitNoteAmount}
          sumPaidAmount={sumPaidAmount}
          sumBalanceAmount={sumBalanceAmount}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          onView={(inv) => {
            router.push(`/dashboard/purchase/material/invoice/view/${inv.id}`);
          }}
          onEdit={(inv) => {
            router.push(`/dashboard/purchase/material/invoice/${inv.id}/edit`);
          }}
          onDelete={handleDelete}
          onDebitNote={(inv) => {
            router.push(
              `/dashboard/purchase/material/debit-note/return/new?invoiceId=${inv.id}`
            );
          }}
          onDiscountDebitNote={(inv) => {
            router.push(
              `/dashboard/purchase/material/debit-note/discount/new?invoiceId=${inv.id}`
            );
          }}
        />
      </div>
    </DashboardLayout>
  );
}
