"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export default function ProductStatusBadge({
  isActive,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400"
      }`}
    >
      {isActive ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5" />
      )}
      <span>{isActive ? activeLabel : inactiveLabel}</span>
    </span>
  );
}