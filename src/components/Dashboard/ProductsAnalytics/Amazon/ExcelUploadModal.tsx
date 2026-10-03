"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileSpreadsheet, FileDown } from "lucide-react";
import ExcelJS from "exceljs";
import { getToken } from "@/utils/auth";
import { toast } from "sonner";
import { downloadAmazonAnalyticsDemoSheet } from "./utils/downloadDemoSheet";

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
      const parsedData: { sku: string; url: string; operatorName?: string; day?: string }[] = [];

      // Check header row (row 1) to identify column positions
      let operatorColIndex = -1;
      let dayColIndex = -1;
      let skuColIndex = -1;
      let urlColIndex = -1;

      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        const val = (cell.text || cell.value?.toString() || "").toLowerCase().trim();
        if (val.includes("operator")) {
          operatorColIndex = colNumber;
        } else if (val === "day" || val.includes("day")) {
          dayColIndex = colNumber;
        } else if (val.includes("sku")) {
          skuColIndex = colNumber;
        } else if (val.includes("url") || val.includes("link") || val.includes("amazon")) {
          urlColIndex = colNumber;
        }
      });

      // If columns were not matched by header names, detect dynamically
      if (skuColIndex === -1 || urlColIndex === -1) {
        const sampleRow = worksheet.getRow(2).cellCount > 0 ? worksheet.getRow(2) : worksheet.getRow(1);
        sampleRow.eachCell((cell, colNumber) => {
          const text = (cell.text || cell.value?.toString() || "").toLowerCase();
          if (text.startsWith("http") || text.includes("amazon") || cell.hyperlink) {
            urlColIndex = colNumber;
          }
        });

        if (urlColIndex !== -1) {
          skuColIndex = urlColIndex > 1 ? urlColIndex - 1 : 1;
        } else {
          if (worksheet.columnCount >= 4) {
            operatorColIndex = 1;
            dayColIndex = 2;
            skuColIndex = 3;
            urlColIndex = 4;
          } else {
            skuColIndex = 1;
            urlColIndex = 2;
          }
        }
      }

      worksheet.eachRow((row, rowNumber) => {
        // Skip header if it is row 1 and has 'sku' or 'url' or 'operator' or 'day'
        if (rowNumber === 1) {
          const rowText = (row.values as any[])?.join(" ").toLowerCase() || "";
          if (rowText.includes("sku") || rowText.includes("url") || rowText.includes("operator") || rowText.includes("day")) {
            return;
          }
        }

        const skuCell = row.getCell(skuColIndex);
        const urlCell = row.getCell(urlColIndex);

        let skuText = (skuCell.text || skuCell.value?.toString() || "").trim();
        let urlText = "";

        // Check if url is in urlCell (hyperlink or text)
        if (urlCell.hyperlink) {
          urlText = urlCell.hyperlink;
        } else if (urlCell.value && typeof urlCell.value === "object" && "hyperlink" in urlCell.value) {
          urlText = (urlCell.value as any).hyperlink;
        } else if (urlCell.text || urlCell.value) {
          urlText = (urlCell.text || urlCell.value?.toString() || "").trim();
        }

        // If no url in urlCell, check if skuCell itself has an embedded hyperlink
        if (!urlText && skuCell.hyperlink) {
          urlText = skuCell.hyperlink;
        } else if (!urlText && skuCell.value && typeof skuCell.value === "object" && "hyperlink" in skuCell.value) {
          urlText = (skuCell.value as any).hyperlink;
        }

        const operatorText = operatorColIndex > 0 ? (row.getCell(operatorColIndex).text || row.getCell(operatorColIndex).value?.toString() || "").trim() : "";
        const dayText = dayColIndex > 0 ? (row.getCell(dayColIndex).text || row.getCell(dayColIndex).value?.toString() || "").trim() : "";

        if (skuText) {
          parsedData.push({
            sku: skuText,
            url: urlText,
            operatorName: operatorText || undefined,
            day: dayText || undefined,
          });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl !rounded-3xl sm:!rounded-[32px] overflow-hidden border border-[#E7E0D2] bg-white shadow-2xl relative m-4">
        {/* Header Banner */}
        <div className="bg-[#0A0E1A] px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-800 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-[#FFF9EC]/10 border border-[#E8C16D]/30 text-[#E8C16D] shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-[#E8C16D]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#E8C16D]">
                  Upload Analytics Excel
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Upload an .xlsx file containing Operator, Day, SKUs and URLs
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              disabled={isUploading}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Demo Sheet Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#E8C16D]/40 bg-[#FFF9EC]/80 p-3 sm:p-3.5 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 text-slate-800 font-medium">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#0A0E1A] text-[#E8C16D] shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <span>
                Need the exact template format? Download our demo sheet with sample rows.
              </span>
            </div>

            <button
              type="button"
              onClick={downloadAmazonAnalyticsDemoSheet}
              className="inline-flex h-8 sm:h-8.5 items-center gap-1.5 rounded-xl border border-[#E8C16D] bg-white hover:bg-[#FFF9EC] px-3.5 text-xs font-bold text-[#0A0E1A] shadow-2xs transition-all active:scale-[0.98] cursor-pointer shrink-0"
            >
              <FileDown className="h-3.5 w-3.5 text-[#B88728]" />
              <span>Download Demo Sheet</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="flex-1 flex flex-col justify-between">
            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative flex min-h-[180px] sm:min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-2xl sm:rounded-[24px] border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
                  isDragging
                    ? "border-[#E8C16D] bg-[#FFF9EC]"
                    : "border-[#E7E0D2] bg-[#FAF8F5]/80 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40"
                }`}
              >
                <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] shadow-xs transition-transform group-hover:scale-105">
                  <UploadCloud className="h-7 w-7" />
                </div>

                <p className="text-xs sm:text-sm font-bold text-[#0A0E1A]">
                  Click to upload or drag & drop Excel(s)
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                  Select a valid Excel (<code className="font-mono text-[#B88728] font-bold">.xlsx</code>) file
                </p>

                <div className="mt-3.5 inline-flex items-center gap-2 text-xs font-bold text-[#0A0E1A] bg-white px-3.5 py-1.5 rounded-xl border border-[#E7E0D2] shadow-2xs group-hover:border-[#E8C16D]">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-[#B88728]" />
                  <span>Browse Excel Files</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-between rounded-2xl border border-[#E7E0D2] bg-[#FAF8F5] p-3.5 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#0A0E1A]" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
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
                      className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    disabled={isUploading}
                    className="h-11 sm:h-12 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadToServer}
                    disabled={isUploading}
                    className="h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] hover:bg-[#d4af5a] transition shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0E1A] border-t-transparent" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        <span>Upload Now</span>
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
    </div>
  );
}
