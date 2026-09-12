"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, Sparkles, ArrowRight, X, FileDown } from "lucide-react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

interface MissingSkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingAsins: string[];
}

export default function MissingSkuModal({
  isOpen,
  onClose,
  missingAsins,
}: MissingSkuModalProps) {
  const router = useRouter();

  if (!isOpen || missingAsins.length === 0) return null;

  const handleGoToProducts = () => {
    onClose();
    router.push("/dashboard/products/manage-products");
  };

  const handleDownloadExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("ASIN Import");

      // Columns exactly matching screenshot 2:
      // ASIN | SKU | GenerateBarCode | RackAddress
      worksheet.columns = [
        { header: "ASIN", key: "asin", width: 22 },
        { header: "SKU", key: "sku", width: 20 },
        { header: "GenerateBarCode", key: "generateBarcode", width: 20 },
        { header: "RackAddress", key: "rackAddress", width: 20 },
      ];

      // Style header row (blue table header style matching screenshot)
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3370A6" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "left" };

      // Add missing ASIN rows with empty SKU, GenerateBarCode, RackAddress
      missingAsins.forEach((asin) => {
        worksheet.addRow({
          asin,
          sku: "",
          generateBarcode: "",
          rackAddress: "",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `missing-asins-${new Date().toISOString().split("T")[0]}.xlsx`;

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        fileName
      );

      toast.success("Missing ASINs Excel downloaded successfully.");
    } catch (err) {
      console.error("Failed to download missing ASINs excel", err);
      toast.error("Failed to generate Excel file.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md sm:max-w-lg overflow-hidden rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-7 shadow-2xl text-slate-900"
        >
          {/* Subtle Ambient Background Glows */}
          <div className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-[#FFF9EC] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-[#FFF9EC] hover:text-[#B88728] transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Top Pill Badge */}
          <div className="flex justify-center mb-3.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF9EC] px-3.5 py-1 text-[11px] font-bold text-[#B88728] border border-[#E8C16D]/50 shadow-2xs">
              <Sparkles className="h-3 w-3 animate-pulse text-[#B88728]" />
              Amazon Order Verification Warning
            </span>
          </div>

          {/* Sleek Refined HUD Emblem (Compact, Production-Grade Proportions) */}
          <div className="relative my-4 flex justify-center">
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

              {/* Central Dark Core with Small Refined Icon */}
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
          <div className="text-center space-y-1 mb-4">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A0E1A]">
              Seller SKU Not Found!
            </h3>
            <p className="text-xs text-slate-500 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              The following ASIN(s) do not have a matching <strong className="text-[#B88728] font-bold">Seller SKU</strong> saved in your database:
            </p>
          </div>

          {/* ASIN List Scroll Box (Clean High-Tech Container) */}
          <div className="mb-4 max-h-28 overflow-y-auto rounded-xl border border-amber-200/70 bg-[#FFFDF7] p-2.5 flex flex-wrap gap-1.5 justify-center shadow-inner">
            {missingAsins.map((asin, idx) => (
              <span
                key={idx}
                className="rounded-md bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[#B88728] text-xs font-mono font-bold tracking-wider shadow-2xs"
              >
                {asin}
              </span>
            ))}
          </div>

          {/* Production Warning Callout Banner */}
          <div className="mb-5 rounded-2xl border border-[#E8C16D]/60 bg-gradient-to-r from-[#FFFDF5] via-[#FFF9EC] to-[#FFFDF5] p-3.5 text-xs font-semibold text-slate-800 shadow-2xs flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#B88728] animate-bounce" />
            <p className="leading-snug">
              Please add these product variants or update their ASIN and Variant SKU in the Products section to resolve this.
            </p>
          </div>

          {/* Production Action Buttons */}
          <div className="space-y-2.5">
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
                className="w-full sm:flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E8C16D] to-[#D4A343] hover:from-[#d8b05c] hover:to-[#c29235] px-4 text-xs sm:text-sm font-extrabold text-[#0A0E1A] shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Go to Products Section</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 text-xs sm:text-sm font-semibold text-slate-600 transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
            >
              Dismiss
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-4 text-center text-[11px] text-slate-400">
            Please resolve missing SKUs to ensure correct label printing.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
