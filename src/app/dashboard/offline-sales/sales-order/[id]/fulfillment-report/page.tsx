"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { salesOrderService } from "@/components/Dashboard/OfflineSales/SalesOrder/services/salesOrder.service";
import { SalesOrder } from "@/components/Dashboard/OfflineSales/SalesOrder/types/salesOrder.types";

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function FulfillmentReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listPath = "/dashboard/offline-sales/sales-order";
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    salesOrderService
      .getOrderById(params.id)
      .then((data) => setOrder(data))
      .catch((err: any) => {
        toast.error(err.message || "Failed to load Fulfillment Report");
        router.push(listPath);
      })
      .finally(() => setLoading(false));
  }, [params?.id, router]);

  return (
    <DashboardLayout title="Fulfillment Report">
      <div className="space-y-4 font-sans">
        {/* Top Header */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#0A0E1A] dark:text-white tracking-tight">
                  Fulfillment Report [ Sales Order ]
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Offline Sales • Sales Order Fulfillment
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={() => router.push(listPath)}
                className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/20 active:scale-[0.98] cursor-pointer min-h-[40px]"
              >
                <ArrowLeft className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Back to List</span>
              </button>

              <div className="h-9 sm:h-10 px-3.5 rounded-xl sm:rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] font-mono font-bold text-xs sm:text-sm flex items-center">
                {order?.orderNo || "SO/2026-2027/1"}
              </div>
              <div className="h-9 sm:h-10 px-3.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white flex items-center">
                {formatDate(order?.orderDate)}
              </div>
            </div>
          </div>
        </section>

        {/* Meta Pills */}
        {order && (
          <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm flex flex-wrap items-center gap-3 text-xs">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFFDF8] dark:bg-[#080B11]">
              <span className="text-slate-400 font-semibold">PO No.</span>
              <span className="font-bold text-[#0A0E1A] dark:text-white">
                {order.poNo || "-"}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFFDF8] dark:bg-[#080B11]">
              <span className="text-slate-400 font-semibold">PO Date.</span>
              <span className="font-bold text-[#0A0E1A] dark:text-white">
                {formatDate(order.poDate)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFFDF8] dark:bg-[#080B11]">
              <span className="text-slate-400 font-semibold">Exp. Req. Date.</span>
              <span className="font-bold text-[#0A0E1A] dark:text-white">
                {formatDate(order.expDeliveryDate)}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] ml-auto">
              <span className="text-[#B88728] dark:text-[#E8C16D] font-bold">
                {order.party?.partyName || order.partyName}
              </span>
            </div>
          </section>
        )}

        {/* Fulfillment Report Table */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[820px] text-left border-collapse text-xs">
              <thead className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F1E8D0] dark:border-white/[0.08] text-[#6A4D1D] dark:text-[#E8C16D] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-center w-14">No.</th>
                  <th className="py-3.5 px-4">Product SKU.</th>
                  <th className="py-3.5 px-4 w-24">Size.</th>
                  <th className="py-3.5 px-4 text-right w-32">Required.</th>
                  <th className="py-3.5 px-4 text-right w-32">In Stock.</th>
                  <th className="py-3.5 px-4 text-right w-32">In Production.</th>
                  <th className="py-3.5 px-4 text-center w-44">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1E8D0]/60 dark:divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading Fulfillment Report...
                    </td>
                  </tr>
                ) : !order || (order.items || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No items in this Sales Order.
                    </td>
                  </tr>
                ) : (
                  order.items.map((it, idx) => {
                    const reqQty = Number(it.quantity) || 0;
                    const delQty = Number(it.deliveredQty) || 0;
                    const isReady = delQty >= reqQty && reqQty > 0;
                    return (
                      <tr
                        key={it.id || idx}
                        className="hover:bg-[#FEFAEE]/60 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {it.sku}
                          </div>
                          {it.particular && it.particular !== it.sku && (
                            <div className="text-[11px] text-slate-400">
                              {it.particular}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {it.size || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {reqQty}
                          </div>
                          <div className="text-[10px] text-slate-400">PCS</div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <div>
                              <div className="font-mono font-bold text-slate-900 dark:text-white">
                                {delQty}
                              </div>
                              <div className="text-[10px] text-slate-400">PCS</div>
                            </div>
                            {isReady ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {Math.max(0, reqQty - delQty)}
                          </div>
                          <div className="text-[10px] text-slate-400">PCS</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border border-[#E8C16D]/50 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D]">
                            {order.fulfillmentPlan || "Pending"} | {order.orderNo}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
