"use client";

import { useScanner } from "../hooks/useScanner";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

interface Props {
  scanner: ReturnType<typeof useScanner>;
}

const RecentScans = ({ scanner }: Props) => {
  const { scanHistory } = scanner;
  const downloadExcel = () => {
    if (scanHistory.length === 0) return;

    const data = scanHistory.map((scan, index) => ({
      "No.": index + 1,
      "Tracking ID": scan.trackingId,
      Date: new Date(scan.scannedAt).toLocaleDateString(),
      Time: new Date(scan.scannedAt).toLocaleTimeString(),
      Source: scan.source,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recent Scans");
    XLSX.writeFile(
      workbook,
      `Recent_Scans_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <div className="mt-6 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0A0E1A]">Recent Scans</h2>
      </div>

      {scanHistory.length === 0 ? (
        <p className="text-xs sm:text-sm text-slate-500 font-medium">No scans yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {scanHistory.map((scan, index) => (
            <div
              key={`${scan.trackingId}-${index}`}
              className="flex items-center justify-between py-3.5 px-2 hover:bg-slate-50/70 transition-colors rounded-xl"
            >
              <div>
                <p className="font-mono text-sm sm:text-base font-bold text-[#0A0E1A]">
                  {scan.trackingId}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {new Date(scan.scannedAt).toLocaleTimeString()}
                </p>
              </div>

              <div>
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 uppercase">
                  {scan.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentScans;
