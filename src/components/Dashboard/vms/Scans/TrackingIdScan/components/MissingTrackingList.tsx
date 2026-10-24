"use client";

import { useState } from "react";
import { AlertCircle, Copy, Check, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Props {
  trackingIds: string[];
  onRemoveItem?: (id: string) => void;
  onClearAll?: () => void;
}

export default function MissingTrackingList({
  trackingIds,
  onRemoveItem,
  onClearAll,
}: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (trackingIds.length === 0) {
    return null;
  }

  // Copy single Tracking ID to clipboard
  const handleCopySingle = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success(`Copied "${id}" to clipboard`);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1500);
    } catch {
      toast.error("Failed to copy Tracking ID");
    }
  };

  // Copy all Tracking IDs to clipboard
  const handleCopyAll = async () => {
    try {
      const text = trackingIds.join("\n");
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      toast.success(`Copied all ${trackingIds.length} missing Tracking ID(s) to clipboard`);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error("Failed to copy all Tracking IDs");
    }
  };

  // Export missing tracking IDs to Excel file
  const handleExportExcel = () => {
    try {
      const rows = trackingIds.map((id, index) => ({
        "NO.": index + 1,
        "Tracking ID": id,
        "Status": "NOT FOUND",
        "Reason": "No VMS Record Found",
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Missing_Tracking_IDs");

      const today = new Date().toISOString().split("T")[0];
      const fileName = `Missing_Tracking_IDs_${today}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Exported ${trackingIds.length} missing Tracking ID(s) to Excel`);
    } catch (err) {
      console.error("Failed to export Excel", err);
      toast.error("Failed to export Excel file");
    }
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-red-200 bg-white shadow-sm transition-all overflow-hidden mb-6">
      {/* Header bar */}
      <div className="flex flex-col gap-3 border-b border-red-100 bg-red-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-100 border border-red-200 text-red-700">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-red-950 tracking-tight">
                Missing / Unmatched Tracking IDs
              </h2>
              <span className="rounded-lg bg-red-100 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-700">
                {trackingIds.length} Missing
              </span>
            </div>
            <p className="mt-0.5 text-xs text-red-700">
              These Tracking IDs were scanned but no matching VMS record was found.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-[0.98]"
            title="Download Excel file of missing Tracking IDs"
          >
            <Download className="h-3.5 w-3.5 text-emerald-700" />
            <span>Excel</span>
          </button>

          {/* Copy All */}
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] text-[#0A0E1A] hover:bg-[#FFF3D6] px-3.5 text-xs font-bold transition shadow-xs cursor-pointer ring-1 ring-[#E8C16D]/30 active:scale-[0.98]"
            title="Copy all missing Tracking IDs to clipboard"
          >
            {copiedAll ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#B88728]" />
                <span>Copy All</span>
              </>
            )}
          </button>

          {/* Clear List */}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 px-3.5 text-xs font-bold text-red-700 transition shadow-xs cursor-pointer active:scale-[0.98]"
              title="Clear missing Tracking IDs list"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="max-h-72 w-full overflow-y-auto overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left font-sans">
          <thead className="sticky top-0 z-10 bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 text-center whitespace-nowrap w-14">NO.</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Scanned Tracking ID</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
              {onRemoveItem && (
                <th className="px-4 py-3 text-center whitespace-nowrap w-20">Action</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm">
            {trackingIds.map((id, index) => {
              const isCopied = copiedId === id;

              return (
                <tr
                  key={id}
                  className="transition-colors hover:bg-red-50/40"
                >
                  {/* NO. */}
                  <td className="px-4 py-3 text-center font-bold text-slate-500 whitespace-nowrap">
                    {index + 1}
                  </td>

                  {/* Scanned Tracking ID */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <span className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 font-mono text-xs sm:text-sm font-bold text-red-950 tracking-wider">
                        {id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySingle(id)}
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-red-100 transition cursor-pointer"
                        title="Copy Tracking ID"
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
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-3 py-0.5 text-xs font-bold text-red-700">
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      NOT FOUND
                    </span>
                  </td>

                  {/* Action */}
                  {onRemoveItem && (
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer hover:bg-red-100 rounded-lg"
                        title="Remove from missing list"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}