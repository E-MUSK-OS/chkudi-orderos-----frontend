"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import StatsCards from "./StatsCards";
import AddTagLoopModal from "./AddTagLoopModal";
import { TagLoop } from "./types";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import {
  Plus,
  Boxes,
  ArrowRight,
  Download,
  Trash2,
} from "lucide-react";
import {
  useTagLoops,
  useExportTagLoop,
  useDeleteTagLoop,
} from "./hooks/useTagLoops";
import DeleteTagLoopModal from "./DeleteTagLoopModal";

export default function ManageTagLoop() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useTagLoops();

  const tagLoops = data?.data ?? [];

  const { mutateAsync: downloadTagLoop, isPending: downloading } =
    useExportTagLoop();

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedLoop, setSelectedLoop] = useState<TagLoop | null>(null);
  const { mutate: deleteLoop, isPending: deleting } = useDeleteTagLoop();

  const orderedLoops = useMemo(() => {
    return [...tagLoops].reverse();
  }, [tagLoops]);

  const handleDownload = async (
    loopId: string,
    startTag: string,
    endTag: string,
  ) => {
    try {
      const blob = await downloadTagLoop(loopId);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `${startTag}-${endTag}.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download TAG Loop.");
    }
  };

  return (
    <DashboardLayout title="Manage Tag Loop">
      <div className="space-y-6 sm:space-y-8">
        {/* 1. Tag Loop Management (First Card) */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Tag Loop Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Configure, track, and export continuous RFID / Barcode tag sequences for Myntra order processing.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0 self-stretch md:self-center">
              <div className="inline-flex h-11 items-center justify-center px-4 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] shadow-xs w-full sm:w-auto">
                <div className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                  <span className="text-[#B88728] dark:text-[#E8C16D] font-black">{tagLoops.length}</span>
                  <span className="text-slate-300 dark:text-slate-600 mx-1.5">•</span>
                  <span className="text-slate-600 dark:text-slate-400">Total Ranges</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-5 sm:px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs hover:bg-[#d4af5a] transition active:scale-[0.98] cursor-pointer w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Add Tag Loop</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Total Tag Metrics (Second Card) */}
        <StatsCards />

        {/* 3. Active Tag Range (Third Section) */}
        {orderedLoops.length > 0 ? (
          <div className="space-y-5 sm:space-y-6">
            {orderedLoops.map((loop) => (
              <div
                key={loop.id}
                className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden transition-all duration-200 hover:border-[#E8C16D]/50 hover:shadow-md dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              >
                {/* Header with Dark Accent matching theme */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1A2235] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-5 sm:px-7 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0 shadow-xs">
                      <Boxes className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black tracking-tight text-[#E8C16D]">
                          Active Tag Range
                        </h3>
                        <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                          Live
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        Continuous Sequence Batch
                      </p>
                    </div>
                  </div>

                  {/* Range Badge & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    {/* Range Pill */}
                    <div className="inline-flex items-center gap-2 rounded-xl border border-[#E8C16D]/30 bg-white/5 dark:bg-white/[0.04] px-3.5 py-1.5 text-xs font-mono font-bold text-white shadow-xs">
                      <span>{loop.startTag}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#E8C16D]" />
                      <span className="text-[#E8C16D]">{loop.endTag}</span>
                    </div>

                    {/* Download Button */}
                    <button
                      type="button"
                      disabled={downloading}
                      onClick={() => handleDownload(loop.id, loop.startTag, loop.endTag)}
                      className="inline-flex h-9 sm:h-10 items-center gap-1.5 text-xs font-bold text-[#0A0E1A] bg-[#E8C16D] hover:bg-[#d4af5a] px-3.5 sm:px-4 rounded-xl shadow-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      {downloading ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 text-[#0A0E1A]" />
                          <span>Download</span>
                        </>
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLoop(loop);
                        setDeleteOpen(true);
                      }}
                      className="inline-flex h-9 sm:h-10 items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-white dark:bg-[#080B11] hover:bg-red-50 dark:hover:bg-red-950/30 px-3.5 sm:px-4 rounded-xl border border-red-200 dark:border-red-900/40 hover:border-red-300 shadow-xs transition active:scale-[0.98] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Range Visual Grid */}
                <div className="p-5 sm:p-7">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6 bg-[#FAF8F5] dark:bg-[#080B11] rounded-2xl p-4 sm:p-6 border border-[#E7E0D2] dark:border-white/[0.06]">
                    {/* Start / Next Available Tag */}
                    <div className="rounded-xl bg-white dark:bg-[#0B0F17] p-4 sm:p-5 border border-[#E7E0D2] dark:border-white/[0.08] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Next Available Tag
                        </p>
                        <span className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                          Start: {loop.startTag}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl sm:text-2xl font-black font-mono tracking-tight text-[#0A0E1A] dark:text-white">
                        {loop.nextAvailableTag ?? "Completed"}
                      </h3>
                    </div>

                    {/* Central Arrow */}
                    <div className="flex items-center justify-center">
                      <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40 shadow-xs">
                        <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    </div>

                    {/* End Tag */}
                    <div className="rounded-xl bg-white dark:bg-[#0B0F17] p-4 sm:p-5 border border-[#E7E0D2] dark:border-white/[0.08] shadow-2xs text-left md:text-right">
                      <div className="flex items-center justify-between md:justify-end gap-2">
                        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Ending Sequence Tag
                        </p>
                      </div>
                      <h3 className="mt-2 text-xl sm:text-2xl font-black font-mono tracking-tight text-[#B88728] dark:text-[#E8C16D]">
                        {loop.endTag}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* 3-Column Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[#E7E0D2] dark:border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626]">
                  <div className="px-5 sm:px-7 py-4 sm:py-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Tags
                    </p>
                    <h3 className="mt-1.5 text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white">
                      {loop.total.toLocaleString()}
                    </h3>
                  </div>

                  <div className="px-5 sm:px-7 py-4 sm:py-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Available to Scan
                    </p>
                    <h3 className="mt-1.5 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {loop.available.toLocaleString()}
                    </h3>
                  </div>

                  <div className="px-5 sm:px-7 py-4 sm:py-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Used / Assigned
                    </p>
                    <h3 className="mt-1.5 text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400">
                      {loop.used.toLocaleString()}
                    </h3>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div className="border-t border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5]/80 dark:bg-[#080B11] px-5 sm:px-7 py-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Available Capacity</span>
                    <span className="font-black text-[#0A0E1A] dark:text-white">
                      {loop.total > 0
                        ? Math.round((loop.available / loop.total) * 100)
                        : 0}
                      % ({loop.available}/{loop.total})
                    </span>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                      style={{
                        width: `${
                          loop.total > 0
                            ? Math.min(
                                100,
                                Math.max(
                                  0,
                                  (loop.available / loop.total) * 100,
                                ),
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl sm:rounded-3xl border-2 border-dashed border-[#E7E0D2] dark:border-white/[0.1] bg-[#FAF8F5] dark:bg-[#080B11] p-8 sm:p-12 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40">
              <Boxes className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
              No TAG ranges configured
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Add your first RFID / Barcode continuous tag range to start tracking and processing orders.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#E8C16D] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] hover:bg-[#d4af5a] transition active:scale-[0.98] cursor-pointer w-full max-w-xs sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Tag Loop</span>
            </button>
          </div>
        )}

        <AddTagLoopModal open={open} onClose={() => setOpen(false)} />
        <DeleteTagLoopModal
          open={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
            setSelectedLoop(null);
          }}
          tagLoop={selectedLoop}
          loading={deleting}
          onDelete={() => {
            if (!selectedLoop) return;

            deleteLoop(selectedLoop.id, {
              onSuccess: () => {
                setDeleteOpen(false);
                setSelectedLoop(null);
              },
            });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
