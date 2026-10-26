"use client";

import { useState } from "react";
import { AlertCircle, Copy, Check, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { MissingAwbItem } from "../hooks/useAwbScanner";
import { getTodayDateStringIST } from "../timeUtils";

interface Props {
  missingList: MissingAwbItem[];
  onRemoveItem: (awb: string) => void;
  onClearAll: () => void;
}

export default function AwbMissingTable({
  missingList,
  onRemoveItem,
  onClearAll,
}: Props) {
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (missingList.length === 0) {
    return null;
  }

  // Copy single AWB to clipboard
  const handleCopySingle = async (awb: string) => {
    try {
      await navigator.clipboard.writeText(awb);
      setCopiedAwb(awb);
      toast.success(`Copied "${awb}" to clipboard`);
      setTimeout(() => {
        setCopiedAwb((current) => (current === awb ? null : current));
      }, 1500);
    } catch {
      toast.error("Failed to copy AWB");
    }
  };

  // Copy all AWBs to clipboard
  const handleCopyAll = async () => {
    try {
      const text = missingList.map((item) => item.awb).join("\n");
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      toast.success(`Copied all ${missingList.length} missing AWB(s) to clipboard`);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error("Failed to copy all AWBs");
    }
  };

  // Export missing AWBs to Excel file
  const handleExportExcel = () => {
    try {
      const rows = missingList.map((item, index) => ({
        "NO.": index + 1,
        "AWB / Tracking ID": item.awb,
        "Status": "NOT FOUND",
        "Scan Time": item.scannedAt,
        "Reason": item.reason || "Not found in Amazon orders database",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Missing_AWBs");

      const today = getTodayDateStringIST();
      const fileName = `Amazon_Missing_AWBs_${today}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Exported ${missingList.length} missing AWB(s) to Excel`);
    } catch (err) {
      console.error("Failed to export Excel", err);
      toast.error("Failed to export Excel file");
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-[#0F1626] shadow-sm transition-all overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col gap-3 border-b border-red-100 dark:border-red-900/30 bg-red-50/70 dark:bg-red-950/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-red-950 dark:text-red-200 tracking-tight">
                Missing / Unmatched AWB Scans
              </h2>
              <span className="rounded-lg bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
                {missingList.length} Missing
              </span>
            </div>
            <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
              These tracking numbers or barcodes were scanned but were not found in the Amazon orders database.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 px-3.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-[0.98]"
            title="Download Excel file of missing AWBs"
          >
            <Download className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Excel</span>
          </button>

          {/* Copy All */}
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#251E11] px-3.5 text-xs font-bold transition shadow-xs cursor-pointer ring-1 ring-[#E8C16D]/30 active:scale-[0.98]"
            title="Copy all missing AWBs to clipboard"
          >
            {copiedAll ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Copy All</span>
              </>
            )}
          </button>

          {/* Clear List */}
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-800/50 bg-white dark:bg-[#0F1626] hover:bg-red-50 dark:hover:bg-red-950/30 px-3.5 text-xs font-bold text-red-700 dark:text-red-400 transition shadow-xs cursor-pointer active:scale-[0.98]"
            title="Clear missing AWBs list"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="max-h-72 w-full overflow-y-auto overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left font-sans">
          <thead className="sticky top-0 z-10 bg-[#0A0E1A] dark:bg-[#080B11] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-slate-800 dark:border-white/[0.08]">
            <tr>
              <th className="px-4 py-3 text-center whitespace-nowrap w-14">NO.</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Scanned AWB / Tracking ID</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Scan Time</th>
              <th className="px-4 py-3 text-center whitespace-nowrap w-20">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm">
            {missingList.map((item, index) => {
              const isCopied = copiedAwb === item.awb;

              return (
                <tr
                  key={item.id || item.awb}
                  className="transition-colors hover:bg-red-50/40 dark:hover:bg-red-950/40"
                >
                  {/* NO. */}
                  <td className="px-4 py-3 text-center font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {index + 1}
                  </td>

                  {/* Scanned AWB / Barcode */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <span className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 px-3 py-1 font-mono text-xs sm:text-sm font-bold text-red-950 dark:text-red-200 tracking-wider">
                        {item.awb}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySingle(item.awb)}
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer"
                        title="Copy AWB"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 dark:border-red-800/50 bg-red-100 dark:bg-red-950/50 px-3 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
                      <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      NOT FOUND
                    </span>
                  </td>

                  {/* Scan Time */}
                  <td className="px-4 py-3 text-center font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {item.scannedAt}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.awb)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                      title="Remove from missing list"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
