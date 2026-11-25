"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, Loader2, Plus, RotateCcw, Save, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import DateRangePicker from "@/components/ui/DateRangePicker";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import ReportPartySelect from "./ReportPartySelect";
import { salesInvoiceService } from "../../SalesInvoice/services/salesInvoice.service";
import type { SalesInvoice } from "../../SalesInvoice/types/salesInvoice.types";

interface GalleryCollectionReportModalProps {
  open: boolean;
  onClose: () => void;
}

interface CollectionRow {
  id: string;
  partyName: string;
  voucherNo: string;
  date: string;
  entryType: "Receipt" | "Payment";
  voucherType: string;
  credit: number;
  debit: number;
  cashVerified: boolean;
}

const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

interface CashVerifyRecord {
  id: string;
  date: string;
  startDate: string;
  endDate: string;
  denominations: Record<number, number>;
  countedTotal: number;
  openingBalance: number;
  cashCollection: number;
  upiCollection: number;
  moveToOffice: number;
  closingBalance: number;
  difference: number;
}

const CASH_VERIFY_STORAGE_KEY = "orderos_gallery_cash_verify_records";

export default function GalleryCollectionReportModal({
  open,
  onClose,
}: GalleryCollectionReportModalProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(() => {
    const today = new Date();
    return { from: today, to: today };
  });
  const [voucherTypeFilter, setVoucherTypeFilter] = useState("All");
  const [partyFilter, setPartyFilter] = useState("All");

  // Cash Verify Panel State (img-1 & img-2)
  const [cashVerifyOpen, setCashVerifyOpen] = useState(false);
  const [cashVerifyView, setCashVerifyView] = useState<"list" | "new">("list");
  const [savedCounts, setSavedCounts] = useState<CashVerifyRecord[]>([]);
  const [denomCounts, setDenomCounts] = useState<Record<number, string>>({});
  const [moveToOfficeInput, setMoveToOfficeInput] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CASH_VERIFY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedCounts(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, [open]);

  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : startDate;

  const { data: invoicesRes, isLoading } = useQuery({
    queryKey: ["gallery-collection-report", startDate, endDate],
    queryFn: () =>
      salesInvoiceService.getInvoices({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 500,
      }),
    enabled: open,
    staleTime: 0,
  });

  const collectionRows: CollectionRow[] = useMemo(() => {
    const invoices: SalesInvoice[] = invoicesRes?.data || [];
    const rows: CollectionRow[] = [];

    for (const inv of invoices) {
      const received = Number(inv.receivedAmount) || 0;
      const isReceipt = Boolean(inv.hasReceipt) || received > 0;
      if (!isReceipt) continue;

      const mode = (inv.receiptMode || (inv.bankName ? "Bank" : "Cash")).trim();
      const rawDate = (inv.transactionDate || inv.invoiceDate || inv.createdAt || "").slice(0, 10);

      rows.push({
        id: inv.id,
        partyName: inv.billingPartyName || inv.party?.partyName || "Walk-in Party",
        voucherNo: inv.invoiceNo || "-",
        date: rawDate,
        entryType: "Receipt",
        voucherType: mode,
        credit: received > 0 ? received : Number(inv.netAmount) || 0,
        debit: 0,
        cashVerified: mode.toLowerCase() === "cash",
      });
    }

    return rows;
  }, [invoicesRes]);

  const voucherTypeOptions = useMemo(() => {
    const set = new Set<string>(["All", "Bank", "Cash"]);
    collectionRows.forEach((r) => {
      if (r.voucherType) set.add(r.voucherType);
    });
    return Array.from(set).map((v) => ({ label: v, value: v }));
  }, [collectionRows]);

  const partyOptions = useMemo(() => {
    const set = new Set<string>(["All"]);
    collectionRows.forEach((r) => {
      if (r.partyName) set.add(r.partyName);
    });
    return Array.from(set).map((v) => ({ label: v, value: v }));
  }, [collectionRows]);

  const filteredRows = useMemo(() => {
    return collectionRows.filter((row) => {
      if (startDate && row.date && row.date < startDate) return false;
      if (endDate && row.date && row.date > endDate) return false;
      if (
        voucherTypeFilter !== "All" &&
        row.voucherType.toLowerCase() !== voucherTypeFilter.toLowerCase()
      ) {
        return false;
      }
      if (partyFilter !== "All" && row.partyName !== partyFilter) return false;
      return true;
    });
  }, [collectionRows, startDate, endDate, voucherTypeFilter, partyFilter]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.count += 1;
        acc.debit += r.debit;
        acc.credit += r.credit;
        return acc;
      },
      { count: 0, debit: 0, credit: 0 }
    );
  }, [filteredRows]);

  const netTotal = totals.credit - totals.debit;

  // Cash vs UPI/Bank Collection totals for Cash Verify -> New Count
  const cashCollectionTotal = useMemo(
    () =>
      filteredRows
        .filter((r) => r.voucherType.toLowerCase() === "cash")
        .reduce((sum, r) => sum + r.credit, 0),
    [filteredRows]
  );

  const upiCollectionTotal = useMemo(
    () =>
      filteredRows
        .filter((r) => r.voucherType.toLowerCase() !== "cash")
        .reduce((sum, r) => sum + r.credit, 0),
    [filteredRows]
  );

  const totalCollectionForVerify = cashCollectionTotal + upiCollectionTotal;
  const openingBalance = savedCounts.length > 0 && !editingRecordId ? savedCounts[0].closingBalance || 0 : 0;
  const totalCashBalance = openingBalance + cashCollectionTotal;
  const moveToOfficeNum = Math.max(0, Number(moveToOfficeInput) || 0);
  const closingBalance = totalCashBalance - moveToOfficeNum;

  const countedDenomTotal = useMemo(
    () =>
      DENOMINATIONS.reduce(
        (sum, d) => sum + d * Math.max(0, parseInt(denomCounts[d] || "0", 10) || 0),
        0
      ),
    [denomCounts]
  );

  const cashDifference = countedDenomTotal - closingBalance;

  const resetCountForm = () => {
    setDenomCounts({});
    setMoveToOfficeInput("");
    setEditingRecordId(null);
  };

  const handleOpenNewCount = () => {
    resetCountForm();
    setCashVerifyView("new");
  };

  const handleOpenExistingCount = (rec: CashVerifyRecord) => {
    const mapped: Record<number, string> = {};
    DENOMINATIONS.forEach((d) => {
      const val = rec.denominations?.[d] || 0;
      if (val > 0) mapped[d] = String(val);
    });
    setDenomCounts(mapped);
    setMoveToOfficeInput(rec.moveToOffice > 0 ? String(rec.moveToOffice) : "");
    setEditingRecordId(rec.id);
    setCashVerifyView("new");
  };

  const handleSaveCashCount = () => {
    const denomsNumeric: Record<number, number> = {};
    DENOMINATIONS.forEach((d) => {
      denomsNumeric[d] = Math.max(0, parseInt(denomCounts[d] || "0", 10) || 0);
    });

    const displayDate = dateRange.from
      ? format(dateRange.from, "dd-MM-yyyy")
      : format(new Date(), "dd-MM-yyyy");

    const record: CashVerifyRecord = {
      id: editingRecordId || `cv-${Date.now()}`,
      date: displayDate,
      startDate,
      endDate,
      denominations: denomsNumeric,
      countedTotal: countedDenomTotal,
      openingBalance,
      cashCollection: cashCollectionTotal,
      upiCollection: upiCollectionTotal,
      moveToOffice: moveToOfficeNum,
      closingBalance,
      difference: cashDifference,
    };

    const next = editingRecordId
      ? savedCounts.map((c) => (c.id === editingRecordId ? record : c))
      : [record, ...savedCounts];

    setSavedCounts(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CASH_VERIFY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
    }
    toast.success("Cash count saved successfully");
    setCashVerifyView("list");
    resetCountForm();
  };

  const rangeDisplayText =
    dateRange.from && dateRange.to
      ? `${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`
      : dateRange.from
        ? format(dateRange.from, "dd MMM yyyy")
        : format(new Date(), "dd MMM yyyy");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-5 font-sans"
      onClick={onClose}
    >
      <div
        className={`w-full h-[84vh] max-h-[760px] flex flex-col lg:flex-row gap-3 transition-all ${
          cashVerifyOpen
            ? cashVerifyView === "new"
              ? "max-w-[1380px]"
              : "max-w-[1260px]"
            : "max-w-6xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Main Modal: Collection Report */}
        <div className="flex-1 min-w-0 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E7E0D2]/80 dark:border-white/[0.08] space-y-3 bg-white dark:bg-[#0F1626]">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E7E0D2]/80 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#FFF9EC] dark:bg-[#F5C451]/15 border border-[#E8C16D]/40 dark:border-[#F5C451]/30 flex items-center justify-center text-[#B88728] dark:text-[#F5C451]">
                  <Wallet size={16} />
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Collection Report
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap xl:flex-nowrap items-end justify-between gap-2">
              <div className="shrink-0">
                <DateRangePicker
                  from={dateRange.from}
                  to={dateRange.to}
                  onChange={(range) => setDateRange(range)}
                  onClear={() => setDateRange({ from: undefined, to: undefined })}
                  triggerClassName="h-9 px-3 rounded-xl text-xs font-bold whitespace-nowrap"
                />
              </div>

              <div className="flex flex-wrap xl:flex-nowrap items-end gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Voucher Type
                  </label>
                  <ThemeSelectDropdown
                    value={voucherTypeFilter}
                    onChange={setVoucherTypeFilter}
                    options={voucherTypeOptions}
                    className="w-28"
                    buttonClassName="w-full h-9 px-2.5 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Party
                  </label>
                  <ReportPartySelect
                    value={partyFilter}
                    onChange={setPartyFilter}
                    extraPartyNames={partyOptions.map((p) => p.value).filter((v) => v !== "All")}
                    className="w-36"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCashVerifyOpen((prev) => !prev);
                    setCashVerifyView("list");
                  }}
                  className={`h-9 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    cashVerifyOpen
                      ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] shadow-xs"
                      : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] dark:hover:border-[#F5C451]"
                  }`}
                >
                  Cash Verified
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-2.5 bg-slate-50/50 dark:bg-[#080B11]">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 size={24} className="animate-spin text-[#E8C16D]" />
                <span className="text-xs font-semibold">Loading collection report...</span>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                <Wallet size={28} className="opacity-50" />
                <p className="text-xs font-semibold">No collection today</p>
              </div>
            ) : (
              filteredRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl sm:rounded-2xl border border-[#E7E0D2]/80 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-4 py-3 grid grid-cols-1 sm:grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr_0.6fr] gap-2 items-center text-xs shadow-2xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#0A0E1A] dark:text-white">
                      <span className="font-normal text-slate-500 dark:text-slate-400">Party. </span>
                      {row.partyName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Voucher No. {row.voucherNo} • {row.date}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="block text-[10px] text-slate-400">Entry Type</span>
                    <span className="font-bold">{row.entryType}</span>
                  </div>

                  <div className="sm:text-right">
                    <span className="block text-[10px] text-slate-400">Voucher Type</span>
                    <span className="font-bold">{row.voucherType}</span>
                  </div>

                  <div className="sm:text-right">
                    <span className="block text-[10px] text-slate-400">Credit</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {row.credit > 0
                        ? `₹ ${row.credit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr.`
                        : "-"}
                    </span>
                  </div>

                  <div className="sm:text-right">
                    <span className="block text-[10px] text-slate-400">Debit</span>
                    <span className="font-mono font-bold">
                      {row.debit > 0
                        ? `₹ ${row.debit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dr.`
                        : "-"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E7E0D2]/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0F1626]">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400 font-semibold">Vouchers</span>
                <span className="font-mono font-black text-base sm:text-lg">{totals.count}</span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/[0.08]" />
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Debit</span>
                <span className="font-mono font-black text-base sm:text-lg">
                  ₹ {totals.debit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dr.
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/[0.08]" />
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Credit</span>
                <span className="font-mono font-black text-base sm:text-lg">
                  ₹ {totals.credit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr.
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/[0.08]" />
              <div>
                <span className="block text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Amount</span>
                <span className="font-mono font-black text-base sm:text-lg text-[#B88728] dark:text-[#F5C451]">
                  ₹ {netTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <X size={14} />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Right Side Panel: Cash Verify (img-1) & New Count (img-2) */}
        {cashVerifyOpen && (
          <div
            className={`shrink-0 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white shadow-2xl flex flex-col overflow-hidden transition-all ${
              cashVerifyView === "new" ? "w-full lg:w-[560px]" : "w-full lg:w-[320px]"
            }`}
          >
            {cashVerifyView === "list" ? (
              <>
                {/* Cash Verify Header (img-1) */}
                <div className="px-4 py-3.5 border-b border-[#E7E0D2]/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black tracking-tight">Cash Verify</h3>
                  <button
                    type="button"
                    onClick={handleOpenNewCount}
                    className="h-8 px-3 rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-[#FFF9EC] dark:bg-[#F5C451]/15 hover:bg-[#FBECC8] dark:hover:bg-[#F5C451]/25 text-[#7A581F] dark:text-[#F5C451] text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={13} />
                    <span>New</span>
                  </button>
                </div>

                {/* Cash Verify Records List */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-2 bg-slate-50/40 dark:bg-[#080B11]">
                  {savedCounts.length === 0 ? (
                    <button
                      type="button"
                      onClick={handleOpenNewCount}
                      className="w-full px-4 py-3 rounded-xl border border-[#E7E0D2]/80 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] hover:border-[#E8C16D] flex items-center justify-between text-xs font-bold cursor-pointer transition-colors"
                    >
                      <span className="font-mono">
                        {dateRange.from
                          ? format(dateRange.from, "dd-MM-yyyy")
                          : format(new Date(), "dd-MM-yyyy")}
                      </span>
                      <span className="font-mono text-[#B88728] dark:text-[#F5C451]">
                        ₹ 0.00
                      </span>
                    </button>
                  ) : (
                    savedCounts.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => handleOpenExistingCount(rec)}
                        className="w-full px-4 py-3 rounded-xl border border-[#E7E0D2]/80 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] hover:border-[#E8C16D] flex items-center justify-between text-xs font-bold cursor-pointer transition-colors"
                      >
                        <span className="font-mono">{rec.date}</span>
                        <span className="font-mono text-[#B88728] dark:text-[#F5C451]">
                          ₹ {rec.countedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* New Count Header (img-2) */}
                <div className="px-4 py-3.5 border-b border-[#E7E0D2]/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-black tracking-tight shrink-0">New Count</h3>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {rangeDisplayText}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCashVerifyView("list")}
                    className="h-8 px-3 rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] hover:border-[#E8C16D] text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <ChevronLeft size={13} />
                    <span>Back</span>
                  </button>
                </div>

                {/* New Count Body: Denominations (Left) + Summary (Right) */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E7E0D2]/80 dark:divide-white/[0.08]">
                  {/* Left: Denomination Inputs */}
                  <div className="p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-2">
                      {DENOMINATIONS.map((denom) => {
                        const qty = Math.max(0, parseInt(denomCounts[denom] || "0", 10) || 0);
                        const rowTotal = denom * qty;
                        return (
                          <div
                            key={denom}
                            className="grid grid-cols-[44px_12px_68px_12px_1fr] items-center gap-1.5 text-xs"
                          >
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                              ₹{denom}
                            </span>
                            <span className="text-slate-400 text-center">×</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={denomCounts[denom] ?? ""}
                              onChange={(e) =>
                                setDenomCounts((prev) => ({
                                  ...prev,
                                  [denom]: e.target.value,
                                }))
                              }
                              placeholder="0"
                              className="h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#080B11] text-right font-mono font-bold text-xs outline-none focus:border-[#E8C16D]"
                            />
                            <span className="text-slate-400 text-center">=</span>
                            <span className="font-mono font-bold text-right">
                              ₹ {rowTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-[#E7E0D2]/80 dark:border-white/[0.08] flex items-center justify-between text-xs font-black">
                      <span>Total</span>
                      <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                        ₹ {countedDenomTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Right: Opening / Collection / Move to Office / Difference / Closing */}
                  <div className="p-4 space-y-3.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-600 dark:text-slate-300">Opening Balance</span>
                      <span className="font-mono">
                        ₹ {openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="rounded-xl border border-[#E7E0D2]/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#080B11] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Cash Collection</span>
                        <span className="font-mono font-bold">
                          ₹ {cashCollectionTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">UPI Collection</span>
                        <span className="font-mono font-bold">
                          ₹ {upiCollectionTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between font-bold">
                        <span>Total Collection</span>
                        <span className="font-mono">
                          ₹ {totalCollectionForVerify.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-600 dark:text-slate-300">Total Cash Balance</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        ₹ {totalCashBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E7E0D2]/60 dark:border-white/[0.06]">
                      <label className="font-bold text-slate-700 dark:text-slate-200">
                        Amount move to office
                      </label>
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={moveToOfficeInput}
                          onChange={(e) => setMoveToOfficeInput(e.target.value)}
                          placeholder="0"
                          className="w-full h-8 pl-6 pr-2.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#080B11] text-right font-mono font-bold text-xs outline-none focus:border-[#E8C16D]"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E7E0D2]/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold">Difference</span>
                        <span
                          className={`font-mono font-bold ${
                            cashDifference < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          ₹ {cashDifference.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-semibold">Closing Balance</span>
                        <span className="font-mono font-bold">
                          ₹ {closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* New Count Footer: Reset & Save */}
                <div className="px-4 py-3 border-t border-[#E7E0D2]/80 dark:border-white/[0.08] flex items-center justify-end gap-2 bg-white dark:bg-[#0F1626]">
                  <button
                    type="button"
                    onClick={resetCountForm}
                    className="h-9 px-3.5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCashCount}
                    className="h-9 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#dfb458] text-[#0A0E1A] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Save size={13} />
                    <span>Save</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
