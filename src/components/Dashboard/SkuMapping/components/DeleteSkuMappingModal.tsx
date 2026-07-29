"use client";

import { toast } from "sonner";

import Button from "@/components/ui/Button";

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl overflow-hidden  border-0 p-0 shadow-2xl">
        <DialogHeader className="border-b bg-[#0A0E1A] px-6 py-5">
          <DialogTitle className="flex items-center gap-3 text-2xl font-semibold text-white">
            Delete SKU Mapping
          </DialogTitle>

          <p className="mt-1 text-sm text-red-100">
            This action cannot be undone. Please review the SKU details before
            deleting.
          </p>
        </DialogHeader>

        <div className="space-y-6 p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">
              ⚠️ This SKU Mapping will be permanently removed from your account.
            </p>
          </div>

          {skuMapping && (
            <div className="overflow-hidden rounded-xl border">
              <div className="border-b bg-slate-50 px-4 py-3">
                <h3 className="font-semibold text-slate-900">SKU Details</h3>
              </div>

              <div className="divide-y">
                <div className="flex justify-between px-4 py-3">
                  <span className="font-medium text-slate-500">Short SKU</span>

                  <span className="font-semibold">{skuMapping.shortSku}</span>
                </div>

                <div className="flex justify-between px-4 py-3">
                  <span className="font-medium text-slate-500">
                    Barcode SKU
                  </span>

                  <span className="font-semibold">{skuMapping.barcodeSku}</span>
                </div>

                <div className="flex justify-between px-4 py-3">
                  <span className="font-medium text-slate-500">
                    OrderCook SKU
                  </span>

                  <span className="font-semibold">
                    {skuMapping.ordercookSku}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t pt-5">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>

            <Button
              loading={isPending}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Mapping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
