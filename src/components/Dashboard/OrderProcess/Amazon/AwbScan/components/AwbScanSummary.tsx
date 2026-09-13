"use client";

interface Props {
  total: number;
  pending: number;
  scanned: number;
}

export default function AwbScanSummary({ total, pending, scanned }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total Card */}
      <div className="border border-blue-500/20 bg-[#0F172A] p-5">
        <p className="text-sm text-blue-300 font-medium">Total</p>
        <h2 className="mt-2 text-4xl font-bold text-blue-400">{total}</h2>
      </div>

      {/* Scanned Card */}
      <div className="border border-green-500/20 bg-[#0F172A] p-5">
        <p className="text-sm text-green-300 font-medium">Scanned</p>
        <h2 className="mt-2 text-4xl font-bold text-green-400">{scanned}</h2>
      </div>

      {/* Pending Card */}
      <div className="border border-yellow-500/20 bg-[#0F172A] p-5">
        <p className="text-sm text-yellow-300 font-medium">Pending</p>
        <h2 className="mt-2 text-4xl font-bold text-yellow-400">{pending}</h2>
      </div>
    </div>
  );
}
