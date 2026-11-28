"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Download,
  FileText,
  Menu,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import DateRangePicker from "@/components/ui/DateRangePicker";
import {
  PurchaseReportPartyGroup,
  reportService,
} from "../services/report.service";

type PurchaseReportKey =
  | "party-statement"
  | "tds-deduction"
  | "outstanding-invoice"
  | "purchase-summary";

const REPORT_ITEMS: { key: PurchaseReportKey; label: string }[] = [
  { key: "party-statement", label: "Party Statement [Purchase]" },
  { key: "tds-deduction", label: "TDS Deduction Report" },
  { key: "outstanding-invoice", label: "Outstanding Invoice" },
  { key: "purchase-summary", label: "Purchase Summary" },
];

function parseFilterDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return undefined;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return undefined;
  return new Date(y, m - 1, d);
}

function fmtDate(val?: string | Date | null): string {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return format(d, "dd-MM-yyyy");
}

function fmtMoney(val: number): string {
  return `₹ ${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PurchaseReportView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const resolveKeyFromUrl = useCallback((): PurchaseReportKey | null => {
    const rep = searchParams.get("report");
    const found = REPORT_ITEMS.find((it) => it.key === rep);
    return found ? found.key : null;
  }, [searchParams]);

  // Automatically open Reports List drawer on page load
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedKey, setSelectedKey] = useState<PurchaseReportKey | null>(() =>
    resolveKeyFromUrl()
  );
  const [drawerSearch, setDrawerSearch] = useState("");
  const [partySearch, setPartySearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState<PurchaseReportPartyGroup[]>([]);
  const [grandTotal, setGrandTotal] = useState<Record<string, number>>({});
  const [expandedParties, setExpandedParties] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelectedKey(resolveKeyFromUrl());
  }, [resolveKeyFromUrl]);

  const selectedLabel =
    REPORT_ITEMS.find((it) => it.key === selectedKey)?.label || "";

  const fetchReport = useCallback(async () => {
    if (!selectedKey) {
      setParties([]);
      setGrandTotal({});
      return;
    }
    try {
      setLoading(true);
      const data = await reportService.getAccountReport("purchase-report", {
        reportKey: selectedKey,
        search: partySearch,
        startDate,
        endDate,
      });
      const fetchedParties = data.parties || [];
      setParties(fetchedParties);
      setGrandTotal(data.grandTotal || {});
      // Auto-expand first party for immediate visibility
      if (fetchedParties.length > 0) {
        setExpandedParties({ [fetchedParties[0].partyName]: true });
      } else {
        setExpandedParties({});
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load Purchase Report");
    } finally {
      setLoading(false);
    }
  }, [selectedKey, partySearch, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSelectReport = (key: PurchaseReportKey) => {
    const next = selectedKey === key ? null : key;
    setSelectedKey(next);
    if (!next) {
      router.replace(pathname, { scroll: false });
    } else {
      router.replace(`${pathname}?report=${next}`, { scroll: false });
    }
  };

  const toggleParty = (name: string) => {
    setExpandedParties((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleAllParties = () => {
    const allOpen = parties.length > 0 && parties.every((p) => expandedParties[p.partyName]);
    const next: Record<string, boolean> = {};
    parties.forEach((p) => {
      next[p.partyName] = !allOpen;
    });
    setExpandedParties(next);
  };

  const handleExportSummary = () => {
    if (parties.length === 0) {
      toast.info("No summary records to export.");
      return;
    }
    const rows = parties.map((p, idx) => ({
      "No.": idx + 1,
      "Party Name": p.partyName,
      Invoices: p.count,
      Qty: p.qty,
      "Taxable Amount": p.taxableAmount,
      SGST: p.sgst,
      CGST: p.cgst,
      IGST: p.igst,
      "Before TDS": p.beforeTds,
      TDS: p.tds,
      "Net Amount": p.netAmount,
      Paid: p.paidAmount,
      Balance: p.balanceAmount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
    XLSX.writeFile(wb, `purchase-${selectedKey}-summary-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Exported summary Excel.");
  };

  const handleExportDetail = () => {
    const allItems = parties.flatMap((p) => p.items || []);
    if (allItems.length === 0) {
      toast.info("No detail records to export.");
      return;
    }
    const rows = allItems.map((it, idx) => ({
      "No.": idx + 1,
      Date: fmtDate(it.date),
      "Party Name": it.partyName,
      "Party Bill No.": it.partyBillNo,
      "Invoice No.": it.invoiceNo,
      "Invoice Type": it.invoiceType,
      "Invoice For": it.invoiceFor,
      Qty: it.qty,
      "Taxable Amount": it.taxableAmount,
      SGST: it.sgst,
      CGST: it.cgst,
      IGST: it.igst,
      "Before TDS": it.beforeTds,
      TDS: it.tds,
      "Net Amount": it.netAmount,
      Paid: it.paidAmount,
      Balance: it.balanceAmount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detail");
    XLSX.writeFile(wb, `purchase-${selectedKey}-detail-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Exported detail Excel.");
  };

  const filteredReportItems = useMemo(() => {
    const q = drawerSearch.trim().toLowerCase();
    if (!q) return REPORT_ITEMS;
    return REPORT_ITEMS.filter((it) => it.label.toLowerCase().includes(q));
  }, [drawerSearch]);

  return (
    <DashboardLayout title="Purchase Report">
      <div className="w-full">
        {/* Unified Full-Width Container with Attached Sliding Right Drawer */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-140px)]">
          {/* Top Header Bar */}
          <div className="px-4 sm:px-6 py-4 border-b border-[#E7E0D2] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0F1626]">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white leading-snug">
                  Purchase Report
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Party wise purchase &amp; outstanding invoice(s).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen((p) => !p)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold hover:bg-[#FFF3D6] dark:hover:bg-[#262014] cursor-pointer transition shrink-0"
            >
              {drawerOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
              <span>Reports List</span>
            </button>
          </div>

          {/* Body Split: Main Panel + Attached Sliding Right Drawer */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left / Main Panel */}
            <div className="flex-1 min-w-0 flex flex-col bg-[#FEFAEE]/25 dark:bg-[#0B0F1A]">
              {!selectedKey ? (
                <div className="flex-1 grid place-items-center p-8 text-center">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Select a report from the Reports Menu to view its contents
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Selected Report Title + Filter & Export Toolbar */}
                  <div className="px-4 sm:px-6 py-3.5 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] space-y-3">
                    <h2 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
                      {selectedLabel}
                    </h2>

                    <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 max-w-xl">
                        <div className="space-y-1 min-w-0">
                          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Date range
                          </label>
                          <DateRangePicker
                            from={parseFilterDate(startDate)}
                            to={parseFilterDate(endDate)}
                            onChange={(range) => {
                              setStartDate(range.from ? format(range.from, "yyyy-MM-dd") : "");
                              setEndDate(range.to ? format(range.to, "yyyy-MM-dd") : "");
                            }}
                            onClear={() => {
                              setStartDate("");
                              setEndDate("");
                            }}
                            placeholder="Select date range"
                            className="w-full"
                            triggerClassName="w-full sm:w-full min-w-0 sm:min-w-0 h-9 sm:h-9 py-0 px-3 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11]"
                          />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Party name
                          </label>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={partySearch}
                              onChange={(e) => setPartySearch(e.target.value)}
                              placeholder="Party name..."
                              className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleExportSummary}
                          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#080B11] text-xs font-bold text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] cursor-pointer transition"
                        >
                          <Download className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                          <span>Export Summary</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportDetail}
                          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs font-bold text-[#0A0E1A] shadow-xs cursor-pointer transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Detail</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Party-wise Table */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[920px]">
                        <thead>
                          <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                            <th className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={toggleAllParties}
                                className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                                title="Expand / Collapse All"
                              >
                                <ChevronsUpDown className="w-3.5 h-3.5" />
                                <span>Party Name</span>
                              </button>
                            </th>
                            <th className="py-2.5 px-3 text-right">Qty</th>
                            <th className="py-2.5 px-3 text-right">Taxable Amount</th>
                            <th className="py-2.5 px-3 text-right">SGST</th>
                            <th className="py-2.5 px-3 text-right">CGST</th>
                            <th className="py-2.5 px-3 text-right">IGST</th>
                            <th className="py-2.5 px-3 text-right">Before TDS</th>
                            <th className="py-2.5 px-3 text-right">TDS</th>
                            <th className="py-2.5 px-3 text-right">Net Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
                          {loading ? (
                            <tr>
                              <td colSpan={9} className="py-16 text-center text-slate-400">
                                Loading {selectedLabel}...
                              </td>
                            </tr>
                          ) : parties.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-16 text-center text-slate-400">
                                No purchase records found for the selected filters.
                              </td>
                            </tr>
                          ) : (
                            parties.map((p) => {
                              const isOpen = Boolean(expandedParties[p.partyName]);
                              return (
                                <React.Fragment key={p.partyName}>
                                  <tr
                                    onClick={() => toggleParty(p.partyName)}
                                    className="bg-white dark:bg-[#0F1626] hover:bg-[#FFFDF7] dark:hover:bg-white/[0.03] cursor-pointer font-bold transition-colors"
                                  >
                                    <td className="py-3 px-3 whitespace-nowrap text-[#0A0E1A] dark:text-white">
                                      <span className="inline-flex items-center gap-2">
                                        {isOpen ? (
                                          <ChevronDown className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-slate-400" />
                                        )}
                                        <span>{p.partyName}</span>
                                        <span className="text-[11px] font-semibold text-slate-400">
                                          ({p.count})
                                        </span>
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono text-[#0A0E1A] dark:text-white">
                                      {p.qty}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono whitespace-nowrap text-[#0A0E1A] dark:text-white">
                                      {fmtMoney(p.taxableAmount)}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono whitespace-nowrap text-slate-600 dark:text-slate-300">
                                      {fmtMoney(p.sgst)}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono whitespace-nowrap text-slate-600 dark:text-slate-300">
                                      {fmtMoney(p.cgst)}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono whitespace-nowrap text-slate-600 dark:text-slate-300">
                                      {fmtMoney(p.igst)}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono whitespace-nowrap text-[#0A0E1A] dark:text-white">
                                      {fmtMoney(p.beforeTds)}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono whitespace-nowrap text-amber-600 dark:text-amber-400">
                                      {fmtMoney(p.tds)}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono whitespace-nowrap text-[#B88728] dark:text-[#E8C16D]">
                                      {fmtMoney(p.netAmount)}
                                    </td>
                                  </tr>

                                  {isOpen && (
                                    <tr>
                                      <td colSpan={9} className="p-3 bg-[#FEFAEE]/50 dark:bg-[#080B11]/80">
                                        <div className="overflow-x-auto rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]">
                                          <table className="w-full text-left border-collapse min-w-[880px]">
                                            <thead>
                                              <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-[10px] font-bold text-[#6A4D1D] dark:text-[#E8C16D] uppercase">
                                                <th className="py-2 px-3">Date</th>
                                                <th className="py-2 px-3">Party Bill No.</th>
                                                <th className="py-2 px-3">Invoice No</th>
                                                <th className="py-2 px-3">Invoice For</th>
                                                <th className="py-2 px-3 text-right">Qty</th>
                                                <th className="py-2 px-3 text-right">Taxable Amount</th>
                                                <th className="py-2 px-3 text-right">SGST</th>
                                                <th className="py-2 px-3 text-right">CGST</th>
                                                <th className="py-2 px-3 text-right">IGST</th>
                                                <th className="py-2 px-3 text-right">Before TDS</th>
                                                <th className="py-2 px-3 text-right">TDS</th>
                                                <th className="py-2 px-3 text-right">Net Amount</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-[11px]">
                                              {p.items.map((it) => (
                                                <tr key={it.id} className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02]">
                                                  <td className="py-2 px-3 font-mono whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                    {fmtDate(it.date)}
                                                  </td>
                                                  <td className="py-2 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                    {it.partyBillNo}
                                                  </td>
                                                  <td className="py-2 px-3 whitespace-nowrap">
                                                    <div className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                                                      {it.invoiceNo}
                                                    </div>
                                                    <div className="text-[10px] uppercase text-slate-400">
                                                      {it.invoiceType}
                                                    </div>
                                                  </td>
                                                  <td className="py-2 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                    {it.invoiceFor}
                                                  </td>
                                                  <td className="py-2 px-3 text-right font-mono font-semibold">
                                                    {it.qty}
                                                  </td>
                                                  <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                                                    {fmtMoney(it.taxableAmount)}
                                                  </td>
                                                  <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                                                    {fmtMoney(it.sgst)}
                                                  </td>
                                                  <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                                                    {fmtMoney(it.cgst)}
                                                  </td>
                                                  <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                                                    {fmtMoney(it.igst)}
                                                  </td>
                                                  <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                                                    {fmtMoney(it.beforeTds)}
                                                  </td>
                                                  <td className="py-2 px-3 text-right font-mono whitespace-nowrap text-amber-600 dark:text-amber-400">
                                                    {fmtMoney(it.tds)}
                                                  </td>
                                                  <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap text-[#B88728] dark:text-[#E8C16D]">
                                                    {fmtMoney(it.netAmount)}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                            <tfoot>
                                              <tr className="border-t border-[#E8C16D]/30 bg-[#FEFAEE]/70 dark:bg-[#080B11] text-[11px] font-bold">
                                                <td colSpan={4} className="py-2 px-3 text-center text-slate-500">
                                                  TOTAL
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono">{p.qty}</td>
                                                <td className="py-2 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(p.taxableAmount)}</td>
                                                <td className="py-2 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(p.sgst)}</td>
                                                <td className="py-2 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(p.cgst)}</td>
                                                <td className="py-2 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(p.igst)}</td>
                                                <td className="py-2 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(p.beforeTds)}</td>
                                                <td className="py-2 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(p.tds)}</td>
                                                <td className="py-2 px-3 text-right font-mono whitespace-nowrap text-[#B88728] dark:text-[#E8C16D]">
                                                  {fmtMoney(p.netAmount)}
                                                </td>
                                              </tr>
                                            </tfoot>
                                          </table>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                        {parties.length > 0 && (
                          <tfoot>
                            <tr className="border-t border-[#E8C16D]/40 bg-[#FEFAEE] dark:bg-[#080B11] text-xs font-bold">
                              <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">
                                total: {grandTotal.partyCount || parties.length}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">{grandTotal.qty || 0}</td>
                              <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(grandTotal.taxableAmount || 0)}</td>
                              <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(grandTotal.sgst || 0)}</td>
                              <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(grandTotal.cgst || 0)}</td>
                              <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(grandTotal.igst || 0)}</td>
                              <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(grandTotal.beforeTds || 0)}</td>
                              <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">{fmtMoney(grandTotal.tds || 0)}</td>
                              <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap text-[#B88728] dark:text-[#E8C16D]">
                                {fmtMoney(grandTotal.netAmount || 0)}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Attached Sliding Right-side Report List Drawer */}
            <aside
              aria-hidden={!drawerOpen}
              className={`shrink-0 bg-white dark:bg-[#0F1626] border-[#E7E0D2] dark:border-white/[0.08] overflow-hidden transition-all duration-300 ease-in-out ${
                drawerOpen
                  ? "w-full lg:w-72 xl:w-80 max-h-[640px] lg:max-h-none opacity-100 border-t lg:border-t-0 lg:border-l"
                  : "w-full lg:w-0 max-h-0 lg:max-h-none opacity-0 border-0 pointer-events-none"
              }`}
            >
              <div
                className={`w-full lg:w-72 xl:w-80 p-4 sm:p-5 space-y-3.5 transition-transform duration-300 ease-in-out ${
                  drawerOpen ? "translate-x-0" : "translate-x-4 lg:translate-x-full"
                }`}
              >
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
                    Report List
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {REPORT_ITEMS.length} reports available
                  </p>
                </div>

                {/* Search reports... */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder="Search reports..."
                    className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FEFAEE]/40 dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                  />
                </div>

                {/* 4 Report Items */}
                <div className="space-y-2">
                  {filteredReportItems.map((item) => {
                    const active = selectedKey === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelectReport(item.key)}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border text-left transition cursor-pointer ${
                          active
                            ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-white shadow-xs"
                            : "border-[#E7E0D2] dark:border-white/[0.08] bg-[#FEFAEE]/40 dark:bg-[#080B11] text-slate-600 dark:text-slate-300 hover:border-[#E8C16D]/60"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              active ? "text-[#B88728] dark:text-[#E8C16D]" : "text-slate-400"
                            }`}
                          />
                          <span className="text-xs font-semibold truncate">{item.label}</span>
                        </span>
                        {active && (
                          <Check className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D] shrink-0 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
