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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0284C7]/10 text-[#0284C7] dark:bg-[#0284C7]/20 dark:text-[#38BDF8]">
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
                          ? "border-[#0284C7] bg-[#0284C7]/5 dark:border-[#38BDF8] dark:bg-[#38BDF8]/10"
                          : "border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]"
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
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284C7] dark:focus:ring-[#E8C16D] cursor-pointer"
            >
              {ORDER_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
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
                    ? "border-[#0284C7] bg-[#0284C7]/5 dark:border-[#38BDF8] dark:bg-[#38BDF8]/10"
                    : "border-slate-300 hover:border-slate-400 dark:border-white/[0.15] dark:hover:border-white/[0.25] bg-slate-50/50 dark:bg-black/20"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs dark:bg-slate-800 text-[#0284C7] dark:text-[#38BDF8] mb-2">
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
              className="w-full h-8 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#0284C7] dark:focus:ring-[#E8C16D]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={handleNavigateToOrderProcess}
            className="text-xs font-semibold text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer dark:text-[#38BDF8]"
          >
            <span>Open Dedicated Order Process</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={onClose}
              disabled={isUploading}
              className="h-10 px-5 text-xs font-bold rounded-full border border-[#E7E0D2]"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              fullWidth={false}
              onClick={handleUploadAndSync}
              disabled={isUploading || !orderFile}
              className="h-10 px-6 text-xs font-bold rounded-full flex items-center gap-1.5 bg-[#E8C16D] hover:bg-[#d8b05c] text-[#0A0E1A]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload & Sync</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
