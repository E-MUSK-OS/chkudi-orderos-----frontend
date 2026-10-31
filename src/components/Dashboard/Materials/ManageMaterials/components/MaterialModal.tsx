"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import Modal from "@/components/ui/Modal";
import MaterialForm from "./MaterialForm";
import type { Material } from "../types/material.types";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  material?: Material;
  onClose: () => void;
  onSuccess: () => void;
  onDeleteClick?: () => void;
}

export default function MaterialModal({
  open,
  mode,
  material,
  onClose,
  onSuccess,
  onDeleteClick,
}: Props) {
  const [loading, setLoading] = useState(false);

  const footer = (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
      {/* Left side actions (e.g. Delete button in edit mode) */}
      <div className="flex items-center gap-2">
        {mode === "edit" && onDeleteClick ? (
          <button
            type="button"
            onClick={onDeleteClick}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        ) : (
          <span />
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="min-h-[42px] sm:min-h-[44px] h-11 px-6 rounded-xl text-xs sm:text-sm font-bold active:scale-[0.98] border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] dark:text-slate-200 disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          form="material-form"
          disabled={loading}
          className="min-h-[42px] sm:min-h-[44px] h-11 px-7 rounded-xl text-xs sm:text-sm font-bold bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:text-black dark:hover:bg-[#e6b540] active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>{mode === "create" ? "Saving..." : "Updating..."}</span>
            </>
          ) : mode === "create" ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Save Material</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Update Material</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="4xl"
      showHeader={false}
      footer={footer}
    >
      {/* Header */}
      <div className="-mx-3.5 sm:-mx-6 -mt-3.5 sm:-mt-6 border-b border-[#E7EAF0] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left Title with Back Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-[#0A0E1A] dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h2 className="text-base sm:text-xl font-black text-[#0A0E1A] dark:text-white tracking-tight">
                {mode === "create" ? "Add Material" : "Edit Material"}
              </h2>
              {mode === "edit" && material?.materialName ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Name: <span className="font-bold text-[#B88728] dark:text-[#F5C451]">{material.materialName}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Create a new material for inventory, sourcing and stock specifications.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <MaterialForm
        key={open ? `${mode}-${material?.id ?? "create"}` : "closed"}
        mode={mode}
        material={material}
        onSuccess={() => {
          setLoading(false);
          onSuccess();
        }}
        onLoadingChange={setLoading}
        onDeleteClick={onDeleteClick}
      />
    </Modal>
  );
}

