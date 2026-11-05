"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { salariedEmployeeService } from "../services/salariedEmployee.service";
import {
  parseAttendanceCsv,
  downloadBlankAttendanceTemplate,
} from "../utils/attendanceTemplate";

interface UploadAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadAttendanceModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Please upload a .csv, .xlsx, or .xls file.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    try {
      setUploading(true);
      const text = await selectedFile.text();
      const records = parseAttendanceCsv(text);

      if (records.length === 0) {
        toast.error("No valid attendance records found in file. Check format.");
        return;
      }

      const res = await salariedEmployeeService.uploadAttendance(records);
      toast.success(`Successfully uploaded ${res.importedCount} attendance records.`);

      if (res.errors && res.errors.length > 0) {
        toast.error(`${res.errors.length} records had issues: ${res.errors[0]}`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload attendance file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#E7E0D2] dark:bg-[#0F1626] dark:border-white/[0.08] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E7E0D2] bg-[#FAF8F5] dark:border-white/[0.08] dark:bg-[#080B11]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A0E1A] dark:text-white leading-tight">
                Upload Attendance Record
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload monthly absent and overtime hours
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-black hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* File Drop Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-44 rounded-2xl border-2 border-dashed border-[#E7E0D2] hover:border-[#E8C16D] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] dark:border-white/[0.12] dark:hover:border-[#E8C16D]/50 dark:bg-[#080B11]/60 dark:hover:bg-[#080B11] flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0A0E1A] dark:text-white break-all">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Click to change
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 group-hover:scale-105 flex items-center justify-center text-[#B88728] dark:text-[#E8C16D] transition-all">
                  <Upload size={22} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to select CSV / Excel attendance file
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Supports .csv, .xlsx formatted with employee attendance
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Download Template Hint */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E7E0D2] dark:border-white/[0.06]">
            <span className="text-slate-500 dark:text-slate-400">Need the correct columns format?</span>
            <button
              type="button"
              onClick={() => downloadBlankAttendanceTemplate()}
              className="inline-flex items-center gap-1.5 text-xs text-[#B88728] dark:text-[#E8C16D] font-bold hover:underline cursor-pointer"
            >
              <Download size={13} />
              <span>Download Template</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E7E0D2] bg-[#FAF8F5] dark:border-white/[0.08] dark:bg-[#080B11]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.98] text-[#0A0E1A] font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin text-[#0A0E1A]" />
            ) : (
              <Upload size={16} className="text-[#0A0E1A] stroke-[2.5]" />
            )}
            <span>{uploading ? "Uploading..." : "Upload Record"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
