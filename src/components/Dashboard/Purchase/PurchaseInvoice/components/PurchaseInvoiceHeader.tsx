"use client";

import React from "react";
import {
  FileText,
  Save,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import DownloadDropdown, { DownloadOption } from "@/components/ui/DownloadDropdown";

interface PurchaseInvoiceHeaderProps {
  invoiceNo?: string;
  isExisting: boolean;
  saving?: boolean;
  deleting?: boolean;
  onSave: () => void;
  onDelete?: () => void;
  onBack: () => void;
  onDownloadDetail?: () => void;
  onDownloadSkuWise?: () => void;
  onDownloadTally?: () => void;
}

export default function PurchaseInvoiceHeader({
  invoiceNo,
  isExisting,
  saving = false,
  deleting = false,
  onSave,
  onDelete,
  onBack,
  onDownloadDetail,
  onDownloadSkuWise,
  onDownloadTally,
}: PurchaseInvoiceHeaderProps) {
  const downloadOptions: DownloadOption[] = [
    ...(onDownloadDetail
      ? [
          {
            id: "detail",
            label: "Download Detail",
            onClick: onDownloadDetail,
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
    ...(onDownloadTally
      ? [
          {
            id: "tally",
            label: "Download [Tally]",
            onClick: onDownloadTally,
          },
        ]
      : []),
  ];

  return (
    <section className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Icon, Title & Breadcrumb */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Purchase Invoice
              </h1>
              {invoiceNo && (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-[#1A160E] text-[#E8C16D] border border-[#E8C16D]/60 shadow-2xs">
                  #{invoiceNo}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Purchase / Finish Goods • <span className="text-slate-700 dark:text-slate-300 font-medium">Purchase Invoice</span>
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Action Button: Back to List */}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
            <span>Back to List</span>
          </button>

          {/* Download Dropdown */}
          {downloadOptions.length > 0 && (
            <DownloadDropdown
              options={downloadOptions}
              label="Download"
            />
          )}

          {/* Action Button: Delete (only for existing saved invoices) */}
          {isExisting && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 transition-all shadow-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 ring-2 ring-rose-500/20 active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px] disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </button>
          )}

          {/* Action Button: Save */}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px] shrink-0 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Invoice"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
