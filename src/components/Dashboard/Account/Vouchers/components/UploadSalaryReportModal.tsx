"use client";

import React, { useState, useRef } from "react";
import { AlertTriangle, Upload, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ThemeSelectDropdown, { type ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import type { BankBookOption } from "../types/bankVoucher.types";

interface UploadSalaryReportModalProps {
  open: boolean;
  onClose: () => void;
  bankBooks: BankBookOption[];
  onUpload: (
    file: File,
    bankBook: { bankBookId?: string; bankBookName: string; bankName?: string }
  ) => Promise<void>;
}

export default function UploadSalaryReportModal({
  open,
  onClose,
  bankBooks,
  onUpload,
}: UploadSalaryReportModalProps) {
  const [selectedBookLabel, setSelectedBookLabel] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankBookOptions: ThemeSelectOption[] = bankBooks.map((b) => ({
    value: b.label,
    label: b.label,
  }));

  const handleClose = () => {
    if (submitting) return;
    setError("");
    setSelectedFile(null);
    setSelectedBookLabel("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedBookLabel) {
      setError("Please select a Bank Book.");
      return;
    }
    if (!selectedFile) {
      setError("Please choose an Excel file (.xlsx or .xls).");
      return;
    }

    const matchedBook = bankBooks.find((b) => b.label === selectedBookLabel);
    try {
      setSubmitting(true);
      await onUpload(selectedFile, {
        bankBookId: matchedBook?.id,
        bankBookName: selectedBookLabel,
        bankName: matchedBook?.bankName || selectedBookLabel,
      });
      setSelectedFile(null);
      setSelectedBookLabel("");
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to upload salary report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload Salary Report"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="h-9 px-4 rounded-xl text-xs font-medium border border-[#E7E0D2] dark:border-white/[0.12] text-[#0A0E1A] dark:text-slate-200 hover:bg-[#F7F5F0] dark:hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="upload-salary-report-form"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl text-xs font-bold bg-[#E8C16D] hover:bg-[#d8b05c] text-[#0A0E1A] disabled:opacity-60 transition-all shadow-xs"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Upload
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="upload-salary-report-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#0A0E1A] dark:text-slate-200 mb-1.5">
            Bank Book
          </label>
          <ThemeSelectDropdown
            value={selectedBookLabel}
            onChange={(val) => setSelectedBookLabel(val)}
            options={bankBookOptions}
            placeholder="Select bank book."
            usePortal
            className="w-full"
            buttonClassName="w-full h-11"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#0A0E1A] dark:text-slate-200 mb-1.5">
            Excel File
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-3.5 rounded-xl text-xs font-semibold border border-[#E7E0D2] dark:border-white/[0.14] bg-[#F7F5F0] dark:bg-[#131B2E] text-[#0A0E1A] dark:text-slate-100 hover:bg-[#FEFAEE] dark:hover:bg-white/[0.08] transition-colors"
            >
              Choose File
            </button>
            <span className="text-xs text-[#6B7280] dark:text-slate-400 truncate max-w-[240px]">
              {selectedFile ? selectedFile.name : "No file chosen"}
            </span>
          </div>
        </div>

        <div className="rounded-xl p-3 bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25">
          <div className="flex items-center gap-2 text-amber-800 dark:text-[#F5C451] text-xs font-semibold mb-1">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Attention</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-200/90 leading-relaxed">
            Before uploading bank payment statement, make sure payment confirmed from bank.
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
        )}
      </form>
    </Modal>
  );
}
