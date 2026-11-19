"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileCheck, FileText } from "lucide-react";

interface ProcessingProgressModalProps {
  isOpen: boolean;
  progress: number;
  currentStage: string;
}

export default function ProcessingProgressModal({
  isOpen,
  progress,
  currentStage,
}: ProcessingProgressModalProps) {
  if (!isOpen) return null;

  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-xl sm:max-w-2xl overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-10 shadow-2xl dark:border-[#E8C16D]/30 dark:bg-[#0A0E1A]"
        >
          {/* Subtle Ambient Background Glows */}
          <div className="pointer-events-none absolute -top-20 -left-20 h-52 w-52 rounded-full bg-[#FFF9EC] blur-3xl dark:bg-[#E8C16D]/10" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-52 w-52 rounded-full bg-amber-500/10 blur-3xl" />

          {/* Top Title Section */}
          <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
            <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-[#0A0E1A] dark:text-white">
              Processing Orders
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Extracting shipping labels & organizing documents in real-time.
            </p>
          </div>

          {/* Aesthetic Visual Animation Pipeline */}
          <div className="relative my-6 sm:my-10 flex items-center justify-between px-1 sm:px-6">
            {/* SVG Connecting Track */}
            <svg
              className="absolute left-6 right-6 sm:left-10 sm:right-10 top-1/2 -z-0 h-2 w-[calc(100%-3rem)] sm:w-[calc(100%-5rem)] -translate-y-1/2 overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Base Track */}
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="4"
                strokeDasharray="6 6"
              />

              {/* Active Gold Progress Track */}
              <motion.line
                x1="0"
                y1="50%"
                x2={`${pct}%`}
                y2="50%"
                stroke="url(#orderos-gold-gradient)"
                strokeWidth="5"
                strokeLinecap="round"
                transition={{ ease: "easeInOut", duration: 0.2 }}
              />

              <defs>
                <linearGradient id="orderos-gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E8C16D" />
                  <stop offset="50%" stopColor="#D4A343" />
                  <stop offset="100%" stopColor="#B88728" />
                </linearGradient>
              </defs>
            </svg>

            {/* NODE 1: SOURCE INPUT PDF */}
            <div className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-2">
              <motion.div
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="relative h-16 w-14 sm:h-24 sm:w-20 overflow-hidden rounded-xl sm:rounded-2xl border border-red-200 bg-white p-1.5 sm:p-2.5 shadow-md flex flex-col justify-between dark:border-red-500/30 dark:bg-[#161D2E]"
              >
                {/* Mini Red Scanning Beam */}
                <motion.div
                  animate={{ y: [0, 50, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#EF4444]"
                />

                <div className="flex items-center justify-between border-b border-slate-100 pb-0.5 sm:pb-1 dark:border-slate-700">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  <span className="text-[8px] sm:text-[9px] font-extrabold text-red-600">PDF</span>
                </div>
                {/* Simulated Content */}
                <div className="space-y-0.5 sm:space-y-1 my-auto">
                  <div className="h-1 sm:h-1.5 w-full rounded bg-red-100 dark:bg-slate-700" />
                  <div className="h-1 sm:h-1.5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-1 sm:h-1.5 w-5/6 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-semibold text-slate-500 text-center truncate">Flipcart PDF</span>
              </motion.div>
              <span className="text-[10px] sm:text-xs font-bold text-[#0A0E1A] dark:text-white text-center">1. Input PDF</span>
            </div>

            {/* NODE 2: CENTRAL HUD RING */}
            <div className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="relative grid h-20 w-20 sm:h-28 sm:w-28 place-items-center">
                {/* Clockwise Outer Dash Gold Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-[#E8C16D] shadow-sm"
                />

                {/* Inner Counter-Clockwise Thin Ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  className="absolute inset-1.5 sm:inset-2 rounded-full border border-[#B88728]/30"
                />

                {/* Central HUD Reader Core */}
                <motion.div
                  animate={{ scale: [0.96, 1.04, 0.96] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="grid h-14 w-14 sm:h-20 sm:w-20 place-items-center rounded-full bg-[#0A0E1A] border-2 border-[#E8C16D] shadow-xl text-white"
                >
                  <div className="text-center">
                    <span className="font-mono text-base sm:text-2xl font-black tracking-tighter text-[#E8C16D] block">
                      {pct}%
                    </span>
                    <span className="text-[7px] sm:text-[9px] font-bold text-slate-400 block uppercase tracking-wider -mt-0.5 sm:-mt-1">
                      PROCESSING
                    </span>
                  </div>
                </motion.div>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-[#B88728] dark:text-[#E8C16D]">
                Processing
              </span>
            </div>

            {/* NODE 3: OUTPUT ORDERS */}
            <div className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-2">
              <motion.div
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
                className={`relative h-16 w-14 sm:h-24 sm:w-20 overflow-hidden rounded-xl sm:rounded-2xl border p-1.5 sm:p-2.5 shadow-md flex flex-col justify-between transition-all duration-300 ${
                  pct >= 90
                    ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950/30"
                    : "border-amber-200 bg-white dark:border-amber-500/30 dark:bg-[#161D2E]"
                }`}
              >
                {/* Mini Scanning Beam */}
                <motion.div
                  animate={{ y: [0, 50, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent ${
                    pct >= 90 ? "via-emerald-500" : "via-amber-500"
                  } to-transparent shadow-[0_0_8px_#F59E0B]`}
                />

                <div className="flex items-center justify-between border-b border-slate-100 pb-0.5 sm:pb-1 dark:border-slate-700">
                  <FileCheck className={`h-3 w-3 sm:h-4 sm:w-4 ${pct >= 90 ? "text-emerald-600" : "text-amber-600"}`} />
                  <span className={`text-[8px] sm:text-[9px] font-extrabold ${pct >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
                    READY
                  </span>
                </div>
                {/* Simulated Content */}
                <div className="space-y-0.5 sm:space-y-1 my-auto">
                  <div className={`h-1 sm:h-1.5 w-full rounded ${pct >= 90 ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <div className={`h-1 sm:h-1.5 w-3/4 rounded ${pct >= 90 ? "bg-emerald-300" : "bg-amber-300"}`} />
                  <div className={`h-1 sm:h-1.5 w-5/6 rounded ${pct >= 90 ? "bg-emerald-300" : "bg-slate-300 dark:bg-slate-700"}`} />
                </div>
                <span className="text-[8px] sm:text-[9px] font-semibold text-slate-500 text-center truncate">
                  Labels & Invoices
                </span>
              </motion.div>
              <span className="text-[10px] sm:text-xs font-bold text-[#0A0E1A] dark:text-white text-center">2. Output</span>
            </div>
          </div>

          {/* PROGRESS BAR & STAGE BADGE matching Amazon Modal */}
          <div className="space-y-4">
            {/* Shimmer Progress Bar */}
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#E8C16D] via-[#D4A343] to-[#B88728] shadow-sm relative overflow-hidden"
                initial={{ width: "0%" }}
                animate={{ width: `${pct}%` }}
                transition={{ ease: "easeInOut", duration: 0.25 }}
              >
                {/* Flowing Light Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
              </motion.div>
            </div>

            {/* Dynamic Status Pill */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#E8C16D]/30 bg-[#FFF9EC] px-5 py-2 text-xs font-bold text-[#0A0E1A] shadow-sm dark:bg-[#111728] dark:text-white">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B88728] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B88728]"></span>
                </span>
                <span className="truncate max-w-[340px]">
                  {currentStage || "Processing Flipcart Orders..."}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Warning Note */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Please do not refresh or close this browser tab while processing.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
