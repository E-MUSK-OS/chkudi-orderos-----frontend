"use client";

import { toast } from "sonner";
import { Trash2, RefreshCw, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useDeleteSkuMapping } from "../hooks/useSkuMappings";
import type { SkuMapping } from "../types/skuMapping.types";

interface Props {
  open: boolean;
  onClose: () => void;
  skuMapping: SkuMapping | null;
}

export default function DeleteSkuMappingModal({
  open,
  onClose,
  skuMapping,
}: Props) {
  const { mutate, isPending } = useDeleteSkuMapping();

  const handleDelete = () => {
    if (!skuMapping) return;

    mutate(
      {
        id: skuMapping.id,
      },
      {
        onSuccess: (response) => {
          toast.success(response.message);
          onClose();
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      },
    );
  };

  if (!open || !skuMapping) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg overflow-hidden border border-[#E7E0D2] dark:border-white/[0.08] p-0 shadow-2xl !rounded-3xl sm:!rounded-[32px] bg-white dark:bg-[#0F1626]">
        <DialogHeader className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-6 py-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF9EC] dark:bg-[#E8C16D]/10 border border-[#E8C16D]/30 dark:border-[#E8C16D]/20 shadow-xs">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-[#E8C16D]">
                Delete SKU Mapping
              </DialogTitle>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-300 dark:text-slate-400">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-6 sm:p-7">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to delete this SKU mapping? This record will be permanently removed from your account.
          </p>

          {/* Item details card styled with OrderOS tokens */}
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFF9EC]/40 dark:bg-white/[0.03] p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Short SKU:</span>
              <span className="font-bold text-[#0A0E1A] dark:text-white">{skuMapping.shortSku}</span>
            </div>
            {skuMapping.fullSku && (
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Full SKU:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{skuMapping.fullSku}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Barcode SKU:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{skuMapping.barcodeSku}</span>
            </div>
            {skuMapping.ordercookSku && (
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-400">OrderCook SKU:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{skuMapping.ordercookSku}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 h-11 sm:h-12 inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-white/[0.03] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-red-600 text-xs sm:text-sm font-bold text-white transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-sm shadow-red-200 dark:shadow-none"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Mapping</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
