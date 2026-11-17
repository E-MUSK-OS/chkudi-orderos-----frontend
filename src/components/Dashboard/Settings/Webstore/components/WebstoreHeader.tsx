"use client";

import React from "react";
import { Plus, Upload, Download, ArrowLeft, Save, Store } from "lucide-react";
import { WebstoreViewMode } from "../types/webstore.types";

interface WebstoreHeaderProps {
  viewMode: WebstoreViewMode;
  onAddNew: () => void;
  onBack: () => void;
  onSave?: () => void;
  onUploadOrder?: () => void;
  onDownloadListings?: () => void;
  saving?: boolean;
}

export default function WebstoreHeader({
  viewMode,
  onAddNew,
  onBack,
  onSave,
  onUploadOrder,
  onDownloadListings,
  saving = false,
}: WebstoreHeaderProps) {
  const pageTitle =
    viewMode === "create"
      ? "Add Webstore"
      : viewMode === "edit"
      ? "Modify Webstore"
      : "Webstore";

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 shadow-sm">
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-3.5">
        {viewMode !== "list" && (
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title="Back to List"
          >
            <ArrowLeft size={22} />
          </button>
        )}

        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
              {pageTitle}
            </h1>
          </div>

          {/* Short one-line description related to the page */}
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {viewMode === "create"
              ? "Connect a new marketplace webstore and configure channel credentials."
              : viewMode === "edit"
              ? "Update store configurations, API credentials, and sync preferences."
              : "Manage connected marketplace channels, store credentials, and sub-SKU mappings."}
          </p>
        </div>
      </div>

      {/* Top Right Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full xl:w-auto shrink-0 self-start xl:self-center">
        {viewMode === "list" ? (
          <>
            {onUploadOrder && (
              <button
                type="button"
                onClick={onUploadOrder}
                className="inline-flex min-h-[38px] sm:h-11 items-center justify-center gap-2 px-4 sm:px-5 rounded-2xl sm:rounded-3xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] text-xs sm:text-sm font-bold shadow-xs transition-all hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98] cursor-pointer w-full sm:w-auto whitespace-nowrap"
              >
                <Upload size={16} className="shrink-0 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Upload Order</span>
              </button>
            )}

            {onDownloadListings && (
              <button
                type="button"
                onClick={onDownloadListings}
                className="inline-flex min-h-[38px] sm:h-11 items-center justify-center gap-2 px-4 sm:px-5 rounded-2xl sm:rounded-3xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] text-xs sm:text-sm font-bold shadow-xs transition-all hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98] cursor-pointer w-full sm:w-auto whitespace-nowrap"
                title="Download Existing Listing [All]"
              >
                <Download size={16} className="shrink-0 text-[#B88728] dark:text-[#E8C16D]" />
                <span className="hidden min-[380px]:inline">Download Existing Listing [All]</span>
                <span className="min-[380px]:hidden">Download Existing Listings</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex min-h-[38px] sm:h-11 items-center justify-center gap-2 px-5 sm:px-6 rounded-2xl sm:rounded-3xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm w-full sm:w-auto shrink-0 whitespace-nowrap"
            >
              <Plus size={18} className="stroke-[2.5]" />
              <span>Create Webstore</span>
            </button>
          </>
        ) : (
          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              className="inline-flex min-h-[38px] sm:h-11 items-center justify-center gap-2 px-4 sm:px-6 rounded-2xl sm:rounded-3xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] text-xs sm:text-sm font-bold transition-all hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 cursor-pointer active:scale-95 disabled:opacity-50 flex-1 sm:flex-initial"
            >
              <ArrowLeft size={16} className="text-[#B88728] dark:text-[#E8C16D]" />
              <span>Back to List</span>
            </button>

            <button
              type="submit"
              form="webstore-form"
              onClick={onSave}
              disabled={saving}
              className="inline-flex min-h-[38px] sm:h-11 items-center justify-center gap-2 px-5 sm:px-7 rounded-2xl sm:rounded-3xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm shrink-0 disabled:opacity-50 flex-1 sm:flex-initial"
            >
              <Save size={18} />
              <span>
                {saving
                  ? "Saving..."
                  : viewMode === "edit"
                  ? "Update Webstore"
                  : "Save Webstore"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
