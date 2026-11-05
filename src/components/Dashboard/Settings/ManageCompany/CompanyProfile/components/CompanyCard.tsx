"use client";

import React from "react";
import { User, FileText, Eye, Edit3, Trash2, Check } from "lucide-react";
import { Company } from "../types/company.types";
import { getMediaUrl } from "@/lib/utils";

interface CompanyCardProps {
  company: Company;
  onModify: (company: Company) => void;
  onToggleStatus: (company: Company) => void;
  onDelete?: (company: Company) => void;
  onView?: (company: Company) => void;
  togglingStatus?: boolean;
}

export default function CompanyCard({
  company,
  onModify,
  onToggleStatus,
  onDelete,
  onView,
  togglingStatus = false,
}: CompanyCardProps) {
  const isDraft = company.status === "DRAFT";
  const isActive = company.status === "ACTIVE";

  return (
    <div className="group relative bg-white border border-[#E7E0D2] hover:border-[#E8C16D] rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 dark:bg-[#0F1626] dark:border-white/[0.08] dark:hover:border-[#E8C16D]/50 dark:shadow-lg dark:hover:shadow-2xl flex flex-col justify-between w-full">
      <div>
        {/* Top Header: Logo + Title + Status + Code */}
        <div className="flex items-start gap-3.5">
          {/* Logo container */}
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-black dark:border-white/[0.1] flex flex-col items-center justify-center p-1.5 shrink-0 shadow-inner overflow-hidden">
            {company.logoUrl ? (
              <img
                src={getMediaUrl(company.logoUrl)}
                alt={company.companyName}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <svg
                  width="22"
                  height="16"
                  viewBox="0 0 32 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-slate-700 dark:text-white"
                >
                  <path
                    d="M16 12C12 4 4 4 4 10C4 16 12 16 16 12ZM16 12C20 4 28 4 28 10C28 16 20 16 16 12Z"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 12C15 16 14 20 13 22M16 12C17 16 18 20 19 22"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[6px] font-black uppercase tracking-tighter text-slate-800 dark:text-slate-300 mt-1 line-clamp-1 leading-none max-w-[48px]">
                  {company.companyName || "COMPANY"}
                </span>
              </div>
            )}
          </div>

          {/* Title, Status, and Code */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white tracking-wide leading-tight break-words"
                title={company.companyName || "Untitled Company"}
              >
                {company.companyName || "Untitled Company"}
              </h3>

              {/* Status Badge */}
              <div className="shrink-0 mt-0.5">
                {isActive && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#1A160E] text-[#E8C16D] border border-[#E8C16D]/30 shadow-xs">
                    <Check size={11} className="stroke-[3] text-[#E8C16D]" />
                    Active
                  </span>
                )}
                {isDraft && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Draft
                  </span>
                )}
                {!isActive && !isDraft && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Code: <span className="text-slate-800 dark:text-slate-200 font-semibold">{company.companyCode || "—"}</span>
            </p>
          </div>
        </div>

        {/* Middle Details: Owner & GSTN */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-2 gap-4">
          {/* Owner Details */}
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#FFF9EC] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:border-white/[0.08] flex items-center justify-center shrink-0 text-[#B88728] dark:text-[#E8C16D] mt-0.5">
              <User size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                Owner
              </p>
              <p
                className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase leading-snug break-words mt-0.5"
                title={company.ownerName || "Not Specified"}
              >
                {company.ownerName || "—"}
              </p>
            </div>
          </div>

          {/* GSTN Details */}
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#FFF9EC] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:border-white/[0.08] flex items-center justify-center shrink-0 text-[#B88728] dark:text-[#E8C16D] mt-0.5">
              <FileText size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                GSTN
              </p>
              <p
                className="text-xs font-semibold font-mono text-slate-800 dark:text-slate-200 mt-0.5 tracking-wider break-all"
                title={company.gstNumber}
              >
                {company.gstNumber || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar: Delete on left, View + Edit on right */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
        {/* Left: Delete */}
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(company)}
              title="Delete Company"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Right: View & Edit buttons */}
        <div className="flex items-center gap-2">
          {onView && (
            <button
              type="button"
              onClick={() => onView(company)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-black dark:border-white/[0.1] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <Eye size={13} className="text-slate-400" />
              <span>View</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onModify(company)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#E8C16D] hover:bg-[#d8b05c] text-xs font-bold text-[#0A0E1A] transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Edit3 size={13} className="text-[#0A0E1A]" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
