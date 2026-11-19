"use client";

import React from "react";
import {
  X,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Printer,
  Loader2,
  Package,
  Boxes,
  CheckCircle2,
} from "lucide-react";
import Button from "@/components/ui/Button";

export interface FlipcartPicklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCount: number;
  totalOrders: number;
  isSelectionActive: boolean;
  isGenerating: boolean;
  onAction: (action: "excel" | "pdf_download" | "pdf_open" | "tab_open") => Promise<void>;
  pdfFileName?: string | null;
}

export default function FlipcartPicklistModal({
  isOpen,
  onClose,
  targetCount,
  totalOrders,
  isSelectionActive,
  isGenerating,
  onAction,
  pdfFileName,
}: FlipcartPicklistModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
                Generate Flipkart Picklist
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {pdfFileName || "Flipkart Batch"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Target Scope Badge */}
        <div className="rounded-2xl border border-[#E8C16D]/30 bg-[#FFF9EC] dark:bg-[#1A160E]/50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
            <span className="text-xs sm:text-sm font-semibold text-[#6A4D1D] dark:text-[#E8C16D]">
              {isSelectionActive
                ? `Selected Orders: ${targetCount} of ${totalOrders}`
                : `Target: All Unprinted Orders (${targetCount})`}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Ready to Pick
          </span>
        </div>

        {/* Picklist Format Options */}
        <div className="space-y-2.5">
          {/* 1. Excel Picklist (Primary recommended) */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onAction("excel")}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] dark:hover:border-[#E8C16D] bg-slate-50/50 hover:bg-[#FFF9EC] dark:bg-white/[0.02] dark:hover:bg-[#1A160E] transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0A0E1A] dark:text-white group-hover:text-[#B88728] dark:group-hover:text-[#E8C16D] transition-colors flex items-center gap-1.5">
                  Excel Picklist (.xlsx)
                  <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    Recommended
                  </span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  2-Column 40 left / 40 right A4 layout with Rack Addresses & quantities.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              Download →
            </span>
          </button>

          {/* 2. PDF Download */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onAction("pdf_download")}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] dark:hover:border-[#E8C16D] bg-slate-50/50 hover:bg-[#FFF9EC] dark:bg-white/[0.02] dark:hover:bg-[#1A160E] transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0A0E1A] dark:text-white group-hover:text-[#B88728] dark:group-hover:text-[#E8C16D] transition-colors">
                  PDF Picklist (.pdf)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Print-ready PDF formatted with SKU, Rack, and check boxes.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              Download →
            </span>
          </button>

          {/* 3. Open PDF in Browser */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onAction("pdf_open")}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] dark:hover:border-[#E8C16D] bg-slate-50/50 hover:bg-[#FFF9EC] dark:bg-white/[0.02] dark:hover:bg-[#1A160E] transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 group-hover:scale-105 transition-transform">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0A0E1A] dark:text-white group-hover:text-[#B88728] dark:group-hover:text-[#E8C16D] transition-colors">
                  Preview PDF Picklist
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Open PDF picklist in a new browser tab for quick inspection.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              Open →
            </span>
          </button>

          {/* 4. Interactive Picking Tab */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onAction("tab_open")}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] hover:border-[#E8C16D] dark:hover:border-[#E8C16D] bg-slate-50/50 hover:bg-[#FFF9EC] dark:bg-white/[0.02] dark:hover:bg-[#1A160E] transition-all group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 group-hover:scale-105 transition-transform">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0A0E1A] dark:text-white group-hover:text-[#B88728] dark:group-hover:text-[#E8C16D] transition-colors">
                  Interactive Print Tab
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct browser print dialog with live item-checking.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              Launch →
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
            className="rounded-2xl px-5 text-xs sm:text-sm font-semibold"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
