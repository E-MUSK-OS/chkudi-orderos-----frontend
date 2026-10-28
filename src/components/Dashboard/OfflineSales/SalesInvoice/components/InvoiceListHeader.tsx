"use client";

import React from "react";
import { Plus, Download, ReceiptText, X } from "lucide-react";
import Button from "@/components/ui/Button";

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
  return (
    <section className="rounded-3xl border border-[#E7E0D2] bg-white px-4 py-3.5 sm:px-6 sm:py-4 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Title & Badge */}
        <div className="flex items-center gap-3 sm:gap-3.5 shrink-0 min-w-0">
          <div className="grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-200/50 shrink-0 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-500/20">
            <ReceiptText className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div className="space-y-0.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A0E1A] dark:text-white truncate">
              Sales Invoice
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Offline Sales / <span className="text-teal-600 dark:text-teal-400 font-semibold">Sales Invoice</span>
            </p>
          </div>
        </div>

        {/* Action Buttons in single line matching legacy style */}
        <div className="flex items-center gap-1.5 xl:gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0 flex-nowrap">
          {onDownloadDetail && (
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 active:scale-[0.98]"
              leftIcon={<Download size={14} />}
              onClick={onDownloadDetail}
            >
              Download Detail
            </Button>
          )}

          {onDownloadAll && (
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 active:scale-[0.98]"
              leftIcon={<Download size={14} />}
              onClick={onDownloadAll}
            >
              Download
            </Button>
          )}

          {onDownloadSummary && (
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 active:scale-[0.98]"
              leftIcon={<Download size={14} />}
              onClick={onDownloadSummary}
            >
              Download Summary
            </Button>
          )}

          {onDownloadSkuWise && (
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 active:scale-[0.98]"
              leftIcon={<Download size={14} />}
              onClick={onDownloadSkuWise}
            >
              Download SKU Wise
            </Button>
          )}

          {onDownloadTally && (
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 active:scale-[0.98]"
              leftIcon={<Download size={14} />}
              onClick={onDownloadTally}
            >
              Download [Tally]
            </Button>
          )}

          {onCloseInvoice && (
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 active:scale-[0.98] border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20"
              leftIcon={<X size={14} />}
              onClick={onCloseInvoice}
            >
              Close Invoice
            </Button>
          )}

          {/* New Invoice Button matching Sales Challan (+ New Challan) */}
          <Button
            variant="primary"
            size="sm"
            fullWidth={false}
            className="h-9 px-3.5 sm:px-4 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 active:scale-[0.98] bg-[#F5C451] text-[#0A0E1A] hover:bg-[#E8C16D] border-none shadow-sm dark:bg-[#F5C451] dark:text-[#0A0E1A] dark:hover:bg-[#E8C16D]"
            leftIcon={<Plus size={16} />}
            onClick={onAddNew}
          >
            New Invoice
          </Button>
        </div>
      </div>
    </section>
  );
}
