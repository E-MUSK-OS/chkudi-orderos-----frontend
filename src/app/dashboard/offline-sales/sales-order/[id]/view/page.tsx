"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, Download, X } from "lucide-react";
import { toast } from "sonner";
import { salesOrderService } from "@/components/Dashboard/OfflineSales/SalesOrder/services/salesOrder.service";
import { SalesOrder } from "@/components/Dashboard/OfflineSales/SalesOrder/types/salesOrder.types";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function ViewSalesOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    Promise.all([
      salesOrderService.getOrderById(params.id),
      companyService.getCompanies({ pageSize: 1 }).catch(() => ({ data: [] })),
    ])
      .then(([ord, compRes]) => {
        setOrder(ord);
        if (compRes?.data && compRes.data.length > 0) {
          setCompany(compRes.data[0]);
        }
      })
      .catch((err: any) => {
        toast.error(err.message || "Failed to load Sales Order");
        router.push("/dashboard/offline-sales/sales-order");
      })
      .finally(() => setLoading(false));
  }, [params?.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center text-slate-300 text-sm">
        Loading Sales Order...
      </div>
    );
  }

  if (!order) return null;

  const companyName = company?.companyName || company?.name || "ORDEROS";
  const companyAddress = [
    company?.addressLine1 || company?.address1,
    company?.addressLine2 || company?.address2,
    [company?.city, company?.pincode].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(", ");

  const partyAddress = [
    (order.party as any)?.addressLine1 || (order.party as any)?.address1,
    (order.party as any)?.addressLine2 || (order.party as any)?.address2,
    [order.party?.city, order.party?.state, (order.party as any)?.pincode]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="min-h-screen bg-[#262626] py-6 px-4 print:bg-white print:p-0 print:min-h-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: #ffffff !important;
          }
        }
      `}</style>
      {/* Top Right Floating Action Bar */}
      <div className="fixed top-4 right-5 z-40 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white border border-white/15 hover:bg-white/20 cursor-pointer"
          title="Download / Save as PDF"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/offline-sales/sales-order")}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white border border-white/15 hover:bg-white/20 cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Printable A4 Sheet */}
      <div className="mx-auto w-full max-w-[794px] min-h-[1060px] bg-white text-slate-900 rounded-md shadow-2xl p-8 sm:p-10 flex flex-col justify-between print:shadow-none print:rounded-none print:max-w-full print:min-h-0 print:p-2">
        <div>
          {/* Top Title */}
          <div className="relative flex items-center justify-center mb-6 print:mb-4">
            <h1 className="text-sm font-black tracking-wider uppercase text-slate-900">
              SALES ORDER
            </h1>
            <span className="absolute right-0 text-xs font-bold uppercase tracking-wider text-slate-300">
              {order.salesFor || "PRODUCT"}
            </span>
          </div>

          {/* Company & Order Info Row */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-200 print:pb-3">
            <div className="flex items-start gap-3 max-w-[65%]">
              <div className="h-12 w-12 rounded-xl bg-slate-900 text-[#E8C16D] font-black text-base grid place-items-center shrink-0">
                {companyName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-[11px] leading-relaxed text-slate-600">
                <div className="text-sm font-black text-slate-900 uppercase">
                  {companyName}
                </div>
                {companyAddress && <div>{companyAddress}</div>}
                {company?.gstin && (
                  <div className="font-bold text-slate-800">
                    GSTIN. {company.gstin}
                  </div>
                )}
                {(company?.phone || company?.email) && (
                  <div className="font-semibold text-slate-700">
                    {[company?.phone && `No. ${company.phone}`, company?.email]
                      .filter(Boolean)
                      .join(" | ")}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-700 space-y-0.5 ml-auto shrink-0 whitespace-nowrap">
              <div>
                <span className="font-semibold">Date.</span>{" "}
                {formatDate(order.orderDate)}
              </div>
              <div>
                <span className="font-semibold">No.</span>{" "}
                <span className="font-bold text-slate-900">{order.orderNo}</span>
              </div>
              {order.poNo && (
                <div>
                  <span className="font-semibold">PO No.</span> {order.poNo}
                </div>
              )}
            </div>
          </div>

          {/* Party Detail & Meta Row */}
          <div className="grid grid-cols-12 gap-6 py-5 border-b border-slate-200 text-[11px] print:py-3 print:gap-4">
            <div className="col-span-6 pr-4 border-r border-slate-200 space-y-1">
              <div className="font-semibold text-slate-500">Party Detail.</div>
              <div className="font-black text-slate-900 uppercase">
                {order.party?.partyName || order.partyName}
              </div>
              {partyAddress && (
                <div className="whitespace-pre-line text-slate-600 leading-relaxed">
                  {partyAddress}
                </div>
              )}
              {(order.partyGstn || order.party?.gstin) && (
                <div className="text-slate-700">
                  <span className="font-semibold">GSTIN.</span>{" "}
                  {order.partyGstn || order.party?.gstin}
                </div>
              )}
              {(order.contactNo || order.party?.phone) && (
                <div className="text-slate-700">
                  <span className="font-semibold">Contact.</span>{" "}
                  {order.contactNo || order.party?.phone}
                </div>
              )}
            </div>

            <div className="col-span-6 space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                <span className="uppercase text-slate-500 font-semibold whitespace-nowrap">
                  EXP. REQUIRED DAYS
                </span>
                <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                  {order.expRequiredDays || 0}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                <span className="uppercase text-slate-500 font-semibold whitespace-nowrap">
                  EXP. REQUIRED DATE
                </span>
                <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                  {formatDate(order.expDeliveryDate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                <span className="uppercase text-slate-500 font-semibold whitespace-nowrap">
                  SO DAYS
                </span>
                <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                  {order.soDays || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-6 print:mt-4">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-200">
                  <th className="py-2 px-2 w-8 whitespace-nowrap">Sr.</th>
                  <th className="py-2 px-2">Product / Material / Service SKU.</th>
                  <th className="py-2 px-2 w-14 text-center whitespace-nowrap">Size</th>
                  <th className="py-2 px-2 w-18 text-right whitespace-nowrap">Order Qty.</th>
                  <th className="py-2 px-2 w-12 text-center whitespace-nowrap">Unit</th>
                  <th className="py-2 px-2 w-24 text-right whitespace-nowrap">Rate</th>
                  <th className="py-2 px-2 w-24 text-right whitespace-nowrap">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(order.items || []).map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium text-slate-900">
                      {it.sku}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600 whitespace-nowrap">
                      {it.size || "-"}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-semibold whitespace-nowrap">
                      {it.quantity}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-500 whitespace-nowrap">Pcs</td>
                    <td className="py-2 px-2 text-right font-mono whitespace-nowrap">
                      {Number(it.rate || 0).toFixed(2)} ₹
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-semibold whitespace-nowrap">
                      {Number(it.amount || 0).toFixed(2)} ₹
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-300 font-bold text-slate-900">
                  <td colSpan={3} className="py-2.5 px-2 text-center">
                    Total
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono whitespace-nowrap">
                    {order.orderQty}
                  </td>
                  <td />
                  <td />
                  <td className="py-2.5 px-2 text-right font-mono whitespace-nowrap">
                    {Number(order.totalAmount || 0).toFixed(2)} ₹
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="pt-12 mt-8 border-t border-slate-200 space-y-6 text-[11px] print:pt-6 print:mt-6 print:space-y-3">
          <div className="flex justify-end">
            <div className="text-right space-y-1">
              <div className="text-slate-400 italic text-xs">signature</div>
              <div className="font-bold text-slate-900">For {companyName}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                AUTHORIZED SIGNATORY
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500 pt-3 border-t border-slate-100">
            Thank you for your business!
            {company?.phone ? ` For any inquiries, please contact us at ${company.phone}.` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
