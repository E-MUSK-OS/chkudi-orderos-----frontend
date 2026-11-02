"use client";

import React from "react";
import { Download, Upload, Users } from "lucide-react";

interface SalariedEmployeeHeaderProps {
  onDownloadTemplate: () => void;
  onUploadClick: () => void;
}

export default function SalariedEmployeeHeader({
  onDownloadTemplate,
  onUploadClick,
}: SalariedEmployeeHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
      {/* Title & Subtitle matching Image 1 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0E1A] dark:text-white">
          Salaried Employee
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage salaried employees
        </p>
      </div>

      {/* Top Right Action Buttons matching Image 1 */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Blank Template Button */}
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl border border-[#E7E0D2] bg-white hover:bg-slate-50 text-slate-700 hover:text-black dark:border-white/[0.1] dark:bg-[#161B24] dark:hover:bg-white/[0.06] dark:text-slate-200 text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          title="Download Blank Attendance Template"
        >
          <Download size={15} className="text-slate-500 dark:text-slate-300" />
          <span>Blank Template</span>
        </button>

        {/* Upload Attendance Record Button */}
        <button
          type="button"
          onClick={onUploadClick}
          className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl border border-[#E7E0D2] bg-white hover:bg-slate-50 text-slate-700 hover:text-black dark:border-white/[0.1] dark:bg-[#161B24] dark:hover:bg-white/[0.06] dark:text-slate-200 text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          title="Upload Attendance Record"
        >
          <Upload size={15} className="text-slate-500 dark:text-slate-300" />
          <span>Upload Attendance Record</span>
        </button>
      </div>
    </div>
  );
}

