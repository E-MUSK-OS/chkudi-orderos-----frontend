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
      <div className="relative w-full max-w-md overflow-hidden !rounded-3xl border border-[#E7E0D2] bg-white shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="flex justify-center pt-8">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
              danger ? "bg-red-50 text-red-600 border border-red-200/60" : "bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30"
            }`}
          >
            <TriangleAlert
              size={32}
              className={danger ? "text-red-600" : "text-[#B88728]"}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A0E1A]">
            {title}
          </h2>

          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 bg-slate-50/80 border-t border-[#E7E0D2] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer active:scale-[0.98]"
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
                : "bg-[#0A0E1A] hover:bg-slate-900 text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

