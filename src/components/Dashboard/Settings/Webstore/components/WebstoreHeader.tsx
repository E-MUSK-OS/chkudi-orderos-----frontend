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
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06]">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
            <Store className="h-5 w-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {viewMode === "create"
              ? "Add Webstore"
              : viewMode === "edit"
              ? "Modify Webstore"
              : "Webstore"}
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

      {/* Top Right Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {viewMode === "list" ? (
          <>
            {onUploadOrder && (
              <button
                type="button"
                onClick={onUploadOrder}
                className="inline-flex items-center gap-2 h-10 sm:h-11 px-4 sm:px-5 rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98]"
              >
                <Upload size={16} />
                <span>Upload Order</span>
              </button>
            )}

            {onDownloadListings && (
              <button
                type="button"
                onClick={onDownloadListings}
                className="inline-flex items-center gap-2 h-10 sm:h-11 px-4 sm:px-5 rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98]"
              >
                <Download size={16} />
                <span>Download Existing Listing [All]</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center gap-2 h-10 sm:h-11 px-5 sm:px-6 rounded-2xl bg-[#F5C451] hover:bg-[#e8b83e] active:scale-[0.97] text-slate-900 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md shadow-[#F5C451]/15 shrink-0 dark:bg-gradient-to-r dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11] dark:shadow-[0_0_16px_rgba(245,196,81,0.25)] dark:hover:brightness-105"
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
              className="inline-flex items-center gap-2 h-10 sm:h-11 px-4 sm:px-5 rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              <span>Back to List</span>
            </button>

            <button
              type="submit"
              form="webstore-form"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 h-10 sm:h-11 px-5 sm:px-6 rounded-2xl bg-[#F5C451] hover:bg-[#e8b83e] active:scale-[0.97] text-slate-900 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md shadow-[#F5C451]/15 shrink-0 dark:bg-gradient-to-r dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11] dark:shadow-[0_0_16px_rgba(245,196,81,0.25)] dark:hover:brightness-105 disabled:opacity-50"
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
