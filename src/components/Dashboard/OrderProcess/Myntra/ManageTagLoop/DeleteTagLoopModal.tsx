"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <DialogContent className="!rounded-3xl sm:!rounded-[32px] border border-[#E7E0D2] dark:border-white/[0.08] max-w-xl sm:max-w-2xl overflow-hidden bg-white dark:bg-[#0F1626] p-0 shadow-2xl">
        {/* Header */}
        <div className="border-b border-[#1A2235] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-6 sm:px-8 py-5 sm:py-6">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/30 shadow-xs shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div className="text-left">
                <DialogTitle className="text-xl sm:text-2xl font-black text-[#E8C16D] tracking-tight">
                  Delete Tag Loop
                </DialogTitle>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-300 dark:text-slate-400">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="space-y-6 sm:space-y-7 p-6 sm:p-8 bg-white dark:bg-[#0F1626]">
          {/* Danger notice */}
          <div className="rounded-2xl border border-red-200/80 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 sm:p-4.5 text-xs sm:text-sm leading-relaxed text-red-800 dark:text-red-300">
            You are about to permanently delete this Tag Loop sequence and all associated tracking data. Once deleted, this range cannot be recovered or restored.
          </div>

          {/* Tag Range Target */}
          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] p-5 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0A0E1A] dark:text-white">
                Target Sequence Range
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] p-4 shadow-2xs">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Start Tag
                </p>
                <h3 className="mt-1.5 font-mono text-lg sm:text-xl font-black text-[#0A0E1A] dark:text-white break-all">
                  {tagLoop.startTag}
                </h3>
              </div>

              <div className="flex items-center justify-center">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40 shadow-2xs rotate-90 md:rotate-0">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              <div className="rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] p-4 shadow-2xs text-left md:text-right">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  End Tag
                </p>
                <h3 className="mt-1.5 font-mono text-lg sm:text-xl font-black text-[#B88728] dark:text-[#E8C16D] break-all">
                  {tagLoop.endTag}
                </h3>
              </div>
            </div>
          </div>

          {/* 3-Column stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] p-4 text-center shadow-2xs">
              <PackageCheck className="mx-auto h-6 w-6 text-[#B88728] dark:text-[#E8C16D]" />
              <p className="mt-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Tags
              </p>
              <h4 className="mt-1 text-xl sm:text-2xl font-black text-[#0A0E1A] dark:text-white">
                {tagLoop.total.toLocaleString()}
              </h4>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] p-4 text-center shadow-2xs">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Available
              </p>
              <h4 className="mt-1 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {tagLoop.available.toLocaleString()}
              </h4>
            </div>

            <div className="rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] p-4 text-center shadow-2xs">
              <Boxes className="mx-auto h-6 w-6 text-amber-600 dark:text-amber-400" />
              <p className="mt-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Used
              </p>
              <h4 className="mt-1 text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400">
                {tagLoop.used.toLocaleString()}
              </h4>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#080B11] hover:bg-slate-200 dark:hover:bg-white/[0.04] px-5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-red-600 hover:bg-red-700 text-white px-6 text-xs sm:text-sm font-bold shadow-xs transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Forever</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}