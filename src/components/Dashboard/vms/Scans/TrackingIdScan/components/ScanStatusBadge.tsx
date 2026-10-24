"use client";

import { CheckCircle2, Clock } from "lucide-react";

interface Props {
  status: "PENDING" | "SCANNED";
}

export default function ScanStatusBadge({ status }: Props) {
  if (status === "SCANNED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        <span>SCANNED</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
      <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
      <span>PENDING</span>
    </span>
  );
}