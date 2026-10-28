"use client";

import React from "react";
import { Plus, Upload, Download, ArrowLeft, Save, Store } from "lucide-react";
import Button from "@/components/ui/Button";
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

        {/* Breadcrumb matching Screenshot: Setting / Webstore */}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Setting
          </span>
          <span>/</span>
          <button
            type="button"
            onClick={viewMode !== "list" ? onBack : undefined}
            className={`${
              viewMode !== "list"
                ? "text-[#0284C7] dark:text-[#38BDF8] hover:underline cursor-pointer"
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

      {/* Top Right Action Buttons matching Challan header style */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {viewMode === "list" ? (
          <>
            <Button
              variant="outline"
              fullWidth={false}
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-semibold active:scale-[0.98]"
              leftIcon={<Upload size={16} />}
              onClick={onUploadOrder}
            >
              Upload Order
            </Button>

            <Button
              variant="outline"
              fullWidth={false}
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-2xl text-xs sm:text-sm font-semibold active:scale-[0.98]"
              leftIcon={<Download size={16} />}
              onClick={onDownloadListings}
            >
              Download Existing Listing [All]
            </Button>

            <Button
              variant="primary"
              fullWidth={false}
              className="h-10 sm:h-11 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98] shrink-0"
              leftIcon={<Plus size={18} />}
              onClick={onAddNew}
            >
              Create Webstore
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
              disabled={saving}
            >
              Back to List
            </Button>

            <Button
              type="submit"
              form="webstore-form"
              variant="primary"
              fullWidth={false}
              className="h-10 sm:h-11 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98] shrink-0"
              leftIcon={<Save size={18} />}
              onClick={onSave}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : viewMode === "edit"
                ? "Update Webstore"
                : "Save Webstore"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
