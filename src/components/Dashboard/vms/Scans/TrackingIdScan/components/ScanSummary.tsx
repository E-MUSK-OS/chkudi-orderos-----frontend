"use client";

interface Props {
  total: number;
  pending: number;
  scanned: number;
  missing?: number;
}

export default function ScanSummary({ total, pending, scanned, missing = 0 }: Props) {
  const hasMissing = missing > 0;

  return (
    <div
      className={`mb-6 grid grid-cols-1 gap-3 sm:gap-4 ${
        hasMissing ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
      }`}
    >
      {/* Total Card */}
      <article className="border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md">
        <p className="text-xs sm:text-sm font-medium text-slate-500">Total Orders</p>
        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0E1A]">{total}</h3>
          <span className="rounded bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
            Total
          </span>
        </div>
      </article>

      {/* Scanned Card */}
      <article className="border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md">
        <p className="text-xs sm:text-sm font-medium text-slate-500">Scanned Orders</p>
        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0E1A]">{scanned}</h3>
          <span className="rounded bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
            Scanned
          </span>
        </div>
      </article>

      {/* Pending Card */}
      <article className="border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md">
        <p className="text-xs sm:text-sm font-medium text-slate-500">Pending Orders</p>
        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0E1A]">{pending}</h3>
          <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
            Pending
          </span>
        </div>
      </article>

      {/* Missing Card */}
      {hasMissing && (
        <article className="border border-red-200 bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs sm:text-sm font-medium text-red-600">Missing / Unmatched</p>
          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-red-600">{missing}</h3>
            <span className="rounded bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
              Unmatched
            </span>
          </div>
        </article>
      )}
    </div>
  );
}
