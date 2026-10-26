"use client";

import { useMemo, useState } from "react";
import { Boxes, ArrowRight, Hash, Sparkles, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useCreateTagLoop } from "./hooks/useTagLoops";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddTagLoopModal({ open, onClose }: Props) {
  const [startTag, setStartTag] = useState("");
  const [total, setTotal] = useState(500);
  const { mutate, isPending } = useCreateTagLoop();

  const endTag = useMemo(() => {
    if (!startTag) return "";

    const prefix = startTag.match(/^[A-Za-z]+/)?.[0] ?? "";

    const startNumber = Number(startTag.replace(prefix, ""));

    if (Number.isNaN(startNumber)) return "";

    return `${prefix}${startNumber + total - 1}`;
  }, [startTag, total]);

  const handleSave = () => {
    mutate(
      {
        startTag,
        total,
      },
      {
        onSuccess: () => {
          toast.success("Tag Loop created successfully.");

          onClose();
          setStartTag("");
          setTotal(500);
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to create Tag Loop.");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[92vw] md:w-full max-w-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col !rounded-2xl sm:!rounded-[32px] border border-[#E7E0D2] dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#0F1626] p-0 shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-[#1A2235] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-4 sm:px-8 py-4 sm:py-6">
          <DialogHeader>
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl sm:rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shadow-xs shrink-0">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg sm:text-2xl font-black text-[#E8C16D] tracking-tight">
                  Add Tag Loop
                </DialogTitle>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-300 dark:text-slate-400">
                  Define a starting sequence and volume to generate a continuous RFID / Barcode range.
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-7 p-4 sm:p-8 bg-white dark:bg-[#0F1626]">
          {/* Inputs */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white">
                Start Sequence TAG <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="e.g. MP220167200"
                value={startTag}
                onChange={(e) => setStartTag(e.target.value.toUpperCase())}
                className="w-full h-11 sm:h-12 px-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-[#FAF8F5] dark:bg-[#080B11] text-xs sm:text-sm font-mono font-bold text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:border-[#E8C16D] focus:bg-white dark:focus:bg-[#080B11] transition"
              />
              <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                Must contain an alphabetical prefix followed by digits.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white">
                Total TAGs Volume <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={total}
                onChange={(e) => setTotal(Math.max(1, Number(e.target.value)))}
                className="w-full h-11 sm:h-12 px-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-[#FAF8F5] dark:bg-[#080B11] text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E8C16D] focus:bg-white dark:focus:bg-[#080B11] transition"
              />
              <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                Total continuous sequence count to generate.
              </p>
            </div>
          </div>

          {/* Generated Preview Box */}
          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] p-5 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0A0E1A] dark:text-white">
                  Generated Sequence Preview
                </h3>
              </div>
              <span className="rounded-xl border border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-2.5 py-0.5 text-[11px] font-bold text-[#8A6318] dark:text-[#E8C16D]">
                Calculated
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              {/* Start */}
              <div className="rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] p-4 shadow-2xs">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Start Tag
                </p>
                <h4 className="mt-1.5 font-mono text-base sm:text-lg font-black tracking-tight text-[#0A0E1A] dark:text-white break-all">
                  {startTag || "--"}
                </h4>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40 shadow-2xs rotate-90 md:rotate-0">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* End */}
              <div className="rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] p-4 shadow-2xs text-left md:text-right">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Calculated End Tag
                </p>
                <h4 className="mt-1.5 font-mono text-base sm:text-lg font-black tracking-tight text-[#B88728] dark:text-[#E8C16D] break-all">
                  {endTag || "--"}
                </h4>
              </div>
            </div>

            {/* Bottom Preview Stats */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] px-4 py-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Count</span>
                </div>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{total} Tags</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] px-4 py-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Status</span>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-lg">
                  {startTag && endTag ? "Ready to Save" : "Awaiting Input"}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#080B11] hover:bg-slate-200 dark:hover:bg-white/[0.04] px-5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !startTag || !endTag}
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-transparent bg-[#E8C16D] px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs hover:bg-[#d4af5a] transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Save Tag Loop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
