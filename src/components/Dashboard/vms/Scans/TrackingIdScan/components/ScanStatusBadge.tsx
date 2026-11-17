"use client";

import { CheckCircle2, Clock } from "lucide-react";

interface Props {
  status: "PENDING" | "SCANNED";
}

export default function ScanStatusBadge({ status }: Props) {
  if (status === "SCANNED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 bg-transparent px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>SCANNED</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 dark:border-amber-500/30 bg-transparent px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-400">
      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
      <span>PENDING</span>
    </span>
  );
}