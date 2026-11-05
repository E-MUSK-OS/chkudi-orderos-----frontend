"use client";

import React from "react";
import { Plus, Save, ArrowLeft, FileSpreadsheet, Download } from "lucide-react";
import DownloadDropdown, { DownloadOption } from "@/components/ui/DownloadDropdown";

interface PurchaseChallanHeaderProps {
  viewMode: "list" | "create" | "edit";
  onAddNew?: () => void;
  onBack?: () => void;
  onSave?: () => void;
  onDownloadAll?: () => void;
  onDownloadSkuWise?: () => void;
  saving?: boolean;
}

export default function PurchaseChallanHeader({
  viewMode,
  onAddNew,
  onBack,
  onSave,
  onDownloadAll,
  onDownloadSkuWise,
  saving = false,
}: PurchaseChallanHeaderProps) {
  const downloadOptions: DownloadOption[] = [
    ...(onDownloadAll
      ? [
          {
            id: "all",
            label: "Download",
            onClick: onDownloadAll,
          },
        ]
      : []),
    ...(onDownloadSkuWise
      ? [
          {
            id: "sku-wise",
            label: "Download SKU Wise",
            onClick: onDownloadSkuWise,
          },
        ]
      : []),
  ];

  return (
    <section className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Title & Badge */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 max-w-2xl">
          <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            <FileSpreadsheet className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
              {viewMode === "create"
                ? "Create Purchase Challan"
                : viewMode === "edit"
                ? "Edit Purchase Challan"
                : "Purchase Challan"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {viewMode === "list"
                ? "Purchase • Finish Goods • Manage inward purchase delivery notes, suppliers, and dispatches."
                : "Enter inward shipment details, creditor supplier, item quantities, and stock godown."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {viewMode === "list" ? (
            <>
              {downloadOptions.length > 0 && (
                <DownloadDropdown
                  options={downloadOptions}
                  label="Download"
                />
              )}

              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px] shrink-0"
              >
                <Plus size={18} />
                <span>New Challan</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px]"
              >
                <ArrowLeft size={16} className="text-[#B88728] dark:text-[#E8C16D]" />
                <span>Back to List</span>
              </button>

              {onDownloadAll && (
                <button
                  type="button"
                  onClick={onDownloadAll}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px]"
                >
                  <Download size={16} className="text-[#B88728] dark:text-[#E8C16D]" />
                  <span>Export</span>
                </button>
              )}

              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px] shrink-0 disabled:opacity-50"
              >
                <Save size={18} />
                <span>{saving ? "Saving..." : "Save Challan"}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
