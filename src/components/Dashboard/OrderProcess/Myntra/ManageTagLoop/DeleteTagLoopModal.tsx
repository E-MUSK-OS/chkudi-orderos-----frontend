"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/components/ui/Button";

import {
  AlertTriangle,
  ArrowRight,
  Trash2,
  Boxes,
  CheckCircle2,
  PackageCheck,
} from "lucide-react";

import { TagLoop } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  tagLoop: TagLoop | null;
  onDelete: () => void;
  loading?: boolean;
}

export default function DeleteTagLoopModal({
  open,
  onClose,
  tagLoop,
  onDelete,
  loading = false,
}: Props) {
  if (!tagLoop) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden border-0 p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-[#1A2235] bg-[#0A0E1A] px-10 py-8">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center bg-[#E8C16D] shadow-lg">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            <div>
              <DialogTitle className="text-3xl font-bold text-[#E8C16D]">
                Delete Tag Loop
              </DialogTitle>

              <p className="mt-2 text-sm text-slate-300">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-8 bg-[#F8F9FB] px-10 py-8">
          {/* Description */}
          <div>
            <p className="text-base leading-7 text-slate-600">
              You are about to permanently delete this Tag Loop and all tags
              associated with it. Once deleted, this information cannot be
              recovered.
            </p>
          </div>

          {/* Tag Range */}
          <div className="border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Boxes className="h-5 w-5 text-[#C89B3C]" />

              <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                Tag Range
              </p>
            </div>

            <div className="flex items-center justify-center gap-6">
              <div className="bg-[#0A0E1A] px-6 py-4">
                <p className="text-xs uppercase tracking-widest text-slate-400">
                  Start
                </p>

                <h3 className="mt-2 text-2xl font-bold text-white">
                  {tagLoop.startTag}
                </h3>
              </div>

              <ArrowRight className="h-8 w-8 text-[#C89B3C]" />

              <div className="bg-[#E8C16D] px-6 py-4">
                <p className="text-xs uppercase tracking-widest text-[#6B4E00]">
                  End
                </p>

                <h3 className="mt-2 text-2xl font-bold text-[#0A0E1A]">
                  {tagLoop.endTag}
                </h3>
              </div>
            </div>
          </div>


          <div className="grid grid-cols-3 gap-5">
            <div className="border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
              <PackageCheck className="mx-auto h-8 w-8 text-[#C89B3C]" />

              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Total Tags
              </p>

              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {tagLoop.total}
              </h3>
            </div>

            <div className="border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />

              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Available
              </p>

              <h3 className="mt-2 text-3xl font-bold text-green-600">
                {tagLoop.available}
              </h3>
            </div>

            <div className="border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
              <Boxes className="mx-auto h-8 w-8 text-orange-600" />

              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Used
              </p>

              <h3 className="mt-2 text-3xl font-bold text-orange-600">
                {tagLoop.used}
              </h3>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 border-t border-slate-200 bg-white px-10 py-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={onDelete}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Forever
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}