"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ShieldAlert,
  FileDown,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Lock,
  X,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

interface MyntraMissingSkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingSkus: string[];
  onRefreshMappings?: () => Promise<{ success: boolean; remainingCount: number }>;
  onReset?: () => void;
}

export default function MyntraMissingSkuModal({
  isOpen,
  onClose,
  missingSkus,
  onRefreshMappings,
  onReset,
}: MyntraMissingSkuModalProps) {
  const [isChecking, setIsChecking] = useState(false);

  if (!isOpen || missingSkus.length === 0) return null;

  const handleGoToProducts = () => {
    // Open in a new tab directly on the Myntra tab so the user does NOT lose their current uploaded Excel files!
    window.open("/dashboard/products/manage-products?type=myntra", "_blank");
  };

  const handleRefresh = async () => {
    if (!onRefreshMappings) return;
    setIsChecking(true);
    try {
      const res = await onRefreshMappings();
      if (res.success || res.remainingCount === 0) {
        toast.success("All Myntra SKUs verified! Unlocking picklist...");
        onClose();
      } else {
        toast.warning(
          `Still ${res.remainingCount} Myntra SKU(s) missing Seller SKU. Please add them in Products before proceeding.`
        );
      }
    } catch (err) {
      console.error("Failed to re-check Myntra mappings:", err);
      toast.error("Failed to check database. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Myntra Import");

      // Columns matching Myntra Product Import format:
      // Rack Address | Myntra SKU | Seller SKU | ASIN | Generated Barcode
      worksheet.columns = [
        { header: "Rack Address", key: "rackAddress", width: 20 },
        { header: "Myntra SKU", key: "myntraSku", width: 25 },
        { header: "Seller SKU", key: "sellerSku", width: 25 },
        { header: "ASIN", key: "asin", width: 20 },
        { header: "Generated Barcode", key: "generatedBarcode", width: 22 },
      ];

      // Style header row (Dark navy header style matching app theme)
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0A0E1A" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 26;

      // Add missing Myntra SKU rows with prefilled Myntra SKU and empty fields for mapping
      missingSkus.forEach((sku) => {
        const row = worksheet.addRow({
          rackAddress: "",
          myntraSku: sku,
          sellerSku: "",
          asin: "",
          generatedBarcode: "",
        });
        row.height = 20;
        row.alignment = { vertical: "middle" };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `missing-myntra-skus-${new Date().toISOString().split("T")[0]}.xlsx`;

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        fileName
      );

      toast.success(`Downloaded template for ${missingSkus.length} missing Myntra SKU(s).`);
    } catch (err) {
      console.error("Failed to download missing Myntra SKUs excel", err);
      toast.error("Failed to generate Excel file.");
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md sm:max-w-lg overflow-hidden rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-7 shadow-2xl text-slate-900"
        >
          {/* Close button at top right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Subtle Ambient Background Glows */}
          <div className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-[#FFF9EC] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />

          {/* Top Pill Badge - Strictly Blocking Indication */}
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-200/80 shadow-2xs">
              <Lock className="h-3 w-3 text-rose-600" />
              Picklist Strictly Locked ({missingSkus.length} Missing)
            </span>
          </div>

          {/* Sleek Refined HUD Emblem */}
          <div className="relative my-3 flex justify-center">
            <div className="relative grid h-16 w-16 sm:h-18 sm:w-18 place-items-center">
              {/* Clockwise Dashed Gold Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-[#E8C16D]"
              />

              {/* Counter-Clockwise Outer Halo */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
                className="absolute inset-1.5 rounded-full border border-[#B88728]/30"
              />

              {/* Central Dark Core with Shield Icon */}
              <motion.div
                animate={{ scale: [0.96, 1.04, 0.96] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-full bg-[#0A0E1A] border-2 border-[#E8C16D] shadow-md text-white"
              >
                <ShieldAlert className="h-5 w-5 text-[#E8C16D] animate-pulse" />
              </motion.div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center space-y-1 mb-3.5">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A0E1A]">
              Myntra SKU Not Found!
            </h3>
            <p className="text-xs text-slate-500 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              The following <strong className="text-rose-600 font-bold">{missingSkus.length} Myntra SKU(s)</strong> do not have a matching <strong className="text-[#B88728] font-bold">Seller SKU</strong> or Rack Address saved in your database. Please add them in Products before proceeding:
            </p>
          </div>

          {/* SKU List Scroll Box */}
          <div className="mb-3.5 max-h-28 overflow-y-auto rounded-xl border border-amber-200/70 bg-[#FFFDF7] p-2.5 flex flex-wrap gap-1.5 justify-center shadow-inner">
            {missingSkus.map((sku, idx) => (
              <span
                key={idx}
                className="rounded-md bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[#B88728] text-xs font-mono font-bold tracking-wider shadow-2xs"
              >
                {sku}
              </span>
            ))}
          </div>

          {/* Instruction Box */}
          <div className="mb-4 rounded-2xl border border-[#E8C16D]/60 bg-gradient-to-r from-[#FFFDF5] via-[#FFF9EC] to-[#FFFDF5] p-3 text-xs font-semibold text-slate-800 shadow-2xs flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#B88728] mt-0.5" />
            <p className="leading-relaxed">
              1. <strong>Download Excel</strong> or click <strong>Go to Products</strong> (opens in new tab) to add the missing SKUs.<br />
              2. Return here and click <strong>&ldquo;Re-check &amp; Verify SKUs&rdquo;</strong> to unlock and continue.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* Row 1: Download Excel & Go to Products */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="w-full sm:flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100/80 px-4 text-xs sm:text-sm font-bold text-emerald-800 transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
              >
                <FileDown className="h-4 w-4 text-emerald-700" />
                <span>Download Excel</span>
              </button>

              <button
                type="button"
                onClick={handleGoToProducts}
                className="w-full sm:flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-[#FFF9EC] hover:bg-[#FFF3D6] px-4 text-xs sm:text-sm font-bold text-[#B88728] transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
                title="Opens Products in a new tab so your uploaded files are preserved"
              >
                <span>Go to Products</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Row 2: Re-check & Verify (Primary Glowing Button) */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isChecking}
              className="w-full inline-flex h-11 sm:h-12 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#E8C16D] via-[#D4A343] to-[#B88728] hover:from-[#d8b05c] hover:to-[#a7781f] px-5 text-xs sm:text-sm font-black text-[#0A0E1A] shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 text-[#0A0E1A] ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Checking Database..." : "Re-check & Verify SKUs"}</span>
            </button>

            {/* Row 3: Cancel & Back to Upload */}
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={isChecking}
                className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 px-4 text-xs font-semibold text-slate-500 transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Cancel & Back to Upload</span>
              </button>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-3.5 text-center text-[11px] font-medium text-slate-400">
            OrderOS requires all Myntra SKUs to be mapped for accurate picklist generation.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
