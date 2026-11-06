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
    <div className="w-full rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 sm:px-7 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
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
            <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
              {pageTitle}
            </h1>
          </div>

          {/* Breadcrumb: Settings / Webstore */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Settings
            </span>
            <span>/</span>
            <button
              type="button"
              onClick={viewMode !== "list" ? onBack : undefined}
              className={`${
                viewMode !== "list"
                  ? "text-[#B88728] dark:text-[#E8C16D] hover:underline cursor-pointer"
                  : "text-slate-700 dark:text-slate-200"
              }`}
            >
              Webstore
            </button>
            {viewMode === "create" && (
              <>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-200">New Store</span>
              </>
            )}
            {viewMode === "edit" && (
              <>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-200">Modify</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Right Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0 self-end md:self-center">
        {viewMode === "list" ? (
          <>
            {onUploadOrder && (
              <button
                type="button"
                onClick={onUploadOrder}
                className="inline-flex h-11 items-center justify-center gap-2 px-5 rounded-full border border-[#E7E0D2] bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.98] cursor-pointer dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:hover:bg-white/[0.04]"
              >
                <Upload size={16} />
                <span>Upload Order</span>
              </button>
            )}

            {onDownloadListings && (
              <button
                type="button"
                onClick={onDownloadListings}
                className="inline-flex h-11 items-center justify-center gap-2 px-5 rounded-full border border-[#E7E0D2] bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.98] cursor-pointer dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white dark:hover:bg-white/[0.04]"
              >
                <Download size={16} />
                <span>Download Existing Listing [All]</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex h-11 items-center justify-center gap-2 px-6 rounded-full bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Plus size={18} className="stroke-[2.5]" />
              <span>Create Webstore</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onBack}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 px-6 rounded-full border border-[#E7E0D2] bg-white text-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-200"
            >
              <ArrowLeft size={16} />
              <span>Back to List</span>
            </button>

            <button
              type="submit"
              form="webstore-form"
              onClick={onSave}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 px-7 rounded-full bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
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
          </>
        )}
      </div>
    </div>
  );
}
