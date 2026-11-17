"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Store,
  Layers,
  FileText,
} from "lucide-react";
import Button from "@/components/ui/Button";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { Webstore } from "../types/webstore.types";
import { MarketplaceLogo } from "../utils/marketplaceLogos";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UploadOrderModalProps {
  open: boolean;
  stores: Webstore[];
  onClose: () => void;
}

const ORDER_FORMATS = [
  {
    id: "auto",
    label: "Auto-detect Channel Format",
    desc: "Automatically detects Amazon, Flipkart, Myntra, or Meesho order formats",
  },
  {
    id: "amazon",
    label: "Amazon Orders Flat File (TSV/TXT/XLSX)",
    desc: "Standard Merchant / EasyShip / FBA Orders Report",
  },
  {
    id: "flipkart",
    label: "Flipkart Orders Sheet (.csv / .xlsx)",
    desc: "Flipkart Seller Order Dispatch File",
  },
  {
    id: "myntra",
    label: "Myntra Picklist / Order Formatter",
    desc: "Myntra Multi-item Dispatch manifest",
  },
  {
    id: "meesho",
    label: "Meesho Order Dispatch CSV",
    desc: "Meesho Supplier Panel Orders File",
  },
  {
    id: "generic",
    label: "Generic / Custom Order Sheet (.xlsx / .csv)",
    desc: "Custom order sheets with Order ID, SKU, Quantity, and Customer address",
  },
];

const FORMAT_OPTIONS: ThemeSelectOption[] = ORDER_FORMATS.map((f) => ({
  value: f.id,
  label: f.label,
}));

export default function UploadOrderModal({
  open,
  stores,
  onClose,
}: UploadOrderModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    stores[0]?.id || ""
  );
  const [selectedFormat, setSelectedFormat] = useState<string>("auto");
  const [orderFile, setOrderFile] = useState<File | null>(null);
  const [batchNote, setBatchNote] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  if (!open) return null;

  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExts = [".xlsx", ".xls", ".csv", ".tsv", ".txt"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV/TSV (.csv, .tsv, .txt) file.");
      return;
    }
    setOrderFile(file);
  };

  const handleUploadAndSync = async () => {
    if (!orderFile) {
      toast.error("Please select an order sheet to upload.");
      return;
    }
    if (!selectedStore) {
      toast.error("Please select a target Webstore.");
      return;
    }

    try {
      setIsUploading(true);
      // Simulate reading and ingesting orders for this channel
      await new Promise((resolve) => setTimeout(resolve, 1200));

      toast.success(
        `Successfully uploaded and mapped "${orderFile.name}" to webstore "${selectedStore.storeName}".`
      );
      setOrderFile(null);
      setBatchNote("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload orders.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNavigateToOrderProcess = () => {
    onClose();
    const ch = (selectedStore?.marketplaceName || "").toLowerCase();
    if (ch.includes("myntra")) {
      router.push("/dashboard/order-process/myntra/myntra-order");
    } else if (ch.includes("amazon")) {
      router.push("/dashboard/order-process/amazon/order-process");
    } else {
      router.push("/dashboard/order-process");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!isUploading ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#0F1626] z-10 transition-all max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upload Channel Orders
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Import and sync order files directly to your connected Webstore
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 pt-4">
          {/* Target Webstore Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Select Target Webstore *
            </label>
            {stores.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-300">
                No webstores registered yet. Please create a webstore first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                {stores.map((s) => {
                  const isSelected = (selectedStore?.id || stores[0]?.id) === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStoreId(s.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#E8C16D] bg-[#FFF9EC] text-[#0A0E1A] ring-1 ring-[#E8C16D]/40 dark:border-[#E8C16D] dark:bg-[#1A160E] dark:text-[#E8C16D]"
                          : "border-[#E7E0D2] dark:border-white/[0.08] hover:border-[#E8C16D]/50 dark:hover:border-white/[0.15]"
                      }`}
                    >
                      <MarketplaceLogo
                        name={s.marketplaceName}
                        logoUrl={s.marketplaceLogo}
                        className="w-8 h-8 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {s.storeName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {s.marketplaceName} • Code: {s.code}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Format Preset Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Order File Format
            </label>
            <ThemeSelectDropdown
              ariaLabel="Select Order File Format"
              value={selectedFormat}
              onChange={(val) => setSelectedFormat(val)}
              options={FORMAT_OPTIONS}
              className="w-full"
              buttonClassName="w-full justify-between h-10 px-3.5 text-xs rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-slate-800 dark:text-slate-100 font-semibold"
              menuClassName="w-full"
            />
          </div>

          {/* Drag & Drop File Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Order File (.xlsx, .csv, .tsv, .txt) *
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.tsv,.txt"
              className="hidden"
            />

            {!orderFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                  isDragOver
                    ? "border-[#E8C16D] bg-[#FFF9EC]/50 dark:border-[#E8C16D] dark:bg-[#1A160E]"
                    : "border-[#E7E0D2] hover:border-[#E8C16D]/50 dark:border-white/[0.15] dark:hover:border-white/[0.25] bg-[#FAF8F5]/50 dark:bg-black/20"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/20 mb-2">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  Click to browse or drag and drop order sheet
                </span>
                <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Supports Excel (.xlsx, .xls), CSV (.csv), TSV/TXT (.tsv, .txt)
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-300/80 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">
                      {orderFile.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {(orderFile.size / 1024).toFixed(1)} KB • Ready to process
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOrderFile(null)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 p-1 cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Optional Batch Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Batch Note / Remark (Optional)
            </label>
            <input
              type="text"
              value={batchNote}
              onChange={(e) => setBatchNote(e.target.value)}
              placeholder="e.g. Morning dispatch batch, Diwali sale chunk 1"
              className="w-full h-9 px-3.5 text-xs rounded-xl border border-[#E7E0D2] bg-white text-slate-800 dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#E8C16D] focus:border-[#E8C16D] dark:focus:ring-[#E8C16D]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={handleNavigateToOrderProcess}
            className="text-xs font-semibold text-[#B88728] hover:text-[#8C6018] dark:text-[#E8C16D] dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Open Dedicated Order Process</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="inline-flex h-10 items-center justify-center px-5 rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] text-xs font-bold shadow-xs transition-all hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUploadAndSync}
              disabled={isUploading || !orderFile}
              className="inline-flex h-10 items-center justify-center gap-2 px-6 rounded-2xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0A0E1A]" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 text-[#0A0E1A]" />
                  <span>Upload & Sync</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
