"use client";

import React from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";
import { SettingOptionItem, FieldGroup } from "../types/settingMasters.types";

interface DeleteOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: FieldGroup | null;
  deletingOption: SettingOptionItem | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteOptionModal({
  isOpen,
  onClose,
  selectedGroup,
  deletingOption,
  onConfirm,
  isDeleting,
}: DeleteOptionModalProps) {
  if (!isOpen || !deletingOption) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 shadow-2xl relative text-center">
        {/* Warning Icon */}
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-3 border border-red-200 dark:border-red-900/30">
          <Trash2 className="h-6 w-6" />
        </div>

        <h3 className="text-base font-extrabold text-[#0A0E1A] dark:text-white">
          Delete Option
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
          Are you sure you want to remove{" "}
          <span className="font-bold text-[#0A0E1A] dark:text-white">
            &ldquo;{deletingOption.label || deletingOption.value}&rdquo;
          </span>{" "}
          from{" "}
          <span className="font-bold text-[#B88728] dark:text-[#E8C16D]">
            {selectedGroup?.label}
          </span>
          ?
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-2.5 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

