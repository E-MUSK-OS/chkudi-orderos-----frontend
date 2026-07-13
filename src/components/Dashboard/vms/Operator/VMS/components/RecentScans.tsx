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
    <div className="mt-6 border border-[#C89B3C] p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl">Recent Scans</h2>

        <button
          onClick={downloadExcel}
          disabled={scanHistory.length === 0}
          className="flex items-center gap-2 rounded-lg bg-[#0A0E1A] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={18} />
          Download Excel
        </button>
      </div>

      {scanHistory.length === 0 ? (
        <p className="text-gray-500">No scans yet.</p>
      ) : (
        <div className="space-y-3">
          {scanHistory.map((scan, index) => (
            <div
              key={`${scan.trackingId}-${index}`}
              className="border-b pb-3 last:border-none"
            >
              <p className="font-semibold">{scan.trackingId}</p>

              <p className="text-sm text-gray-500">
                {new Date(scan.scannedAt).toLocaleTimeString()}
              </p>

              <p className="mt-1 text-xs text-blue-600 uppercase">
                {scan.source}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentScans;
