"use client";

import { useState, useMemo, useEffect } from "react";
import { ShoppingBag, CheckCircle2, Clock } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

const orders = [
  {
    id: "#ORD-1048",
    customer: "Ravi Patel",
    status: "Delivered",
    amount: "Rs. 1,240",
  },
  {
    id: "#ORD-1047",
    customer: "Nisha Shah",
    status: "Preparing",
    amount: "Rs. 860",
  },
  {
    id: "#ORD-1046",
    customer: "Amit Kumar",
    status: "Pending",
    amount: "Rs. 1,920",
  },
  {
    id: "#ORD-1045",
    customer: "Meera Joshi",
    status: "Delivered",
    amount: "Rs. 740",
  },
];

export default function RecentOrders() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = total === 0 ? 0 : (page - 1) * limit;

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedOrders = useMemo(() => {
    return orders.slice(startIndex, startIndex + limit);
  }, [startIndex, limit]);

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm overflow-hidden flex flex-col justify-between dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-sm">
      <div>
        <div className="flex items-center justify-between border-b border-[#E7E0D2] px-5 py-4 bg-white dark:border-white/[0.08] dark:bg-transparent">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF9EC] border border-[#E8C16D]/30 text-[#B88728] shrink-0 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-[#F5C451] dark:shadow-[0_0_12px_rgba(245,196,81,0.15)]">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#0A0E1A] tracking-tight dark:text-white">
              Recent Orders
            </h3>
          </div>

          <span className="rounded-lg border border-[#E8C16D]/40 bg-[#FFF9EC] px-2.5 py-0.5 text-xs font-bold text-[#B88728] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-[#F5C451]">
            {orders.length} Items
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full min-w-[550px] border-collapse text-left font-sans">
            <thead className="bg-[#FEFAEE] dark:bg-none text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] border-b border-[#F5E6BE] dark:bg-[#090D17] dark:text-[#F5C451] dark:border-white/[0.08]">
              <tr>
                <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Order ID</th>
                <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Customer</th>
                <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm dark:divide-white/[0.04] dark:bg-transparent">
              {paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.06]"
                >
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-[#0A0E1A] whitespace-nowrap text-xs sm:text-sm dark:text-slate-100">
                    {order.id}
                  </td>

                  <td className="px-4 py-3.5 text-center font-semibold text-slate-800 whitespace-nowrap text-xs sm:text-sm dark:text-slate-200">
                    {order.customer}
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {order.status === "Delivered" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Delivered</span>
                      </span>
                    ) : order.status === "Preparing" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 dark:shadow-[0_0_12px_rgba(245,196,81,0.15)]">
                        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                        <span>Preparing</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400 dark:shadow-[0_0_12px_rgba(56,189,248,0.15)]">
                        <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-sky-400" />
                        <span>Pending</span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center font-mono font-bold text-[#0A0E1A] whitespace-nowrap text-xs sm:text-sm dark:text-slate-100 dark:tabular-nums">
                    {order.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        options={[5, 10, 20, 50]}
        itemName="orders"
        variant="dark"
        className="border-t border-[#F1E8D0] bg-[#FEFAEE] dark:bg-none px-4 sm:px-6 py-3 sm:py-3.5 dark:border-white/[0.08] dark:bg-[#090D17]"
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </section>
  );
}