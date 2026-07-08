"use client";

import { useScanner } from "../hooks/useScanner";

interface Props {
  scanner: ReturnType<typeof useScanner>;
}

const RecentScans = ({ scanner }: Props) => {
  const { scanHistory } = scanner;

  return (
    <div className="mt-6 border border-[#C89B3C] p-5 shadow-sm">
      <h2 className="mb-5 text-xl">
        Recent Scans
      </h2>

      {scanHistory.length === 0 ? (
        <p className="text-gray-500">
          No scans yet.
        </p>
      ) : (
        <div className="space-y-3">
          {scanHistory.map((scan, index) => (
            <div
              key={`${scan.trackingId}-${index}`}
              className="border-b pb-3 last:border-none"
            >
              <p className="font-semibold">
                {scan.trackingId}
              </p>

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