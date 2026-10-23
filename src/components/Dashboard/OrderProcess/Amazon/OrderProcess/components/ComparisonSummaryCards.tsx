"use client";

import React from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { AmazonOrderSummary } from "../types";

export interface ComparisonSummaryCardsProps {
  summary: AmazonOrderSummary;
  printedCount: number;
  remainingMatchedCount: number;
  unmatchedPdfCount: number;
  unmatchedZplCount: number;
  onSelectPdfType: (type: "zpl" | "original" | "unmatched_pdf" | "unmatched_zpl") => void;
  onTabChange: (tab: "table" | "pdf") => void;
  onDownloadUnprintedExcel: () => void;
  onDownloadPrintedExcel: () => void;
}

export const ComparisonSummaryCards: React.FC<ComparisonSummaryCardsProps> = ({
  summary,
  printedCount,
  remainingMatchedCount,
  unmatchedPdfCount,
  unmatchedZplCount,
  onSelectPdfType,
  onTabChange,
  onDownloadUnprintedExcel,
  onDownloadPrintedExcel,
}) => {
  return (
    <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 border-t border-[#E7E0D2] pt-5 sm:pt-6">
      {/* Card 1: Total ZPL */}
      <article
        onClick={() => {
          onSelectPdfType("zpl");
          onTabChange("pdf");
        }}
        className="cursor-pointer rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between"
      >
        <div>
          <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
            ZPL Labels
          </p>

          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">
              {summary.totalZplLabels}
            </h3>

            <span className="rounded-xl border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
              Converted
            </span>
          </div>
        </div>
      </article>

      {/* Card 2: Total PDF Orders */}
      <article
        onClick={() => {
          onSelectPdfType("original");
          onTabChange("pdf");
        }}
        className="cursor-pointer rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between"
      >
        <div>
          <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
            PDF Orders
          </p>

          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">
              {summary.totalPdfOrders}
            </h3>

            <span className="rounded-xl border border-blue-200/60 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              {summary.totalPdfPages} pgs
            </span>
          </div>
        </div>
      </article>

      {/* Card 3: Matched Orders */}
      <article
        onClick={() => {
          onTabChange("table");
        }}
        className="cursor-pointer rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between sm:col-span-2 lg:col-span-1"
      >
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
              Matched Orders
            </p>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelectPdfType(unmatchedPdfCount > 0 ? "unmatched_pdf" : "unmatched_zpl");
                onTabChange("pdf");
              }}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold cursor-pointer transition ${summary.mismatchCount > 0
                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              title="Click to view unmatched documents in PDF viewer"
            >
              {summary.mismatchCount} Unmatched
            </span>
          </div>

          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">
              {printedCount > 0
                ? `${remainingMatchedCount} / ${summary.matchedCount}`
                : summary.matchedCount}
            </h3>

            <span className="rounded-xl border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
              {printedCount > 0
                ? `${printedCount} printed`
                : `${summary.matchPercentage}%`}
            </span>
          </div>
        </div>

        {/* Bottom Row: Improvised Sleek Excel Export Actions */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
            <span>Excel</span>
          </span>

          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadUnprintedExcel();
              }}
              disabled={remainingMatchedCount === 0}
              className="group relative inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-[#FFF9EC] hover:bg-[#FFF3D6] px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              title={`Download ${remainingMatchedCount} unprinted order(s) in Excel`}
            >
              <Download className="h-3 w-3 text-amber-700 group-hover:-translate-y-0.5 transition-transform" />
              <span>Unprinted</span>
              <span className="inline-flex items-center justify-center rounded-full bg-amber-200/90 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-950">
                {remainingMatchedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPrintedExcel();
              }}
              disabled={printedCount === 0}
              className="group relative inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              title={`Download ${printedCount} printed order(s) in Excel`}
            >
              <Download className="h-3 w-3 text-emerald-700 group-hover:-translate-y-0.5 transition-transform" />
              <span>Printed</span>
              <span className="inline-flex items-center justify-center rounded-full bg-emerald-200/90 px-1.5 py-0.2 text-[10px] font-extrabold text-emerald-950">
                {printedCount}
              </span>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};
