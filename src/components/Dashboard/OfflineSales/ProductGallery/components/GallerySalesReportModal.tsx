"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, FileText, Loader2, ReceiptText, X } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import ReportPartySelect from "./ReportPartySelect";
import { salesInvoiceService } from "../../SalesInvoice/services/salesInvoice.service";
import type { SalesInvoice } from "../../SalesInvoice/types/salesInvoice.types";

interface GallerySalesReportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GallerySalesReportModal({
  open,
  onClose,
}: GallerySalesReportModalProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>(() => {
    const today = new Date();
    return { from: today, to: today };
  });
  const [invoiceType, setInvoiceType] = useState("All");
  const [partyFilter, setPartyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"Summary" | "Detail">("Summary");

  const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "";
  const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : startDate;
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: invoicesRes, isLoading } = useQuery({
    queryKey: ["gallery-sales-report", startDate, endDate],
    queryFn: () =>
      salesInvoiceService.getInvoices({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 500,
      }),
    enabled: open,
    staleTime: 0,
  });

  const allInvoices: SalesInvoice[] = useMemo(
    () => invoicesRes?.data || [],
    [invoicesRes]
  );

  const invoiceTypeOptions = useMemo(() => {
    const set = new Set<string>(["All"]);
    allInvoices.forEach((inv) => {
      if (inv.invoiceType) set.add(inv.invoiceType);
    });
    return Array.from(set).map((v) => ({ label: v, value: v }));
  }, [allInvoices]);

  const partyOptions = useMemo(() => {
    const set = new Set<string>(["All"]);
    allInvoices.forEach((inv) => {
      const name = inv.billingPartyName || inv.party?.partyName;
      if (name) set.add(name);
    });
    return Array.from(set).map((v) => ({ label: v, value: v }));
  }, [allInvoices]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>(["All"]);
    allInvoices.forEach((inv) => {
      if (inv.status) set.add(inv.status);
    });
    return Array.from(set).map((v) => ({ label: v, value: v }));
  }, [allInvoices]);

  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      const invDate = (inv.invoiceDate || inv.createdAt || "").slice(0, 10);
      if (startDate && invDate && invDate < startDate) return false;
      if (endDate && invDate && invDate > endDate) return false;
      if (invoiceType !== "All" && inv.invoiceType !== invoiceType) return false;
      const pName = inv.billingPartyName || inv.party?.partyName || "";
      if (partyFilter !== "All" && pName !== partyFilter) return false;
      if (statusFilter !== "All" && inv.status !== statusFilter) return false;
      return true;
    });
  }, [allInvoices, startDate, endDate, invoiceType, partyFilter, statusFilter]);

  const totals = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, inv) => {
        acc.count += 1;
        acc.qty += Number(inv.totalQuantity) || 0;
        acc.amount += Number(inv.netAmount) || 0;
        return acc;
      },
      { count: 0, qty: 0, amount: 0 }
    );
  }, [filteredInvoices]);

  const handleDownloadCsv = () => {
    const headers = [
      "Invoice No",
      "Date",
      "Invoice Type",
      "Party",
      "Status",
      "Total Qty",
      "Net Amount",
    ];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNo,
      (inv.invoiceDate || inv.createdAt || "").slice(0, 10),
      inv.invoiceType || "",
      inv.billingPartyName || inv.party?.partyName || "",
      inv.status || "",
      String(inv.totalQuantity || 0),
      String(inv.netAmount || 0),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${startDate || "all"}-to-${endDate || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-5 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-[84vh] max-h-[760px] rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-[#E7E0D2]/80 dark:border-white/[0.08] space-y-3 bg-white dark:bg-[#0F1626]">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E7E0D2]/80 dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#FFF9EC] dark:bg-[#F5C451]/15 border border-[#E8C16D]/40 dark:border-[#F5C451]/30 flex items-center justify-center text-[#B88728] dark:text-[#F5C451]">
                <ReceiptText size={16} />
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Sales Report
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

          <div className="flex flex-wrap lg:flex-nowrap items-end justify-between gap-2">
            <div className="shrink-0">
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onChange={(range) => setDateRange(range)}
                onClear={() => setDateRange({ from: undefined, to: undefined })}
                triggerClassName="h-9 px-3 rounded-xl text-xs font-bold whitespace-nowrap"
              />
            </div>

            <div className="flex flex-wrap lg:flex-nowrap items-end gap-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Invoice Type
                </label>
                <ThemeSelectDropdown
                  value={invoiceType}
                  onChange={setInvoiceType}
                  options={invoiceTypeOptions}
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

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Status
                </label>
                <ThemeSelectDropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                  className="w-24"
                  buttonClassName="w-full h-9 px-2.5 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1 shrink-0">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  View
                </label>
                <div className="h-9 p-0.5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] inline-flex items-center">
                  {(["Summary", "Detail"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`h-full px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode === mode
                          ? "bg-[#E8C16D] text-[#0A0E1A] shadow-2xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-[#0A0E1A] dark:hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] hover:border-[#E8C16D] dark:hover:border-[#F5C451] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
              >
                <Download size={13} className="text-[#B88728] dark:text-[#F5C451]" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5 bg-slate-50/50 dark:bg-[#080B11]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin text-[#E8C16D]" />
              <span className="text-xs font-semibold">Loading sales report...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
              <FileText size={28} className="opacity-50" />
              <p className="text-xs font-semibold">
                {startDate === todayStr && endDate === todayStr
                  ? "No sales today"
                  : "No sales in selected range"}
              </p>
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl sm:rounded-2xl border border-[#E7E0D2]/80 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-4 py-3 space-y-2 shadow-2xs"
              >
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center text-xs">
                  <div>
                    <p className="font-bold text-[#0A0E1A] dark:text-white">
                      {inv.billingPartyName || inv.party?.partyName || "Walk-in Party"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      #{inv.invoiceNo} • {(inv.invoiceDate || inv.createdAt || "").slice(0, 10)}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Invoice Type</span>
                    <span className="font-semibold">{inv.invoiceType || "Sales"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Status</span>
                    <span className="font-semibold">{inv.status || "—"}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400">Qty</span>
                    <span className="font-mono font-bold">{inv.totalQuantity || 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400">Amount</span>
                    <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                      ₹ {Number(inv.netAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {viewMode === "Detail" && Array.isArray(inv.items) && inv.items.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-1">
                    {inv.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300"
                      >
                        <span className="font-mono truncate">
                          {item.sku} — {item.particular}
                        </span>
                        <span className="font-mono shrink-0 ml-2">
                          {item.quantity} × ₹{Number(item.rate || 0).toLocaleString("en-IN")} = ₹{Number(item.total || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E7E0D2]/80 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0F1626]">
          <div className="flex items-center gap-6">
            <div>
              <span className="block text-xs text-slate-500 dark:text-slate-400 font-semibold">Invoices</span>
              <span className="font-mono font-black text-base sm:text-lg">{totals.count}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-white/[0.08]" />
            <div>
              <span className="block text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Qty</span>
              <span className="font-mono font-black text-base sm:text-lg">{totals.qty}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-white/[0.08]" />
            <div>
              <span className="block text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Amount</span>
              <span className="font-mono font-black text-base sm:text-lg text-[#B88728] dark:text-[#F5C451]">
                ₹ {totals.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    </div>
  );
}
