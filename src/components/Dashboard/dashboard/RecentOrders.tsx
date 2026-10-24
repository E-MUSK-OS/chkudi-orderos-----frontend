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
    <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-[#E7E0D2] px-5 py-4 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF9EC] border border-[#E8C16D]/30 text-[#B88728] shrink-0">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#0A0E1A] tracking-tight">
              Recent Orders
            </h3>
          </div>

          <span className="rounded-lg border border-[#E8C16D]/40 bg-[#FFF9EC] px-2.5 py-0.5 text-xs font-bold text-[#B88728]">
            {orders.length} Items
          </span>
        </div>

        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="w-full min-w-[550px] border-collapse text-left font-sans">
            <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
              <tr>
                <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Order ID</th>
                <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Customer</th>
                <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm">
              {paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-[#0A0E1A] whitespace-nowrap text-xs sm:text-sm">
                    {order.id}
                  </td>

                  <td className="px-4 py-3.5 text-center font-semibold text-slate-800 whitespace-nowrap text-xs sm:text-sm">
                    {order.customer}
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {order.status === "Delivered" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Delivered</span>
                      </span>
                    ) : order.status === "Preparing" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                        <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                        <span>Preparing</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>Pending</span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center font-mono font-bold text-[#0A0E1A] whitespace-nowrap text-xs sm:text-sm">
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
        className="border-t border-slate-800 bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5"
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </section>
  );
}