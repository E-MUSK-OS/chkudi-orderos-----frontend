"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { RefreshCw, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useUpdateSkuMapping } from "../hooks/useSkuMappings";

import type {
  SkuMapping,
  UpdateSkuMappingPayload,
} from "../types/skuMapping.types";

interface Props {
  open: boolean;
  onClose: () => void;
  skuMapping: SkuMapping | null;
}

export default function SkuMappingModal({ open, onClose, skuMapping }: Props) {
  const { register, handleSubmit, reset } = useForm<UpdateSkuMappingPayload>();

  const { mutate, isPending } = useUpdateSkuMapping();

  useEffect(() => {
    if (skuMapping) {
      reset({
        shortSku: skuMapping.shortSku,
        fullSku: skuMapping.fullSku || "",
        barcodeSku: skuMapping.barcodeSku,
        ordercookSku: skuMapping.ordercookSku || "",
        mrp: skuMapping.mrp || "",
        mfgMonth: skuMapping.mfgMonth || "",
      });
    }
  }, [skuMapping, reset]);

  const onSubmit = (data: UpdateSkuMappingPayload) => {
    if (!skuMapping) return;

    mutate(
      {
        id: skuMapping.id,
        data,
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg overflow-hidden border border-[#E7E0D2] p-0 shadow-2xl !rounded-3xl sm:!rounded-[32px] bg-white">
        <DialogHeader className="border-b border-[#E7E0D2] bg-[#0A0E1A] px-6 py-5">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-[#E8C16D]">
            Edit SKU Mapping
          </DialogTitle>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            Update the barcode and SKU mapping details for this product.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 sm:p-7">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Short SKU</label>
            <input
              {...register("shortSku", { required: true })}
              placeholder="e.g. TS-BLK-M"
              className="w-full h-10 sm:h-11 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none transition focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Full SKU</label>
            <input
              {...register("fullSku")}
              placeholder="e.g. TS-BLK-M-FULL"
              className="w-full h-10 sm:h-11 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none transition focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Barcode SKU</label>
            <input
              {...register("barcodeSku", { required: true })}
              placeholder="e.g. 890123456789"
              className="w-full h-10 sm:h-11 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-[#0A0E1A] font-mono outline-none transition focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">OrderCook SKU</label>
            <input
              {...register("ordercookSku")}
              placeholder="e.g. OC-12345"
              className="w-full h-10 sm:h-11 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none transition focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">MRP</label>
              <input
                {...register("mrp")}
                placeholder="e.g. 2799.00 RS"
                className="w-full h-10 sm:h-11 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none transition focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">MFG Month</label>
              <input
                {...register("mfgMonth")}
                placeholder="e.g. JUL/ 26"
                className="w-full h-10 sm:h-11 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none transition focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 sm:h-12 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] text-xs sm:text-sm font-bold text-[#0A0E1A] transition shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-[#0A0E1A]" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Update Mapping</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
