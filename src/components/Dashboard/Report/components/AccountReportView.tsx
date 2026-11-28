"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calculator,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Filter,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { AccountReportType, reportService } from "../services/report.service";

interface AccountPageConfig {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  searchPlaceholder: string;
  statusPlaceholder: string;
  statusOptions: ThemeSelectOption[];
  showDateFilter: boolean;
}

const CONFIG: Record<AccountReportType, AccountPageConfig> = {
  "remuneration-salary": {
    title: "Remuneration & Salary",
    subtitle: "Employee salary structure, absent deductions, overtime & net payable summary",
    badge: "Payroll Report",
    icon: <Wallet className="h-5 w-5" />,
    searchPlaceholder: "Employee name, ID, dept...",
    statusPlaceholder: "Department",
    statusOptions: [
      { value: "All", label: "All" },
      { value: "Cutting", label: "Cutting" },
      { value: "Stitching", label: "Stitching" },
      { value: "Packing", label: "Packing" },
      { value: "Admin", label: "Admin" },
    ],
    showDateFilter: false,
  },
  "tally-export": {
    title: "Tally Export",
    subtitle: "Sales, Purchase, Credit Note & Debit Note vouchers formatted for Tally import",
    badge: "Accounting Export",
    icon: <Calculator className="h-5 w-5" />,
    searchPlaceholder: "Voucher no, party name...",
    statusPlaceholder: "Voucher Type",
    statusOptions: [
      { value: "All", label: "All" },
      { value: "Sales", label: "Sales" },
      { value: "Purchase", label: "Purchase" },
      { value: "Credit Note", label: "Credit Note" },
      { value: "Debit Note", label: "Debit Note" },
    ],
    showDateFilter: true,
  },
  "profit-loss": {
    title: "Profit & Loss Analysis",
    subtitle: "Net sales revenue, purchase costs, returns & active payroll margin analysis",
    badge: "P&L Statement",
    icon: <TrendingUp className="h-5 w-5" />,
    searchPlaceholder: "Search...",
    statusPlaceholder: "Status",
    statusOptions: [{ value: "All", label: "All" }],
    showDateFilter: true,
  },
  "purchase-report": {
    title: "Purchase Report",
    subtitle: "Consolidated Finish Goods & Material purchase bills, GST & payment summary",
    badge: "Purchase Ledger",
    icon: <ShoppingBag className="h-5 w-5" />,
    searchPlaceholder: "Invoice no, supplier...",
    statusPlaceholder: "Category",
    statusOptions: [
      { value: "All", label: "All" },
      { value: "Finish Goods", label: "Finish Goods" },
      { value: "Material & Service", label: "Material & Service" },
    ],
    showDateFilter: true,
  },
  "sales-report": {
    title: "Sales Reports",
    subtitle: "Offline sales invoices, taxable value, GST breakdown & collection summary",
    badge: "Sales Ledger",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    searchPlaceholder: "Invoice no, party...",
    statusPlaceholder: "Invoice Type",
    statusOptions: [
      { value: "All", label: "All" },
      { value: "Tax Invoice", label: "Tax Invoice" },
      { value: "Retail Invoice", label: "Retail Invoice" },
      { value: "Bill of Supply", label: "Bill of Supply" },
    ],
    showDateFilter: true,
  },
};

const LIMIT_OPTIONS: ThemeSelectOption[] = [
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
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

function fmtCurrency(val: number): string {
  const num = Number(val || 0);
  return `₹ ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AccountReportView({ type }: { type: AccountReportType }) {
  const cfg = CONFIG[type];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<Record<string, string | number>>({});
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportService.getAccountReport(type, {
        search,
        status: status || "All",
        startDate,
        endDate,
        page,
        limit,
      });
      setKpis(data.kpis || {});
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(err?.message || `Failed to load ${cfg.title}`);
    } finally {
      setLoading(false);
    }
  }, [type, search, status, startDate, endDate, page, limit, cfg.title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleExportCsv = () => {
    if (rows.length === 0) {
      toast.error("No rows to export.");
      return;
    }
    const headers = Object.keys(rows[0]).filter((k) => k !== "id");
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ];
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${cfg.title} exported to CSV.`);
  };

  const kpiCards = useMemo(() => {
    if (type === "remuneration-salary") {
      return [
        { label: "Total Employees", value: String(kpis.totalEmployees ?? 0), icon: <Users className="w-4 h-4" /> },
        { label: "Total Basic Salary", value: fmtCurrency(Number(kpis.totalBasic || 0)), icon: <Wallet className="w-4 h-4" /> },
        { label: "Absent Deductions", value: fmtCurrency(Number(kpis.totalDeduction || 0)), icon: <ReceiptText className="w-4 h-4" /> },
        { label: "Net Payable", value: fmtCurrency(Number(kpis.totalNetPayable || 0)), icon: <TrendingUp className="w-4 h-4" />, highlight: true },
      ];
    }
    if (type === "tally-export") {
      return [
        { label: "Total Vouchers", value: String(kpis.totalVouchers ?? 0), icon: <Calculator className="w-4 h-4" /> },
        { label: "Taxable Amount", value: fmtCurrency(Number(kpis.totalTaxable || 0)), icon: <ReceiptText className="w-4 h-4" /> },
        { label: "Total GST", value: fmtCurrency(Number(kpis.totalGst || 0)), icon: <FileSpreadsheet className="w-4 h-4" /> },
        { label: "Net Voucher Total", value: fmtCurrency(Number(kpis.totalNet || 0)), icon: <TrendingUp className="w-4 h-4" />, highlight: true },
      ];
    }
    if (type === "profit-loss") {
      return [
        { label: "Net Sales", value: fmtCurrency(Number(kpis.netSales || 0)), icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Net Purchases", value: fmtCurrency(Number(kpis.netPurchase || 0)), icon: <ShoppingBag className="w-4 h-4" /> },
        { label: "Payroll Expense", value: fmtCurrency(Number(kpis.payrollExpense || 0)), icon: <Users className="w-4 h-4" /> },
        {
          label: `Net Profit (${kpis.marginPct ?? 0}%)`,
          value: fmtCurrency(Number(kpis.netProfit || 0)),
          icon: <Wallet className="w-4 h-4" />,
          highlight: true,
        },
      ];
    }
    return [
      { label: "Total Invoices", value: String(kpis.totalInvoices ?? 0), icon: <FileSpreadsheet className="w-4 h-4" /> },
      { label: "Taxable Value", value: fmtCurrency(Number(kpis.totalTaxable || 0)), icon: <ReceiptText className="w-4 h-4" /> },
      { label: "Total GST", value: fmtCurrency(Number(kpis.totalGst || 0)), icon: <Calculator className="w-4 h-4" /> },
      { label: "Net Amount", value: fmtCurrency(Number(kpis.netAmount || 0)), icon: <TrendingUp className="w-4 h-4" />, highlight: true },
    ];
  }, [type, kpis]);

  const columns = useMemo(() => {
    if (type === "remuneration-salary") {
      return [
        { key: "no", label: "No." },
        { key: "employeeId", label: "Emp ID." },
        { key: "fullName", label: "Employee Name." },
        { key: "department", label: "Department." },
        { key: "designation", label: "Designation." },
        { key: "basicSalary", label: "Basic.", align: "right", currency: true },
        { key: "allowances", label: "Allowances.", align: "right", currency: true },
        { key: "deduction", label: "Deduction.", align: "right", currency: true },
        { key: "otPay", label: "OT Pay.", align: "right", currency: true },
        { key: "netPayable", label: "Net Payable.", align: "right", currency: true },
      ];
    }
    if (type === "tally-export") {
      return [
        { key: "no", label: "No." },
        { key: "date", label: "Date." },
        { key: "voucherType", label: "Voucher Type." },
        { key: "voucherNo", label: "Voucher No." },
        { key: "partyName", label: "Party Name." },
        { key: "gstin", label: "GSTIN." },
        { key: "taxableAmount", label: "Taxable.", align: "right", currency: true },
        { key: "totalGst", label: "GST.", align: "right", currency: true },
        { key: "netAmount", label: "Net Amount.", align: "right", currency: true },
      ];
    }
    if (type === "profit-loss") {
      return [
        { key: "no", label: "No." },
        { key: "particular", label: "Particulars." },
        { key: "category", label: "Category." },
        { key: "vouchersCount", label: "Count.", align: "right" },
        { key: "impact", label: "Impact." },
        { key: "amount", label: "Amount.", align: "right", currency: true },
      ];
    }
    if (type === "purchase-report") {
      return [
        { key: "no", label: "No." },
        { key: "date", label: "Date." },
        { key: "source", label: "Category." },
        { key: "invoiceNo", label: "Invoice No." },
        { key: "partyName", label: "Supplier." },
        { key: "qty", label: "Qty.", align: "right" },
        { key: "taxableAmount", label: "Taxable.", align: "right", currency: true },
        { key: "totalGst", label: "GST.", align: "right", currency: true },
        { key: "netAmount", label: "Net Amount.", align: "right", currency: true },
        { key: "status", label: "Status." },
      ];
    }
    return [
      { key: "no", label: "No." },
      { key: "date", label: "Date." },
      { key: "invoiceNo", label: "Invoice No." },
      { key: "invoiceType", label: "Type." },
      { key: "partyName", label: "Party." },
      { key: "qty", label: "Qty.", align: "right" },
      { key: "taxableAmount", label: "Taxable.", align: "right", currency: true },
      { key: "totalGst", label: "GST.", align: "right", currency: true },
      { key: "netAmount", label: "Net Amount.", align: "right", currency: true },
      { key: "status", label: "Status." },
    ];
  }, [type]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(total, page * limit);

  return (
    <DashboardLayout title={cfg.title}>
      <div className="w-full space-y-4">
        {/* Header Card */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
                {cfg.icon}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-xl font-bold text-[#0A0E1A] dark:text-white leading-snug">
                    {cfg.title}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-[#FFF9EC] text-[#B88728] border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                    {cfg.badge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {cfg.subtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={fetchData}
                className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-4 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] cursor-pointer transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D] ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {card.label}
                </p>
                <p
                  className={`mt-1 text-base sm:text-xl font-bold font-mono truncate ${
                    card.highlight
                      ? "text-[#B88728] dark:text-[#E8C16D]"
                      : "text-[#0A0E1A] dark:text-white"
                  }`}
                >
                  {card.value}
                </p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
                {card.icon}
              </div>
            </div>
          ))}
        </section>

        {/* Filter Bar */}
        {type !== "profit-loss" ? (
          <section className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder={cfg.searchPlaceholder}
                      className="w-full min-w-0 h-9 pl-8 pr-3 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <ThemeSelectDropdown
                    value={status}
                    onChange={(v) => {
                      setStatus(v);
                      setPage(1);
                    }}
                    options={cfg.statusOptions}
                    placeholder={cfg.statusPlaceholder}
                    showAllLabel
                    className="w-full"
                    buttonClassName={`w-full justify-between h-9 px-3 text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] ${
                      !status
                        ? "font-normal text-slate-400 dark:text-slate-400"
                        : "font-semibold text-[#0A0E1A] dark:text-white"
                    }`}
                  />
                </div>

                {cfg.showDateFilter && (
                  <div className="min-w-0">
                    <DateRangePicker
                      from={parseFilterDate(startDate)}
                      to={parseFilterDate(endDate)}
                      onChange={(range) => {
                        setStartDate(range.from ? format(range.from, "yyyy-MM-dd") : "");
                        setEndDate(range.to ? format(range.to, "yyyy-MM-dd") : "");
                        setPage(1);
                      }}
                      onClear={() => {
                        setStartDate("");
                        setEndDate("");
                        setPage(1);
                      }}
                      placeholder="Select Date"
                      className="w-full"
                      triggerClassName="w-full sm:w-full min-w-0 sm:min-w-0 h-9 sm:h-9 py-0 px-3 text-xs sm:text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11]"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-2.5">
            <div className="w-full sm:w-72">
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
                placeholder="Filter Period"
                className="w-full"
                triggerClassName="w-full sm:w-full min-w-0 sm:min-w-0 h-9 sm:h-9 py-0 px-3 text-xs sm:text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11]"
              />
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </section>
        )}

        {/* Data Table */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D] uppercase">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`py-3 px-3 whitespace-nowrap ${c.align === "right" ? "text-right" : ""}`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center text-slate-400">
                      Loading report data...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                          <ClipboardList className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          No records found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {columns.map((col) => {
                        if (col.key === "no") {
                          return (
                            <td key={col.key} className="py-2.5 px-3 font-mono text-slate-500">
                              {(page - 1) * limit + idx + 1}
                            </td>
                          );
                        }
                        const val = row[col.key];
                        if (col.key === "date") {
                          return (
                            <td key={col.key} className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                              {fmtDate(val)}
                            </td>
                          );
                        }
                        if (col.currency) {
                          const num = Number(val || 0);
                          return (
                            <td
                              key={col.key}
                              className={`py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap ${
                                num < 0
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-[#0A0E1A] dark:text-white"
                              }`}
                            >
                              {fmtCurrency(num)}
                            </td>
                          );
                        }
                        if (col.key === "voucherNo" || col.key === "invoiceNo" || col.key === "employeeId") {
                          return (
                            <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 text-[#B88728] dark:text-[#E8C16D] font-mono font-semibold">
                                {val || "—"}
                              </span>
                            </td>
                          );
                        }
                        return (
                          <td
                            key={col.key}
                            className={`py-2.5 px-3 whitespace-nowrap text-[#0A0E1A] dark:text-slate-200 ${
                              col.align === "right" ? "text-right font-mono font-semibold" : ""
                            }`}
                          >
                            {val ?? "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {type !== "profit-loss" && (
            <div className="px-4 py-3 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-[#FEFAEE]/60 dark:bg-[#080B11]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Showing <strong className="text-[#0A0E1A] dark:text-white">{startEntry}</strong> –{" "}
                <strong className="text-[#0A0E1A] dark:text-white">{endEntry}</strong> of{" "}
                <strong className="text-[#0A0E1A] dark:text-white">{total}</strong> entries
              </span>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Rows:</span>
                <ThemeSelectDropdown
                  value={String(limit)}
                  onChange={(v) => {
                    setLimit(Number(v) || 20);
                    setPage(1);
                  }}
                  options={LIMIT_OPTIONS}
                  buttonClassName="h-8 px-2.5 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]"
                />
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-3 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <span className="h-8 px-3 rounded-xl bg-[#E8C16D] text-[#0A0E1A] font-bold inline-flex items-center">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-3 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] font-semibold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
