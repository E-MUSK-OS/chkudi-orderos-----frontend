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
      <DialogContent className="!rounded-3xl sm:!rounded-[32px] border border-[#E7E0D2] max-w-2xl overflow-hidden bg-white p-0 shadow-2xl">
        {/* Header */}
        <div className="border-b border-[#1A2235] bg-[#0A0E1A] px-6 sm:px-8 py-5 sm:py-6">
          <DialogHeader>
            <div className="flex items-center gap-3.5">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shadow-xs shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl sm:text-2xl font-black text-[#E8C16D] tracking-tight">
                  Add Tag Loop
                </DialogTitle>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-300">
                  Define a starting sequence and volume to generate a continuous RFID / Barcode range.
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-6 sm:space-y-7 p-6 sm:p-8 bg-white">
          {/* Inputs */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs sm:text-sm font-bold text-[#0A0E1A]">
                Start Sequence TAG <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="e.g. MP220167200"
                value={startTag}
                onChange={(e) => setStartTag(e.target.value.toUpperCase())}
                className="w-full h-11 sm:h-12 px-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-[#FAF8F5] text-xs sm:text-sm font-mono font-bold text-[#0A0E1A] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#E8C16D] focus:bg-white transition"
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                Must contain an alphabetical prefix followed by digits.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs sm:text-sm font-bold text-[#0A0E1A]">
                Total TAGs Volume <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={total}
                onChange={(e) => setTotal(Math.max(1, Number(e.target.value)))}
                className="w-full h-11 sm:h-12 px-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-[#FAF8F5] text-xs sm:text-sm font-bold text-[#0A0E1A] placeholder:text-slate-400 focus:outline-none focus:border-[#E8C16D] focus:bg-white transition"
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                Total continuous sequence count to generate.
              </p>
            </div>
          </div>

          {/* Generated Preview Box */}
          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-[#B88728]" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0A0E1A]">
                  Generated Sequence Preview
                </h3>
              </div>
              <span className="rounded-xl border border-[#E8C16D]/40 bg-[#FFF9EC] px-2.5 py-0.5 text-[11px] font-bold text-[#8A6318]">
                Calculated
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              {/* Start */}
              <div className="rounded-xl sm:rounded-2xl border border-[#E7E0D2] bg-white p-4 shadow-2xs">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Start Tag
                </p>
                <h4 className="mt-1.5 font-mono text-base sm:text-lg font-black tracking-tight text-[#0A0E1A] break-all">
                  {startTag || "--"}
                </h4>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 shadow-2xs rotate-90 md:rotate-0">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* End */}
              <div className="rounded-xl sm:rounded-2xl border border-[#E7E0D2] bg-white p-4 shadow-2xs text-left md:text-right">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Calculated End Tag
                </p>
                <h4 className="mt-1.5 font-mono text-base sm:text-lg font-black tracking-tight text-[#B88728] break-all">
                  {endTag || "--"}
                </h4>
              </div>
            </div>

            {/* Bottom Preview Stats */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-[#E7E0D2] bg-white px-4 py-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-600">Total Count</span>
                </div>
                <span className="text-base font-black text-emerald-600">{total} Tags</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#E7E0D2] bg-white px-4 py-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-600">Status</span>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg">
                  {startTag && endTag ? "Ready to Save" : "Awaiting Input"}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-5 text-xs sm:text-sm font-bold text-slate-700 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !startTag || !endTag}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-transparent bg-[#E8C16D] px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs hover:bg-[#d4af5a] transition active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
