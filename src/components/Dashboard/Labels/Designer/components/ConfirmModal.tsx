"use client";

import { TriangleAlert, X } from "lucide-react";
import Button from "@/components/ui/Button";

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
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#111827] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-stone-800 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center pt-8">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full ${
              danger ? "bg-red-100" : "bg-stone-800"
            }`}
          >
            <TriangleAlert
              size={40}
              className={danger ? "text-red-600" : "text-[#E8C16D]"}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-6 text-center">
          <h2 className="text-2xl font-bold text-white">
            {title}
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 bg-[#0A0E1A] px-8 py-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-11 bg-transparent text-gray-300 border-stone-800 hover:bg-stone-800 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full h-11 ${
              danger 
                ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
                : "bg-[#0A0E1A] hover:bg-[#0A0E1A]/90 text-white"
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

