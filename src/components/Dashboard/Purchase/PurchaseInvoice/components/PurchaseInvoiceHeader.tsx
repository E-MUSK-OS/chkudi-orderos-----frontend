"use client";

import React from "react";
import {
  FileText,
  Save,
  Trash2,
  ArrowLeft,
  Download,
} from "lucide-react";
import Button from "@/components/ui/Button";

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
  return (
    <section className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Icon, Title & Breadcrumb matching legacy Sales Invoice */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Purchase Invoice
              </h1>
              {invoiceNo && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-amber-500/10 dark:text-[#F5C451] dark:border-amber-500/25">
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Action Icon: Save */}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            title="Save Invoice"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0A0E1A] text-white hover:bg-[#161D2E] dark:bg-[#F5C451] dark:text-[#080B11] dark:hover:bg-[#E8B83D] active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* Action Icon: Delete (only for existing saved invoices) */}
          {isExisting && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              title="Delete Invoice"
              className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-600 text-white hover:bg-rose-700 active:scale-95 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Action Icon: Back */}
          <button
            type="button"
            onClick={onBack}
            title="Back to Invoices"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-600 text-white hover:bg-amber-700 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Download Buttons matching legacy styling */}
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block mx-1" />

          {onDownloadDetail && (
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap active:scale-[0.98]"
              leftIcon={<Download size={14} />}
              onClick={onDownloadDetail}
            >
              Download Detail
            </Button>
          )}

          {onDownloadSkuWise && (
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap active:scale-[0.98]"
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
              className="h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold whitespace-nowrap active:scale-[0.98]"
              leftIcon={<Download size={14} />}
              onClick={onDownloadTally}
            >
              Download [Tally]
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
