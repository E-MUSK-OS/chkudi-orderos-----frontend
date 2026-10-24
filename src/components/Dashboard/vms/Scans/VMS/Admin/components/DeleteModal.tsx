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
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-24px)] xs:w-[calc(100vw-32px)] sm:w-full max-w-[460px] max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] overflow-y-auto !rounded-2xl sm:!rounded-3xl border border-[#E7E0D2] bg-white p-0 shadow-2xl outline-none"
      >
        {/* Accessible close button with proper hover state */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-20 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4 sm:space-y-6 p-5 sm:p-7">
          {/* Warning Icon */}
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-200 shadow-xs">
            <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
          </div>

          {/* Text Content */}
          <div className="space-y-2 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              {title}
            </h3>

            <p className="max-w-sm mx-auto text-xs sm:text-sm leading-relaxed text-slate-500 break-words px-1">
              {description}
            </p>

            {/* Selected Item */}
            {itemName && (
              <div className="mx-auto max-w-xs rounded-xl border border-red-100 bg-red-50 py-2 sm:py-2.5 px-3 sm:px-4 text-center">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-red-500">
                  Selected
                </p>
                <p className="mt-0.5 sm:mt-1 break-all font-mono text-xs sm:text-sm font-bold text-red-700">
                  {itemName}
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="mx-auto max-w-xs rounded-xl border border-amber-200 bg-[#FFF9EC] py-2 px-3 text-center">
              <p className="text-[11px] sm:text-xs font-semibold text-amber-800">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          {/* Responsive Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-1 sm:pt-2 w-full">
            <Button
              type="button"
              variant="outline"
              fullWidth={false}
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto sm:min-w-[130px] rounded-xl sm:rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50 h-10 sm:h-11 text-xs sm:text-sm font-semibold"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="danger"
              fullWidth={false}
              loading={loading}
              onClick={onDelete}
              leftIcon={<Trash2 size={16} />}
              className="w-full sm:w-auto sm:min-w-[130px] rounded-xl sm:rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200 h-10 sm:h-11 text-xs sm:text-sm font-bold"
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
