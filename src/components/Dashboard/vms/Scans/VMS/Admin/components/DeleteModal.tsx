"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";

import Button from "@/components/ui/Button";

interface DeleteModalProps {
  open: boolean;
  loading?: boolean;

  title: string;

  description: string;

  itemName?: string;

  onClose: () => void;
  onDelete: () => void;
}

export default function DeleteModal({
  open,
  loading = false,
  title,
  description,
  itemName,
  onClose,
  onDelete,
}: DeleteModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="w-full max-w-[500px] overflow-hidden border-0 p-0 shadow-2xl">
        <div className="px-10 py-10">
          {/* Warning Icon */}
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={34} className="text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="mt-8 text-center text-3xl font-bold text-[#111827]">
            {title}
          </h2>

          {/* Description */}
          <p className="mt-4 text-center text-[15px] leading-7 text-slate-500">
            {description}
          </p>

          {/* Selected Item */}
          {itemName && (
            <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="text-center text-xs font-semibold uppercase tracking-[3px] text-red-500">
                Selected
              </p>

              <p className="mt-2 break-all text-center font-mono text-lg font-bold text-red-700">
                {itemName}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-center text-sm leading-6 text-amber-700">
              This action is permanent and cannot be undone.
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>

            <Button
              fullWidth
              loading={loading}
              onClick={onDelete}
              leftIcon={<Trash2 size={18} />}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
