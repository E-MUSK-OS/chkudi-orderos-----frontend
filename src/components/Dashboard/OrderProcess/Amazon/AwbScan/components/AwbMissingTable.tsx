"use client";

import { useState } from "react";
import { AlertCircle, Copy, Check, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { MissingAwbItem } from "../hooks/useAwbScanner";

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

      const today = new Date().toISOString().split("T")[0];
      const fileName = `Amazon_Missing_AWBs_${today}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Exported ${missingList.length} missing AWB(s) to Excel`);
    } catch (err) {
      console.error("Failed to export Excel", err);
      toast.error("Failed to export Excel file");
    }
  };

  return (
    <div className="border border-red-200 bg-white shadow-sm transition-all overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col gap-3 border-b border-red-100 bg-red-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-100 text-red-700">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-red-950 tracking-wide">
                Missing / Unmatched AWB Scans
              </h2>
              <span className="rounded bg-red-100 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-700">
                {missingList.length} Missing
              </span>
            </div>
            <p className="mt-0.5 text-xs text-red-700">
              These tracking numbers or barcodes were scanned but were not found in the Amazon orders database.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="
              flex
              h-9
              items-center
              gap-1.5
              bg-emerald-600
              hover:bg-emerald-700
              px-3.5
              text-xs
              font-bold
              text-white
              transition
              cursor-pointer
              shadow-xs
            "
            title="Download Excel file of missing AWBs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Excel</span>
          </button>

          {/* Copy All */}
          <button
            type="button"
            onClick={handleCopyAll}
            className="
              flex
              h-9
              items-center
              gap-1.5
              border
              border-[#0A0E1A]
              bg-[#0A0E1A]
              px-3.5
              text-xs
              font-bold
              text-[#E8C16D]
              transition
              hover:bg-[#161D2E]
              cursor-pointer
              shadow-xs
            "
            title="Copy all missing AWBs to clipboard"
          >
            {copiedAll ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy All</span>
              </>
            )}
          </button>

          {/* Clear List */}
          <button
            type="button"
            onClick={onClearAll}
            className="
              flex
              h-9
              items-center
              gap-1.5
              border
              border-red-300
              bg-white
              hover:bg-red-50
              px-3.5
              text-xs
              font-bold
              text-red-700
              transition
              cursor-pointer
              shadow-xs
            "
            title="Clear missing AWBs list"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="max-h-72 w-full overflow-y-auto overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] uppercase border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 text-center whitespace-nowrap w-14">NO.</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Scanned AWB / Tracking ID</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Scan Time</th>
              <th className="px-4 py-3 text-center whitespace-nowrap w-20">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm">
            {missingList.map((item, index) => {
              const isCopied = copiedAwb === item.awb;

              return (
                <tr
                  key={item.id || item.awb}
                  className="transition-colors hover:bg-red-50/40"
                >
                  {/* NO. */}
                  <td className="px-4 py-3 text-center font-bold text-slate-500 whitespace-nowrap">
                    {index + 1}
                  </td>

                  {/* Scanned AWB / Barcode */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <span className="border border-red-200 bg-red-50 px-3 py-1 font-mono text-xs sm:text-sm font-bold text-red-950 tracking-wider">
                        {item.awb}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySingle(item.awb)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        title="Copy AWB"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 border border-red-200 bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      NOT FOUND
                    </span>
                  </td>

                  {/* Scan Time */}
                  <td className="px-4 py-3 text-center font-mono text-xs text-slate-600 whitespace-nowrap">
                    {item.scannedAt}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.awb)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer hover:bg-red-100 rounded"
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
