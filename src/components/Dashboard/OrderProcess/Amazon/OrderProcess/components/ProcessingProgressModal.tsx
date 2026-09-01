"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode,
  FileCheck2,
  Barcode,
  SearchCheck,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface ProcessingProgressModalProps {
  isOpen: boolean;
  progress: number;
  currentStage: string;
}

const STAGES = [
  {
    threshold: 15,
    title: "1. Parsing ZPL & PDF Files",
    description: "Extracting label blocks and reading document structures",
    icon: FileCode,
  },
  {
    threshold: 45,
    title: "2. Converting ZPL to High-Resolution PDF",
    description: "Rendering Zebra barcode labels via Zebra Rendering Engine",
    icon: Barcode,
  },
  {
    threshold: 75,
    title: "3. Indexing Amazon Invoices & Orders",
    description: "Extracting Invoice numbers, Amazon Order IDs, and customer data",
    icon: FileCheck2,
  },
  {
    threshold: 90,
    title: "4. Cross-Verifying & Matching Data",
    description: "Comparing invoice and order numbers across both documents",
    icon: SearchCheck,
  },
  {
    threshold: 100,
    title: "5. Generating Matched Dispatch PDF",
    description: "Pairing labels with invoices for 1-click warehouse printing",
    icon: Sparkles,
  },
];

export default function ProcessingProgressModal({
  isOpen,
  progress,
  currentStage,
}: ProcessingProgressModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#E7E0D2] bg-white p-7 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40">
                <Loader2 className="h-6 w-6 animate-spin text-[#B88728]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0A0E1A]">
                  Processing Amazon Orders
                </h3>
                <p className="text-xs text-slate-500">
                  Converting ZPL & Cross-Verifying Invoices
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-[#B88728]">
                {Math.round(progress)}%
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Real-Time Progress
              </span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="my-6 space-y-2">
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#E8C16D] via-[#D4A343] to-[#B88728] shadow-sm relative overflow-hidden"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                transition={{ ease: "easeInOut", duration: 0.2 }}
              >
                {/* Shimmer animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
              </motion.div>
            </div>

            {/* Current Stage Label */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 truncate max-w-[340px]">
                {currentStage || "Processing..."}
              </span>
              <span className="text-slate-400 font-mono">
                {Math.round(progress)} / 100
              </span>
            </div>
          </div>

          {/* Stepper Checklist */}
          <div className="space-y-3 rounded-2xl bg-slate-50/80 p-4 border border-slate-200/80">
            {STAGES.map((stage, idx) => {
              const isCompleted = progress >= stage.threshold;
              const isCurrent =
                progress < stage.threshold &&
                (idx === 0 || progress >= STAGES[idx - 1].threshold);

              const Icon = stage.icon;

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 transition-opacity ${
                    isCompleted
                      ? "text-slate-800 opacity-100"
                      : isCurrent
                      ? "text-[#0A0E1A] opacity-100 font-medium"
                      : "text-slate-400 opacity-50"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <div className="grid h-4 w-4 place-items-center">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B88728] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B88728]"></span>
                        </span>
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-300 grid place-items-center text-[10px] text-slate-400">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold leading-none">
                      {stage.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {stage.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 text-center">
            <p className="text-[11px] text-slate-400">
              Please keep this tab open while order files are being converted and verified.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

