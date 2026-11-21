"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  Calendar,
  FileText,
  Package,
} from "lucide-react";

export interface DeleteBatchInfo {
  id: string;
  formattedDate: string;
  totalOrders: number;
  printedCount?: number;
  fileName?: string;
  platform?: "flipkart" | "amazon";
}

interface DeleteBatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
  batchInfo: DeleteBatchInfo | null;
}

export default function DeleteBatchConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  batchInfo,
}: DeleteBatchConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !batchInfo || !mounted) return null;

  const platformTitle = batchInfo.platform === "amazon" ? "Amazon" : "Flipkart";

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/70 p-3 sm:p-4 backdrop-blur-md select-none"
        onClick={(e) => {
          e.stopPropagation();
          if (!isLoading) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-7 shadow-2xl text-slate-900 dark:text-white overflow-hidden"
        >
          {/* Top-Right Close Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 grid h-8 w-8 place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Cancel and Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-[#E8C16D]/10 blur-3xl" />

          {/* HUD Emblem with Rotating Dashed Rings */}
          <div className="relative my-2 sm:my-3 flex justify-center">
            <div className="relative grid h-16 w-16 sm:h-18 sm:w-18 place-items-center">
              {/* Outer Dashed Rose Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-rose-400 dark:border-rose-500/60"
              />

              {/* Counter-Clockwise Inner Halo */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
                className="absolute inset-1.5 rounded-full border border-rose-500/30"
              />

              {/* Central Core with Trash Icon */}
              <motion.div
                animate={{ scale: [0.96, 1.04, 0.96] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-full bg-[#0A0E1A] border-2 border-rose-500 shadow-md text-white"
              >
                <Trash2 className="h-5 w-5 text-rose-500 animate-pulse" />
              </motion.div>
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-1.5 mb-4">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Delete Processed Batch?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Are you sure you want to permanently delete this {platformTitle} batch? All associated shipping labels, invoices, and AWB tracking scans will be permanently removed.
            </p>
          </div>

          {/* Batch Details Summary Card */}
          <div className="mb-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] p-3 sm:p-4 space-y-2 text-xs">
            {/* Batch Date & Time */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Processed At:</span>
              </span>
              <span className="font-bold text-[#0A0E1A] dark:text-white font-mono">
                {batchInfo.formattedDate}
              </span>
            </div>

            {/* Total Orders & Printed Count */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Total Orders:</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#0A0E1A] dark:text-white">
                  {batchInfo.totalOrders} {batchInfo.totalOrders === 1 ? "Order" : "Orders"}
                </span>
                {typeof batchInfo.printedCount === "number" && batchInfo.printedCount > 0 && (
                  <span className="rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    {batchInfo.printedCount} Printed
                  </span>
                )}
              </div>
            </div>

            {/* Source Files */}
            {batchInfo.fileName && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400 shrink-0">
                  <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>File(s):</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[240px]" title={batchInfo.fileName}>
                  {batchInfo.fileName}
                </span>
              </div>
            )}
          </div>

          {/* Warning Banner */}
          <div className="mb-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/20 p-3 sm:p-3.5 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-bold">This action cannot be undone.</strong> The batch and all of its order records will be permanently removed from your system and AWB scans.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="w-full sm:flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] hover:bg-slate-100 dark:hover:bg-white/[0.04] px-4 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className="w-full sm:flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 hover:from-red-700 hover:to-rose-800 px-5 text-xs sm:text-sm font-black text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Deleting Batch...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 text-white" />
                  <span>Yes, Delete Batch</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
