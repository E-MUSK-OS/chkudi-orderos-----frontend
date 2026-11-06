"use client";

import React, { useRef, useState } from "react";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { Webstore } from "@/components/Dashboard/Settings/Webstore/types/webstore.types";
import { RequestedPO } from "../types/requestedPo.types";
import { parsePoExcelFile, generateSamplePoExcel } from "../utils/excelParser";
import { requestedPoService } from "../services/requestedPo.service";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";

interface POUploadPanelProps {
  selectedStore: Webstore;
  onPoUploaded: (po: RequestedPO) => void;
  poNumber: string;
  setPoNumber: (val: string) => void;
  poDate: string;
  setPoDate: (val: string) => void;
}

export default function POUploadPanel({
  selectedStore,
  onPoUploaded,
  poNumber,
  setPoNumber,
  poDate,
  setPoDate,
}: POUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);

  // Trigger file selection dialog
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file chosen -> parse and auto-save immediately
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = [".xlsx", ".xls", ".csv"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(fileExt)) {
      toast.error("Please select a valid Excel file (.xlsx, .xls) or CSV (.csv)");
      return;
    }

    setSelectedFileName(file.name);
    setIsParsing(true);

    try {
      const parsed = await parsePoExcelFile(file);

      if (!parsed.items || parsed.items.length === 0) {
        toast.error("No valid line items found in the selected Excel file.");
        setSelectedFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Determine final PO Number (Entered > Detected in file > Clean File Name > Generated ID)
      const detectedPo = parsed.detectedPoNumber?.trim();
      const enteredPo = poNumber?.trim();
      const fileBaseName = file.name.replace(/\.[^/.]+$/, "").trim();
      const finalPoNumber =
        enteredPo ||
        detectedPo ||
        (fileBaseName && fileBaseName.length > 0 ? fileBaseName : `PO-${Date.now().toString().slice(-6)}`);

      const finalPoDate = poDate?.trim() || format(new Date(), "yyyy-MM-dd");

      const totalQty =
        parsed.totalQuantity ||
        parsed.items.reduce((acc, it) => acc + (it.quantity || 0), 0);
      const totalAmt =
        parsed.totalAmount ||
        Math.round(
          parsed.items.reduce((acc, it) => acc + (it.totalAmount || 0), 0) * 100
        ) / 100;

      // Create new PO
      const newPo: RequestedPO = {
        id: `po_${Date.now()}`,
        storeId: selectedStore.id,
        storeName: selectedStore.storeName,
        marketplaceName: selectedStore.marketplaceName,
        poNumber: finalPoNumber,
        poDate: finalPoDate,
        fileName: file.name,
        itemsCount: parsed.items.length,
        totalQuantity: totalQty,
        totalAmount: totalAmt,
        status: "Uploaded",
        createdAt: new Date().toISOString(),
        items: parsed.items,
        columns: parsed.columns,
      };

      // Save directly to database
      const savedPo = await requestedPoService.save(newPo);
      onPoUploaded(savedPo);

      toast.success(
        `PO #${finalPoNumber} with ${parsed.items.length} items (${totalQty} units) uploaded successfully!`
      );

      // Reset inputs for next upload
      setSelectedFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPoNumber("");
    } catch (err: unknown) {
      console.error("Error parsing and saving PO file:", err);
      const msg = err instanceof Error ? err.message : "Failed to parse and save Excel file. Please check format.";
      toast.error(msg);
      setSelectedFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadTemplate = () => {
    generateSamplePoExcel(selectedStore.storeName);
    toast.success("Sample PO Template downloaded!");
  };

  return (
    <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5]/80 dark:bg-[#080B11]/60 p-3 sm:p-5 shadow-xs">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload Input Row */}
      <div className="flex flex-wrap items-center justify-between gap-y-3.5 gap-x-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3.5">
          {/* Enter PO No. */}
          <div className="flex items-center gap-2.5">
            <label className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-slate-200 whitespace-nowrap">
              Enter PO No.
            </label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. PO-2026-908"
              disabled={isParsing}
              className="h-9 sm:h-10 w-36 sm:w-48 px-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-2xs disabled:opacity-50"
            />
          </div>

          {/* Date. */}
          <div className="flex items-center gap-2.5">
            <label className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-slate-200 whitespace-nowrap">
              Date.
            </label>
            <div className="w-36 sm:w-44">
              <DatePicker
                allowInput
                value={poDate}
                onChange={(_, dateStr) => setPoDate(dateStr || "")}
                placeholder="YYYY-MM-DD"
                dateFormat="yyyy-MM-dd"
                disabled={isParsing}
                className="w-full"
                buttonClassName="h-9 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white shadow-2xs hover:border-[#E8C16D] transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Select PO Excel File. */}
          <div className="flex items-center gap-2.5">
            <label className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-slate-200 whitespace-nowrap">
              Select PO Excel File.
            </label>
            <input
              type="text"
              readOnly
              value={selectedFileName}
              placeholder="No file chosen"
              onClick={handleBrowseClick}
              className="h-9 sm:h-10 w-44 sm:w-60 px-3 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-100/90 dark:bg-white/[0.06] text-xs font-semibold text-[#0A0E1A] dark:text-slate-200 cursor-pointer outline-none truncate transition-colors"
            />
            <button
              type="button"
              onClick={handleBrowseClick}
              disabled={isParsing}
              className="h-9 sm:h-10 px-5 rounded-xl border border-[#0A0E1A] bg-[#0A0E1A] text-[#E8C16D] hover:border-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11] dark:shadow-[0_0_15px_rgba(245,196,81,0.25)] font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 shadow-xs shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Browse</span>
              )}
            </button>
          </div>
        </div>

        {/* Action Controls: Template Download */}
        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            title="Download Sample PO Excel Template"
            className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] hover:bg-[#FFF3D6] dark:hover:bg-[#252014] text-[#B88728] dark:text-[#E8C16D] font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer ring-1 ring-[#E8C16D]/30"
          >
            <Download className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
            <span className="hidden sm:inline">Sample Template</span>
          </button>
        </div>
      </div>
    </div>
  );
}
