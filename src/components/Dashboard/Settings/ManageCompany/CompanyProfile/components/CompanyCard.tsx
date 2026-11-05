"use client";

import React, { useState } from "react";
import { User, FileText, Eye, Edit3, Trash2 } from "lucide-react";
import { Company } from "../types/company.types";
import { getMediaUrl, getCompanyInitials } from "@/lib/utils";

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
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative bg-white border border-[#E7E0D2] hover:border-[#E8C16D] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 dark:bg-[#0F1626] dark:border-white/[0.08] dark:hover:border-white/[0.18] dark:shadow-lg dark:hover:shadow-2xl flex flex-col justify-between w-full">
      <div>
        {/* Top Header: Logo + Title + Status + Code matching Image 2 */}
        <div className="flex items-start gap-3.5">
          {/* Logo container matching Image 2 */}
          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#161B26] dark:border-white/[0.1] flex items-center justify-center shrink-0 shadow-xs overflow-hidden select-none">
            {company.logoUrl && !imageError ? (
              <img
                src={getMediaUrl(company.logoUrl)}
                alt={company.companyName}
                className="w-full h-full object-contain p-1"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-wider uppercase select-none font-sans">
                {getCompanyInitials(company.companyName)}
              </span>
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

              {/* Status Badge matching Image 2 */}
              <div className="shrink-0 mt-0.5">
                {isActive && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                )}
                {isDraft && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Draft
                  </span>
                )}
                {!isActive && !isDraft && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
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

        {/* Middle Details: Owner & GSTN matching Image 2 */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-2 gap-4">
          {/* Owner Details */}
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.08] flex items-center justify-center shrink-0 text-slate-400 mt-0.5">
              <User size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                Owner
              </p>
              <p
                className="text-xs font-medium text-slate-800 dark:text-slate-200 uppercase leading-snug break-words mt-0.5"
                title={company.ownerName || "Not Specified"}
              >
                {company.ownerName || "—"}
              </p>
            </div>
          </div>

          {/* GSTN Details */}
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.08] flex items-center justify-center shrink-0 text-slate-400 mt-0.5">
              <FileText size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                GSTN
              </p>
              <p
                className="text-xs font-medium font-mono text-slate-800 dark:text-slate-200 mt-0.5 tracking-wider break-all"
                title={company.gstNumber}
              >
                {company.gstNumber || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar: Active/Draft Switch & Delete on left, View + Edit on right */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
        {/* Left: Active/Draft Switch & Delete */}
        <div className="flex items-center gap-3">
          {/* Active / Draft Status Switch matching Image 2 */}
          <label
            className={`relative inline-flex items-center select-none ${
              togglingStatus ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
            title={
              isActive
                ? "Status: Active (Click to set as Draft)"
                : "Status: Draft (Click to set as Active)"
            }
          >
            <input
              type="checkbox"
              checked={isActive}
              disabled={togglingStatus}
              onChange={() => onToggleStatus(company)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500 transition-colors"></div>
          </label>

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

        {/* Right: View & Edit buttons matching Image 2 */}
        <div className="flex items-center gap-2">
          {onView && (
            <button
              type="button"
              onClick={() => onView(company)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 hover:text-black dark:border-white/[0.1] dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <Eye size={13} className="text-slate-400" />
              <span>View</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onModify(company)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 hover:text-black dark:border-white/[0.1] dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer active:scale-95"
          >
            <Edit3 size={13} className="text-slate-400" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
