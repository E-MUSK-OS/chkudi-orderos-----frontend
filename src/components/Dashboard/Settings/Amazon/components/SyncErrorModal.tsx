"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";
import type { AmazonSyncLog } from "../types/amazon.types";

interface SyncErrorModalProps {
  open: boolean;
  onClose: () => void;
  log: AmazonSyncLog | null;
}

export default function SyncErrorModal({ open, onClose, log }: SyncErrorModalProps) {
  if (!log) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Sync Details: ${log.syncType}`}
      description="Detailed log payload and error message captured during the operation."
      footer={
        <div className="flex justify-end">
          <Button variant="outline" fullWidth={false} onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-1">
        {/* Error Message */}
        {log.errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs sm:text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle size={16} className="text-rose-600" />
              Error Description
            </div>
            <p className="font-mono mt-1 text-xs break-all">{log.errorMessage}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs sm:text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            Operation finished without unhandled errors.
          </div>
        )}

        {/* Operation Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-xl bg-[#FAF8F5] p-3 dark:bg-white/[0.03]">
            <span className="text-slate-400">Total Processed</span>
            <p className="font-bold text-sm text-[#0A0E1A] dark:text-white mt-0.5">{log.itemsProcessed}</p>
          </div>
          <div className="rounded-xl bg-[#FAF8F5] p-3 dark:bg-white/[0.03]">
            <span className="text-emerald-600">Created</span>
            <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">+{log.itemsCreated}</p>
          </div>
          <div className="rounded-xl bg-[#FAF8F5] p-3 dark:bg-white/[0.03]">
            <span className="text-blue-600">Updated</span>
            <p className="font-bold text-sm text-blue-700 dark:text-blue-400 mt-0.5">~{log.itemsUpdated}</p>
          </div>
          <div className="rounded-xl bg-[#FAF8F5] p-3 dark:bg-white/[0.03]">
            <span className="text-rose-600">Failed</span>
            <p className="font-bold text-sm text-rose-700 dark:text-rose-400 mt-0.5">{log.itemsFailed}</p>
          </div>
        </div>

        {/* Technical Details JSON */}
        {log.details && (
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
              Execution Context (JSON)
            </span>
            <pre className="max-h-60 overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-slate-100 dark:bg-black/60">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}
