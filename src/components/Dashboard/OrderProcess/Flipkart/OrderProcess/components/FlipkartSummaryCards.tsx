"use client";

import React from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { FlipkartOrderSummary, FlipkartPdfViewType } from "../types";

export interface FlipkartSummaryCardsProps {
  summary: FlipkartOrderSummary;
  printedCount: number;
  remainingCount: number;
  onSelectPdfType: (type: FlipkartPdfViewType) => void;
  onTabChange: (tab: "table" | "pdf") => void;
  onDownloadUnprintedExcel: () => void;
  onDownloadPrintedExcel: () => void;
}

export const FlipkartSummaryCards: React.FC<FlipkartSummaryCardsProps> = ({
  summary,
  printedCount,
  remainingCount,
  onSelectPdfType,
  onTabChange,
  onDownloadUnprintedExcel,
  onDownloadPrintedExcel,
}) => {
  const printedPercentage =
    summary.totalOrders > 0
      ? Math.round((printedCount / summary.totalOrders) * 100)
      : 0;

  return (
    <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 border-t border-[#E7E0D2] dark:border-white/[0.08] pt-5 sm:pt-6">
      {/* Card 1: 4"x6" Thermal Shipping Labels */}
      <article
        onClick={() => {
          onSelectPdfType("shipping_labels");
          onTabChange("pdf");
        }}
        className="cursor-pointer rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
      >
        <div>
          <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Shipping Labels
          </p>

          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white">
              {summary.totalOrders}
            </h3>

            <span className="rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
              4&quot; x 6&quot; Ready
            </span>
          </div>
        </div>
      </article>

      {/* Card 2: Tax Invoices */}
      <article
        onClick={() => {
          onSelectPdfType("tax_invoices");
          onTabChange("pdf");
        }}
        className="cursor-pointer rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
      >
        <div>
          <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tax Invoices
          </p>

          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white">
              {summary.totalOrders}
            </h3>

            <span className="rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
              {summary.totalOrders} pgs
            </span>
          </div>
        </div>
      </article>

      {/* Card 3: Processed / Printed Orders + Sleek Excel Actions */}
      <article
        onClick={() => {
          onTabChange("table");
        }}
        className="cursor-pointer rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between sm:col-span-2 lg:col-span-1"
      >
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Printed Orders
            </p>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelectPdfType("shipping_labels");
                onTabChange("pdf");
              }}
              className="rounded-xl px-2.5 py-1 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 cursor-pointer transition hover:opacity-85"
            >
              100% Prepared
            </span>
          </div>

          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white">
              {printedCount > 0
                ? `${remainingCount} / ${summary.totalOrders}`
                : summary.totalOrders}
            </h3>

            <span className="rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {printedCount > 0
                ? `${printedCount} printed`
                : `${printedPercentage}%`}
            </span>
          </div>
        </div>

        {/* Bottom Row: Improvised Sleek Excel Export Actions */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <span>Excel</span>
          </span>

          <div className="inline-flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadUnprintedExcel();
              }}
              disabled={remainingCount === 0}
              className="group relative inline-flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-[#FFF9EC] dark:bg-[#1A160E] hover:bg-[#FFF3D6] dark:hover:bg-[#251E11] px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-amber-900 dark:text-amber-200 shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              title={`Download ${remainingCount} unprinted order(s) in Excel`}
            >
              <Download className="h-3 w-3 text-amber-700 dark:text-amber-400 group-hover:-translate-y-0.5 transition-transform" />
              <span>Unprinted</span>
              <span className="inline-flex items-center justify-center rounded-full bg-amber-200/90 dark:bg-amber-900/60 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-950 dark:text-amber-200">
                {remainingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPrintedExcel();
              }}
              disabled={printedCount === 0}
              className="group relative inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-emerald-900 dark:text-emerald-200 shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              title={`Download ${printedCount} printed order(s) in Excel`}
            >
              <Download className="h-3 w-3 text-emerald-700 dark:text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
              <span>Printed</span>
              <span className="inline-flex items-center justify-center rounded-full bg-emerald-200/90 dark:bg-emerald-900/60 px-1.5 py-0.2 text-[10px] font-extrabold text-emerald-950 dark:text-emerald-200">
                {printedCount}
              </span>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};
