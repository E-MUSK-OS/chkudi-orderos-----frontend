"use client";

import { Boxes, CheckCircle2, Clock } from "lucide-react";

interface Props {
  total: number;
  scanned: number;
  pending: number;
  isLoading?: boolean;
}

export default function OrderProcessSummary({
  total,
  scanned,
  pending,
  isLoading = false,
}: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
      {/* Total Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-blue-300">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-bold text-slate-600">Total Orders</p>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
            <Boxes className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">{total}</h3>
          <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            Total
          </span>
        </div>
      </article>

      {/* Scanned Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-[#E8C16D]/40">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-bold text-slate-600">Scanned Orders</p>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">{scanned}</h3>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            Scanned
          </span>
        </div>
      </article>

      {/* Pending Card */}
      <article className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-[#E8C16D]/40">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-bold text-slate-600">Pending Orders</p>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex items-end justify-between gap-3">
          <h3 className="text-2xl sm:text-3xl font-black text-[#0A0E1A]">{pending}</h3>
          <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            Pending
          </span>
        </div>
      </article>
    </div>
  );
}
