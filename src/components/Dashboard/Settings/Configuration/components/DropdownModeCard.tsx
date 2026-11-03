"use client";

import React from "react";
import {
  SlidersHorizontal,
  PlusCircle,
  Check,
  ShieldCheck,
  Sparkles,
  Lock,
  Database,
  ArrowRight,
} from "lucide-react";
import type { DropdownManagementMode } from "../types/clientConfiguration.types";

interface Props {
  mode: DropdownManagementMode;
  onChange: (mode: DropdownManagementMode) => void;
}

export default function DropdownModeCard({ mode, onChange }: Props) {
  const isSettingMasters = mode === "SETTING_MASTERS";
  const isFormOther = mode === "FORM_OTHER";

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm transition-all duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E7E0D2]/70 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0 shadow-2xs">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-[#0A0E1A] dark:text-white tracking-tight">
                Dropdown Governance & Option Management
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 uppercase tracking-wider">
                System Policy
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose how dropdown choices are created and governed across Products, Materials, and User forms.
            </p>
          </div>
        </div>

        {/* Current Active Mode Pill */}
        <div className="self-start sm:self-center shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E8C16D]/40 bg-[#FFF9EC]/80 dark:bg-[#1A160E]/80 text-[#0A0E1A] dark:text-white text-xs font-bold shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[#E8C16D] dark:bg-[#F5C451] animate-pulse" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Active Mode:</span>
            <span className="text-[#B88728] dark:text-[#E8C16D]">
              {isSettingMasters ? "Setting Masters Only" : "Allow Other in Forms & Setting Masters"}
            </span>
          </div>
        </div>
      </div>

      {/* 2 Interactive Options Grid (Side-by-side in Amazon theme) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 mt-3.5 sm:mt-4">
        {/* OPTION 1: Setting Masters Only (Centralized) */}
        <button
          type="button"
          onClick={() => onChange("SETTING_MASTERS")}
          className={`group w-full p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
            isSettingMasters
              ? "border-[#E8C16D] bg-[#FFFDF9] dark:bg-[#151C2C] ring-2 ring-[#E8C16D]/25 dark:border-[#F5C451] dark:ring-[#F5C451]/20 shadow-sm"
              : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] hover:border-[#E8C16D]/40 hover:bg-[#FFF9EC]/20 dark:hover:bg-white/[0.02]"
          }`}
        >
          <div>
            {/* Top Row: Icon + Title + Badge + Radio */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${
                    isSettingMasters
                      ? "bg-[#E8C16D] text-[#0A0E1A] dark:bg-[#F5C451] dark:text-black shadow-xs font-bold"
                      : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 group-hover:text-[#B88728] dark:group-hover:text-[#E8C16D]"
                  }`}
                >
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-[#0A0E1A] dark:text-white tracking-tight">
                      Setting Masters Only
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                      <Sparkles className="w-2.5 h-2.5" />
                      Recommended
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    Centralized Master Control
                  </span>
                </div>
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  isSettingMasters
                    ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] dark:bg-[#F5C451] dark:border-[#F5C451] dark:text-black shadow-xs"
                    : "border-slate-300 dark:border-white/20 bg-transparent group-hover:border-[#E8C16D]/60"
                }`}
              >
                {isSettingMasters && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Description */}
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              All dropdown options (Brand, Category, Color, Rack, Reference Party, etc.) must be added and managed in{" "}
              <strong className="text-[#0A0E1A] dark:text-white font-bold">Setting Masters</strong>. The{" "}
              <span className="text-amber-700 dark:text-[#E8C16D] font-bold">&quot;+ Other&quot;</span> button is{" "}
              <strong className="text-rose-600 dark:text-rose-400">completely hidden in all forms</strong>, ensuring zero duplicate data.
            </p>
          </div>

          {/* Feature Badges Footer */}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              Setting Masters: Full Access
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
              Forms: &quot;+ Other&quot; Hidden
            </span>
          </div>
        </button>

        {/* OPTION 2: Allow Other in Forms (Inline Creation) */}
        <button
          type="button"
          onClick={() => onChange("FORM_OTHER")}
          className={`group w-full p-4 sm:p-4.5 rounded-2xl sm:rounded-3xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
            isFormOther
              ? "border-[#E8C16D] bg-[#FFFDF9] dark:bg-[#151C2C] ring-2 ring-[#E8C16D]/25 dark:border-[#F5C451] dark:ring-[#F5C451]/20 shadow-sm"
              : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] hover:border-[#E8C16D]/40 hover:bg-[#FFF9EC]/20 dark:hover:bg-white/[0.02]"
          }`}
        >
          <div>
            {/* Top Row: Icon + Title + Badge + Radio */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-xl transition-colors ${
                    isFormOther
                      ? "bg-[#E8C16D] text-[#0A0E1A] dark:bg-[#F5C451] dark:text-black shadow-xs font-bold"
                      : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 group-hover:text-[#B88728] dark:group-hover:text-[#E8C16D]"
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-[#0A0E1A] dark:text-white tracking-tight">
                      Allow &quot;+ Other&quot; in Forms &amp; Setting Masters
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20">
                      Dual Access
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    Flexible Inline &amp; Centralized Control (2-Way Instant Sync)
                  </span>
                </div>
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  isFormOther
                    ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] dark:bg-[#F5C451] dark:border-[#F5C451] dark:text-black shadow-xs"
                    : "border-slate-300 dark:border-white/20 bg-transparent group-hover:border-[#E8C16D]/60"
                }`}
              >
                {isFormOther && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Description */}
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Users can add options on the fly using{" "}
              <strong className="text-[#0A0E1A] dark:text-white font-bold">&quot;+ Other&quot;</strong> in form dropdowns, and Admins can also manage, edit, and configure options in{" "}
              <strong className="text-[#0A0E1A] dark:text-white font-bold">Setting Masters</strong>. All additions and edits{" "}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">reflect to both places instantly</strong> without conflicts.
            </p>
          </div>

          {/* Feature Badges Footer */}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
              <PlusCircle className="w-3 h-3" />
              Forms: &quot;+ Other&quot; Active
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
              <ShieldCheck className="w-3 h-3" />
              Setting Masters: Full Access
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20">
              <Sparkles className="w-3 h-3" />
              Instant 2-Way Sync
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}
