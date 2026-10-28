"use client";

import React from "react";
import { Plus, Download, Save, ArrowLeft, FileSpreadsheet } from "lucide-react";
import Button from "@/components/ui/Button";

interface ChallanHeaderProps {
  viewMode: "list" | "create" | "edit";
  onAddNew?: () => void;
  onBack?: () => void;
  onSave?: () => void;
  onDownloadAll?: () => void;
  onDownloadSkuWise?: () => void;
  saving?: boolean;
}

export default function ChallanHeader({
  viewMode,
  onAddNew,
  onBack,
  onSave,
  onDownloadAll,
  onDownloadSkuWise,
  saving = false,
}: ChallanHeaderProps) {
  return (
    <section className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Title & Badge */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 max-w-2xl">
          <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            <FileSpreadsheet className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
              {viewMode === "create"
                ? "Create Sales Challan"
                : viewMode === "edit"
                ? "Edit Sales Challan"
                : "Sales Challan"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {viewMode === "list"
                ? "Offline Sales • Manage offline sales delivery notes, parties, and dispatches."
                : "Enter consignment details, recipient party, item quantities, and delivery terms."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {viewMode === "list" ? (
            <>
              <Button
                variant="outline"
                fullWidth={false}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-semibold active:scale-[0.98]"
                leftIcon={<Download size={16} />}
                onClick={onDownloadAll}
              >
                Download
              </Button>

              <Button
                variant="outline"
                fullWidth={false}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-semibold active:scale-[0.98]"
                leftIcon={<Download size={16} />}
                onClick={onDownloadSkuWise}
              >
                SKU Wise
              </Button>

              <Button
                variant="primary"
                fullWidth={false}
                className="h-10 sm:h-11 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98] shrink-0"
                leftIcon={<Plus size={18} />}
                onClick={onAddNew}
              >
                New Challan
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                fullWidth={false}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-semibold active:scale-[0.98]"
                leftIcon={<ArrowLeft size={16} />}
                onClick={onBack}
              >
                Back to List
              </Button>

              <Button
                variant="outline"
                fullWidth={false}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-semibold active:scale-[0.98]"
                leftIcon={<Download size={16} />}
                onClick={onDownloadAll}
              >
                Export
              </Button>

              <Button
                variant="primary"
                fullWidth={false}
                className="h-10 sm:h-11 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98] shrink-0"
                leftIcon={<Save size={18} />}
                onClick={onSave}
                loading={saving}
              >
                Save Challan
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
