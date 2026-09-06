"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Puzzle,
  ToggleRight,
  Monitor,
  Printer,
  Info,
} from "lucide-react";
import { DiagnosticRow, Verdict } from "../types";

interface DiagnosticPanelProps {
  verdict: Verdict;
  rows: {
    ext: DiagnosticRow;
    toggle: DiagnosticRow;
    host: DiagnosticRow;
    printer: DiagnosticRow;
  };
  isChecking: boolean;
  onRecheck: () => void;
}

export default function DiagnosticPanel({
  verdict,
  rows,
  isChecking,
  onRecheck,
}: DiagnosticPanelProps) {
  // Verdict styling
  const verdictStyles = {
    ok: {
      border: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />,
    },
    fail: {
      border: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
      icon: <AlertTriangle className="h-6 w-6 text-rose-500 flex-shrink-0" />,
    },
    warn: {
      border: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      icon: <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />,
    },
    busy: {
      border: "border-border bg-muted/40 text-muted-foreground",
      icon: <RefreshCw className="h-6 w-6 animate-spin text-[#E8C16D] flex-shrink-0" />,
    },
  };

  const currentVerdictStyle = verdictStyles[verdict.state] || verdictStyles.busy;

  const renderStatusBadge = (state: string) => {
    switch (state) {
      case "ok":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ready
          </span>
        );
      case "warn":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Action Required
          </span>
        );
      case "fail":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Not Connected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Checking…
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Verdict Banner */}
      <div
        className={`flex flex-col gap-4 border p-5 sm:flex-row sm:items-center sm:justify-between ${currentVerdictStyle.border}`}
      >
        <div className="flex items-center gap-3">
          {currentVerdictStyle.icon}
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#0A0E1A] dark:text-white">
              {verdict.title}
            </h2>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {verdict.foot}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRecheck}
          disabled={isChecking}
          className="inline-flex h-11 items-center justify-center gap-2 border border-[#E8C16D] bg-[#0A0E1A] px-5 text-sm font-semibold text-[#E8C16D] transition hover:bg-[#E8C16D] hover:text-[#0A0E1A] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
          {isChecking ? "Checking System..." : "Re-check Connection"}
        </button>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Extension */}
        <div className="border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0A0E1A] text-[#E8C16D]">
              <Puzzle className="h-5 w-5" />
            </div>
            {renderStatusBadge(rows.ext.state)}
          </div>

          <h3 className="mt-4 text-base font-bold text-[#0A0E1A] dark:text-white">
            Chrome Extension
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {rows.ext.note}
          </p>
        </div>

        {/* Card 2: Switch */}
        <div className="border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0A0E1A] text-[#E8C16D]">
              <ToggleRight className="h-5 w-5" />
            </div>
            {renderStatusBadge(rows.toggle.state)}
          </div>

          <h3 className="mt-4 text-base font-bold text-[#0A0E1A] dark:text-white">
            Silent Print Switch
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {rows.toggle.note}
          </p>
        </div>

        {/* Card 3: Windows Program */}
        <div className="border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0A0E1A] text-[#E8C16D]">
              <Monitor className="h-5 w-5" />
            </div>
            {renderStatusBadge(rows.host.state)}
          </div>

          <h3 className="mt-4 text-base font-bold text-[#0A0E1A] dark:text-white">
            Windows Program
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {rows.host.note}
          </p>
        </div>

        {/* Card 4: Printer */}
        <div className="border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0A0E1A] text-[#E8C16D]">
              <Printer className="h-5 w-5" />
            </div>
            {renderStatusBadge(rows.printer.state)}
          </div>

          <h3 className="mt-4 text-base font-bold text-[#0A0E1A] dark:text-white">
            Thermal Printer
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {rows.printer.note}
          </p>
        </div>
      </div>
    </div>
  );
}
