"use client";

import React, { useRef, useState } from "react";
import { format } from "date-fns";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Webstore } from "@/components/Dashboard/Settings/Webstore/types/webstore.types";
import { RequestedPO, RequestedPOItem } from "../types/requestedPo.types";
import { parsePoExcelFile, generateSamplePoExcel } from "../utils/excelParser";
import { requestedPoService } from "../services/requestedPo.service";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";

interface POUploadPanelProps {
  selectedStore: Webstore;
  onPoUploaded: (po: RequestedPO) => void;
  parsedItems: RequestedPOItem[];
  setParsedItems: React.Dispatch<React.SetStateAction<RequestedPOItem[]>>;
  poNumber: string;
  setPoNumber: (val: string) => void;
  poDate: string;
  setPoDate: (val: string) => void;
}

export default function POUploadPanel({
  selectedStore,
  onPoUploaded,
  parsedItems,
  setParsedItems,
  poNumber,
  setPoNumber,
  poDate,
  setPoDate,
}: POUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Trigger file selection dialog
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file chosen
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = [".xlsx", ".xls", ".csv"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(fileExt)) {
      toast.error("Please select a valid Excel file (.xlsx, .xls) or CSV (.csv)");
      return;
    }

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setIsParsing(true);

    try {
      const parsed = await parsePoExcelFile(file);
      setParsedItems(parsed.items);

      // Auto-fill PO number if detected and user hasn't typed one
      if (parsed.detectedPoNumber && !poNumber.trim()) {
        setPoNumber(parsed.detectedPoNumber);
      }

      toast.success(
        `Parsed ${parsed.items.length} items (${parsed.totalQuantity} units) from ${file.name}`
      );
    } catch (err: any) {
      console.error("Error parsing PO file:", err);
      toast.error(err?.message || "Failed to parse Excel file. Please check format.");
      setParsedItems([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Save PO
  const handleSavePO = () => {
    if (!poNumber.trim()) {
      toast.error("Please enter a PO Number.");
      return;
    }
    if (!poDate.trim()) {
      toast.error("Please enter a PO Date.");
      return;
    }
    if (parsedItems.length === 0) {
      toast.error("Please select and upload an Excel file containing PO items.");
      return;
    }

    setIsSaving(true);
    try {
      const totalQty = parsedItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
      const totalAmt = Math.round(
        parsedItems.reduce((acc, it) => acc + (it.totalAmount || 0), 0) * 100
      ) / 100;

      const newPo: RequestedPO = {
        id: `po_${Date.now()}`,
        storeId: selectedStore.id,
        storeName: selectedStore.storeName,
        marketplaceName: selectedStore.marketplaceName,
        poNumber: poNumber.trim(),
        poDate: poDate.trim(),
        fileName: selectedFileName || "po_items.xlsx",
        itemsCount: parsedItems.length,
        totalQuantity: totalQty,
        totalAmount: totalAmt,
        status: "Uploaded",
        createdAt: new Date().toISOString(),
        items: parsedItems,
      };

      requestedPoService.save(newPo);
      onPoUploaded(newPo);
      toast.success(`PO #${newPo.poNumber} saved successfully for ${selectedStore.storeName}!`);

      // Reset file input
      setSelectedFileName("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Error saving PO:", err);
      toast.error("Failed to save PO. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    generateSamplePoExcel(selectedStore.storeName);
    toast.success("Sample PO Template downloaded!");
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11]/60 p-2.5 sm:p-3 shadow-2xs">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload Input Row matching Screenshot 2 */}
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Enter PO No. */}
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Enter PO No.
            </label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. PO-2026-908"
              className="h-8 w-36 sm:w-44 px-2.5 rounded border border-slate-300 dark:border-white/[0.15] bg-white dark:bg-[#080B11] text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400 dark:focus:border-white/30 transition-all"
            />
          </div>

          {/* Date. */}
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Date.
            </label>
            <div className="w-36 sm:w-40">
              <DatePicker
                value={poDate}
                onChange={(_, dateStr) => setPoDate(dateStr || "")}
                placeholder="DD-MM-YYYY"
                dateFormat="dd-MM-yyyy"
                buttonClassName="h-8 px-2.5 rounded border border-slate-300 dark:border-white/[0.15] bg-white dark:bg-[#080B11] text-xs sm:text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Select PO Excel File. */}
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Select PO Excel File.
            </label>
            <input
              type="text"
              readOnly
              value={selectedFileName}
              placeholder="No file chosen"
              onClick={handleBrowseClick}
              className="h-8 w-44 sm:w-60 px-2.5 rounded border border-slate-300 dark:border-white/[0.15] bg-[#ECECEC] dark:bg-white/[0.08] text-xs text-slate-700 dark:text-slate-200 cursor-pointer outline-none truncate transition-colors"
            />
            <button
              type="button"
              onClick={handleBrowseClick}
              disabled={isParsing}
              className="h-8 px-5 rounded bg-[#DE5353] hover:bg-[#cf4040] active:bg-[#b83333] text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xs shrink-0"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <span>Browse</span>
              )}
            </button>
          </div>
        </div>

        {/* Action Controls: Template & Save */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            title="Download Sample PO Excel Template"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] rounded-lg transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-sky-500" />
            <span className="hidden sm:inline">Sample Template</span>
          </button>

          {parsedItems.length > 0 && (
            <button
              type="button"
              onClick={handleSavePO}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Save PO</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
