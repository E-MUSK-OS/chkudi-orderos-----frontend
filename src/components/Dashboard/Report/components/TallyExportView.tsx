"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Calculator,
  Check,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Menu,
  X,
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { reportService } from "../services/report.service";

type TallyReportKey =
  | "purchase_expenses_service"
  | "material_purchase"
  | "bank_voucher"
  | "sales_invoice";

interface ReportGroup {
  group: string;
  department: string;
  items: { key: TallyReportKey; slug: string; label: string }[];
}

const REPORT_GROUPS: ReportGroup[] = [
  {
    group: "Purchase",
    department: "purchase",
    items: [
      {
        key: "purchase_expenses_service",
        slug: "purchase-expenses-service",
        label: "Purchase Expenses & Service",
      },
      {
        key: "material_purchase",
        slug: "material-purchase",
        label: "Material Purchase",
      },
    ],
  },
  {
    group: "Account",
    department: "account",
    items: [{ key: "bank_voucher", slug: "bank-voucher", label: "Bank Voucher" }],
  },
  {
    group: "Sales",
    department: "sales",
    items: [{ key: "sales_invoice", slug: "sales-invoice", label: "Sales Invoice" }],
  },
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
  return `₹ ${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TallyExportView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Resolve initial report from URL (?department=...&report=...) if present
  const resolveKeyFromUrl = useCallback((): TallyReportKey | null => {
    const rep = searchParams.get("report");
    if (!rep) return null;
    for (const grp of REPORT_GROUPS) {
      const found = grp.items.find((it) => it.slug === rep);
      if (found) return found.key;
    }
    return null;
  }, [searchParams]);

  // Automatically open Reports List drawer on page load
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedKey, setSelectedKey] = useState<TallyReportKey | null>(() =>
    resolveKeyFromUrl()
  );
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  useEffect(() => {
    const fromUrl = resolveKeyFromUrl();
    setSelectedKey(fromUrl);
  }, [resolveKeyFromUrl]);

  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [kpis, setKpis] = useState<Record<string, string | number>>({});

  const selectedLabel =
    REPORT_GROUPS.flatMap((g) => g.items).find((it) => it.key === selectedKey)?.label || "";

  const fetchPreview = useCallback(
    async (key: TallyReportKey, downloadAfter = false) => {
      try {
        setLoading(true);
        const data = await reportService.getAccountReport("tally-export", {
          reportKey: key,
          startDate,
          endDate,
          page: 1,
          limit: 500,
        });
        const fetchedRows = data.rows || [];
        setRows(fetchedRows);
        setKpis(data.kpis || {});
        setHasGenerated(true);

        if (downloadAfter) {
          if (fetchedRows.length === 0) {
            toast.info("No records found for the selected date range.");
            return;
          }
          const exportRows = fetchedRows.map((r, idx) => ({
            "No.": idx + 1,
            Date: fmtDate(r.date),
            "Voucher Type": r.voucherType || "",
            "Voucher No.": r.voucherNo || "",
            "Party Name": r.partyName || "",
            GSTIN: r.gstin || "-",
            ...(key === "bank_voucher" ? { "Bank / Mode": r.bankOrMode || "-" } : {}),
            "Taxable Amount": Number(r.taxableAmount || 0),
            CGST: Number(r.cgst || 0),
            SGST: Number(r.sgst || 0),
            IGST: Number(r.igst || 0),
            "Total GST": Number(r.totalGst || 0),
            "Net Amount": Number(r.netAmount || 0),
          }));
          const ws = XLSX.utils.json_to_sheet(exportRows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Tally Export");
          XLSX.writeFile(
            wb,
            `tally-${key}-${startDate || "all"}-to-${endDate || "all"}.xlsx`
          );
          toast.success(`${selectedLabel || "Tally"} Excel downloaded.`);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load Tally Export data");
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, selectedLabel]
  );

  // Auto-load records from DB whenever report selection or date range changes
  useEffect(() => {
    if (!selectedKey) {
      setRows([]);
      setKpis({});
      setHasGenerated(false);
      return;
    }
    fetchPreview(selectedKey, false);
  }, [selectedKey, startDate, endDate, fetchPreview]);

  const handleToggleReport = (key: TallyReportKey) => {
    const nextKey = selectedKey === key ? null : key;
    setSelectedKey(nextKey);
    if (!nextKey) {
      router.replace(pathname, { scroll: false });
      return;
    }
    for (const grp of REPORT_GROUPS) {
      const item = grp.items.find((it) => it.key === nextKey);
      if (item) {
        router.replace(
          `${pathname}?department=${grp.department}&report=${item.slug}`,
          { scroll: false }
        );
        break;
      }
    }
  };

  return (
    <DashboardLayout title="Tally Export">
      <div className="w-full">
        {/* Unified Full-Width Container with Attached Reports List Drawer */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-140px)]">
          {/* Top Header Bar */}
          <div className="px-4 sm:px-6 py-4 border-b border-[#E7E0D2] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0F1626]">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
                <Calculator className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white leading-snug">
                  Tally Export
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tally Export Report
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen((p) => !p)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold hover:bg-[#FFF3D6] dark:hover:bg-[#262014] cursor-pointer transition shrink-0"
            >
              <span>Reports List</span>
              {drawerOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Body Split: Main Panel + Sliding Attached Right Drawer */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left / Main Panel */}
            <div className="flex-1 min-w-0 flex flex-col bg-[#FEFAEE]/25 dark:bg-[#0B0F1A]">
              {!selectedKey ? (
                <div className="flex-1 grid place-items-center p-8 text-center">
                  <div className="flex flex-col items-center gap-2.5 text-slate-400">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Select a report from the Reports Menu to view its contents
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Selected Report Title Row */}
                  <div className="px-4 sm:px-6 py-3.5 border-b border-[#E7E0D2] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 bg-white/60 dark:bg-[#0F1626]/60">
                    <h2 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
                      {selectedLabel}
                    </h2>
                    {hasGenerated && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40">
                        {rows.length} Vouchers · {fmtCurrency(Number(kpis.totalNet || 0))}
                      </span>
                    )}
                  </div>

                  {/* Date Range + Generate Excel Bordered Strip */}
                  <div className="px-4 sm:px-6 py-3 border-b border-[#E7E0D2] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0F1626]">
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
                        placeholder="Select Date Range"
                        className="w-full"
                        triggerClassName="w-full sm:w-full min-w-0 sm:min-w-0 h-9 sm:h-9 py-0 px-3 text-xs rounded-xl border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11]"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => fetchPreview(selectedKey, true)}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs font-bold text-[#0A0E1A] shadow-xs cursor-pointer disabled:opacity-50 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{loading ? "Generating..." : "Generate Excel"}</span>
                    </button>
                  </div>

                  {/* Database Table Preview */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col">
                    {loading ? (
                      <div className="flex-1 grid place-items-center py-16 text-xs text-slate-400">
                        Loading {selectedLabel} records...
                      </div>
                    ) : rows.length === 0 ? (
                      <div className="flex-1 grid place-items-center py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                            <ClipboardList className="h-5 w-5" />
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Select a date range, then click &ldquo;Generate Excel&rdquo; to download excel
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626]">
                        <table className="w-full text-left border-collapse min-w-[780px]">
                          <thead>
                            <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D] uppercase">
                              <th className="py-2.5 px-3">No.</th>
                              <th className="py-2.5 px-3">Date.</th>
                              <th className="py-2.5 px-3">Voucher Type.</th>
                              <th className="py-2.5 px-3">Voucher No.</th>
                              <th className="py-2.5 px-3">Party Name.</th>
                              <th className="py-2.5 px-3">GSTIN.</th>
                              <th className="py-2.5 px-3 text-right">Taxable.</th>
                              <th className="py-2.5 px-3 text-right">GST.</th>
                              <th className="py-2.5 px-3 text-right">Net Amount.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
                            {rows.map((r, idx) => (
                              <tr
                                key={r.id || idx}
                                className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02]"
                              >
                                <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-mono whitespace-nowrap text-slate-600 dark:text-slate-300">
                                  {fmtDate(r.date)}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-[#0A0E1A] dark:text-slate-200">
                                  {r.voucherType}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 text-[#B88728] dark:text-[#E8C16D] font-mono font-semibold">
                                    {r.voucherNo}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap text-[#0A0E1A] dark:text-white font-medium">
                                  {r.partyName}
                                </td>
                                <td className="py-2.5 px-3 font-mono whitespace-nowrap text-slate-500">
                                  {r.gstin || "-"}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap text-[#0A0E1A] dark:text-slate-200">
                                  {fmtCurrency(Number(r.taxableAmount || 0))}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap text-[#0A0E1A] dark:text-slate-200">
                                  {fmtCurrency(Number(r.totalGst || 0))}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap text-[#B88728] dark:text-[#E8C16D]">
                                  {fmtCurrency(Number(r.netAmount || 0))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Attached Sliding Right-side Reports List Drawer */}
            <aside
              aria-hidden={!drawerOpen}
              className={`shrink-0 bg-white dark:bg-[#0F1626] border-[#E7E0D2] dark:border-white/[0.08] overflow-hidden transition-all duration-300 ease-in-out ${
                drawerOpen
                  ? "w-full lg:w-72 xl:w-80 max-h-[640px] lg:max-h-none opacity-100 border-t lg:border-t-0 lg:border-l"
                  : "w-full lg:w-0 max-h-0 lg:max-h-none opacity-0 border-0 pointer-events-none"
              }`}
            >
              <div
                className={`w-full lg:w-72 xl:w-80 p-4 sm:p-5 space-y-4 transition-transform duration-300 ease-in-out ${
                  drawerOpen ? "translate-x-0" : "translate-x-4 lg:translate-x-full"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
                    Reports List
                  </h2>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    aria-label="Close Reports List"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {REPORT_GROUPS.map((grp) => (
                    <div
                      key={grp.group}
                      className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FEFAEE]/60 dark:bg-[#080B11] p-3.5 space-y-2.5"
                    >
                      <p className="text-xs font-bold text-[#6A4D1D] dark:text-[#E8C16D] pb-2 border-b border-[#F5E6BE] dark:border-white/[0.08]">
                        {grp.group}
                      </p>
                      <div className="space-y-2">
                        {grp.items.map((item) => {
                          const checked = selectedKey === item.key;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => handleToggleReport(item.key)}
                              className="w-full flex items-center gap-2.5 text-left group cursor-pointer"
                            >
                              <span
                                className={`grid h-4 w-4 place-items-center rounded border transition shrink-0 ${
                                  checked
                                    ? "bg-[#E8C16D] border-[#E8C16D] text-[#0A0E1A]"
                                    : "border-slate-300 dark:border-white/[0.2] bg-white dark:bg-[#0F1626] group-hover:border-[#E8C16D]"
                                }`}
                              >
                                {checked && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                              <span
                                className={`text-xs transition ${
                                  checked
                                    ? "font-bold text-[#0A0E1A] dark:text-white"
                                    : "font-medium text-slate-600 dark:text-slate-300 group-hover:text-[#0A0E1A] dark:group-hover:text-white"
                                }`}
                              >
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
