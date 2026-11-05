"use client";

import React from "react";
import { Plus, ReceiptText, X } from "lucide-react";
import DownloadDropdown, { DownloadOption } from "@/components/ui/DownloadDropdown";

interface InvoiceListHeaderProps {
  onAddNew: () => void;
  onDownloadDetail?: () => void;
  onDownloadAll?: () => void;
  onDownloadSummary?: () => void;
  onDownloadSkuWise?: () => void;
  onDownloadTally?: () => void;
  onCloseInvoice?: () => void;
}

export default function InvoiceListHeader({
  onAddNew,
  onDownloadDetail,
  onDownloadAll,
  onDownloadSummary,
  onDownloadSkuWise,
  onDownloadTally,
  onCloseInvoice,
}: InvoiceListHeaderProps) {
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
    ...(onDownloadAll
      ? [
          {
            id: "all",
            label: "Download",
            onClick: onDownloadAll,
          },
        ]
      : []),
    ...(onDownloadSummary
      ? [
          {
            id: "summary",
            label: "Download Summary",
            onClick: onDownloadSummary,
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
        {/* Title & Badge */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 max-w-2xl">
          <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            <ReceiptText className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>

          <div className="space-y-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white truncate">
              Sales Invoice
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
              Offline Sales / <span className="text-slate-700 dark:text-slate-300 font-semibold">Sales Invoice</span>
            </p>
          </div>
        </div>

        {/* Action Buttons with Download Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {downloadOptions.length > 0 && (
            <DownloadDropdown
              options={downloadOptions}
              label="Download"
            />
          )}

          {onCloseInvoice && (
            <button
              type="button"
              onClick={onCloseInvoice}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 transition-all shadow-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 ring-2 ring-rose-500/20 active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px]"
            >
              <X size={15} />
              <span>Close Invoice</span>
            </button>
          )}

          {/* New Invoice Button matching theme */}
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer min-h-[40px] sm:min-h-[44px] shrink-0"
          >
            <Plus size={18} />
            <span>New Invoice</span>
          </button>
        </div>
      </div>
    </section>
  );
}
