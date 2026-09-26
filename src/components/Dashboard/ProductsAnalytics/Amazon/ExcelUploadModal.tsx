"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { getToken } from "@/utils/auth";
import { toast } from "sonner";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: ExcelUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
  };

  const processExcel = async (fileToProcess: File) => {
    setIsUploading(true);
    try {
      const arrayBuffer = await fileToProcess.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];
      const parsedData: { sku: string; url: string }[] = [];

      worksheet.eachRow((row, rowNumber) => {
        // Skip header if it is row 1 and has 'sku'
        if (rowNumber === 1) {
          const firstCell = row.getCell(1).text?.toLowerCase();
          if (firstCell && firstCell.includes("sku")) return;
        }

        const cell = row.getCell(1);
        let skuText = cell.text || cell.value?.toString() || "";
        let urlText = "";

        if (cell.hyperlink) {
          urlText = cell.hyperlink;
        }
        
        skuText = skuText.trim();
        if (skuText) {
          parsedData.push({ sku: skuText, url: urlText });
        }
      });

      if (parsedData.length === 0) {
        toast.error("No valid data found in the Excel file.");
        setIsUploading(false);
        return;
      }

      const token = getToken();
      if (!token) {
        toast.error("Not authenticated");
        setIsUploading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/amazon-analytics/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: parsedData }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Data uploaded successfully");
        onSuccess();
        onClose();
        setFile(null);
      } else {
        toast.error(data.message || "Failed to upload data");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error processing Excel file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadToServer = () => {
    if (file) {
      processExcel(file);
    } else {
      toast.error("Please select a file first");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-6 shadow-xl relative m-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0A0E1A] text-sm sm:text-base">
                1. Excel Upload
              </h3>
              <p className="text-xs text-slate-500">Upload an .xlsx file containing SKUs and URLs</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
              Required
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              disabled={isUploading}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="mt-4 sm:mt-5 flex-1 flex flex-col justify-between">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group relative flex min-h-[170px] sm:min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 sm:p-6 text-center transition-all ${
                isDragging
                  ? "border-[#E8C16D] bg-[#FFF9EC]"
                  : "border-slate-300 bg-slate-50/50 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40"
              }`}
            >
              <div className="mb-2 sm:mb-3 grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition-transform group-hover:scale-110 group-hover:text-emerald-500">
                <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>

              <p className="text-xs sm:text-sm font-semibold text-[#0A0E1A]">
                Click to upload or drag & drop Excel(s)
              </p>
              <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                Select a valid Excel (<code className="font-mono text-emerald-600">.xlsx</code>) file
              </p>

              <div className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0A0E1A] bg-white px-3 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group-hover:border-[#E8C16D]">
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                Browse Excel Files
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/20 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/60 bg-white p-3 sm:p-4 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0A0E1A]" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs font-medium text-red-600 hover:underline px-1"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isUploading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadToServer}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0A0E1A] px-6 py-2 text-sm font-semibold text-[#E8C16D] hover:bg-[#0A0E1A]/90 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} /> Upload Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            accept=".xlsx, .xls"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
