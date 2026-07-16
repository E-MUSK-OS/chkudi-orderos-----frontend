"use client";

interface Props {
  total: number;
  pending: number;
  scanned: number;
}

export default function ScanSummary({ total, pending, scanned }: Props) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
      <div className="border border-blue-500/20 bg-[#0F172A] p-5">
        <p className="text-sm text-blue-300">Total</p>

        <h2 className="mt-2 text-4xl font-bold text-blue-400">{total}</h2>
      </div>

      <div className="border border-green-500/20 bg-[#0F172A] p-5">
        <p className="text-sm text-green-300">Scanned</p>

        <h2 className="mt-2 text-4xl font-bold text-green-400">{scanned}</h2>
      </div>
      <div className="border border-yellow-500/20 bg-[#0F172A] p-5">
        <p className="text-sm text-yellow-300">Pending</p>

        <h2 className="mt-2 text-4xl font-bold text-yellow-400">{pending}</h2>
      </div>
    </div>
  );
}
