"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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
        barcodeSku: skuMapping.barcodeSku,
        ordercookSku: skuMapping.ordercookSku,
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
      <DialogContent className="max-w-xl overflow-hidden border-0 p-0 shadow-2xl">
        <DialogHeader className="border-b bg-[#0A0E1A] px-6 py-5">
          <DialogTitle className="text-2xl font-semibold text-[#E8C16D]">
            Edit SKU Mapping
          </DialogTitle>

          <p className="mt-1 text-sm text-slate-300">
            Update the SKU mapping information for this product.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <Input label="Short SKU" {...register("shortSku")} />

          <Input label="Barcode SKU" {...register("barcodeSku")} />

          <Input label="OrderCook SKU" {...register("ordercookSku")} />

          <Button type="submit" loading={isPending}>
            Update SKU Mapping
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
