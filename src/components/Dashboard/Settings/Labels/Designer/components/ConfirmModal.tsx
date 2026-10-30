"use client";

import { TriangleAlert, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md overflow-hidden !rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-white cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="flex justify-center pt-8">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
              danger ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40" : "bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30"
            }`}
          >
            <TriangleAlert
              size={32}
              className={danger ? "text-red-600 dark:text-red-400" : "text-[#B88728] dark:text-[#E8C16D]"}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A0E1A] dark:text-white">
            {title}
          </h2>

          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 bg-slate-50/80 dark:bg-[#080B11] border-t border-[#E7E0D2] dark:border-white/[0.08] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer active:scale-[0.98]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full h-11 rounded-2xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer active:scale-[0.98] ${
              danger 
                ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20" 
                : "bg-[#0A0E1A] dark:bg-[#080B11] hover:bg-slate-900 dark:hover:bg-white/[0.04] text-white dark:text-[#E8C16D] border border-transparent dark:border-white/[0.1]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

