"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { parseCsvFile } from "../utils/excelTemplate";
import { ledgerService } from "../services/ledger.service";
import { toast } from "sonner";

interface UploadLedgerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadLedgerModal({
  open,
  onClose,
  onSuccess,
}: UploadLedgerModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = (selectedFile: File) => {
    if (
      !selectedFile.name.endsWith(".csv") &&
      !selectedFile.name.endsWith(".xlsx") &&
      !selectedFile.name.endsWith(".xls")
    ) {
      toast.error("Please upload a CSV or Excel file.");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const items = parseCsvFile(text);
        setParsedItems(items);
        if (items.length === 0) {
          toast.warning("No valid ledger rows detected in file. Please check template format.");
        } else {
          toast.success(`Detected ${items.length} ledgers ready for import.`);
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to parse file. Please use the blank template format.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const handleUploadSubmit = async () => {
    if (!parsedItems.length) {
      toast.error("No valid ledger entries to import.");
      return;
    }

    try {
      setIsUploading(true);
      const res = await ledgerService.bulkImport(parsedItems);
      toast.success(res.message || `Successfully imported ${parsedItems.length} ledgers.`);
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to import ledgers.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedItems([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E121A] border border-[#E7E0D2] dark:border-white/[0.1] shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50 dark:bg-[#131622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Upload size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Upload Ledger Book
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Import multiple ledger accounts from CSV or Excel file
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#E8C16D] bg-amber-400/5"
                : file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-slate-300 hover:border-[#E8C16D] bg-slate-50/70 hover:bg-slate-50 dark:border-white/[0.12] dark:hover:border-white/30 dark:bg-[#131622]/50 dark:hover:bg-[#131622]"
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{file.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB • {parsedItems.length} ledgers detected
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 dark:bg-white/[0.04] dark:border-white/[0.08] flex items-center justify-center text-slate-500 dark:text-slate-300 mb-3">
                  <FileSpreadsheet size={24} />
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                  Drag and drop your CSV/Excel file here
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  or <span className="text-[#B88728] dark:text-amber-400 underline font-medium">browse from device</span>
                </p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
            Need the correct column structure? Click "Blank Template" in the header to download the template.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50 dark:bg-[#131622]">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={!parsedItems.length || isUploading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#F5C451] hover:bg-[#e8b83e] text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md active:scale-95"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin text-slate-900" />
                <span>Importing...</span>
              </>
            ) : (
              <span>Import {parsedItems.length ? `(${parsedItems.length})` : ""}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

