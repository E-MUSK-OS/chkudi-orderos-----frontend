"use client";

import React, { useEffect, useState } from "react";
import { Download, Printer, Share2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { downloadDocumentPdf } from "@/lib/downloadDocumentPdf";
import { MaterialPurchaseChallan } from "../types/materialChallan.types";

interface MaterialChallanViewModalProps {
  open: boolean;
  challan: MaterialPurchaseChallan | null;
  onClose: () => void;
  isPage?: boolean;
}

interface CompanyInfo {
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${d.getFullYear()}`;
}

export default function MaterialChallanViewModal({
  open,
  challan,
  onClose,
  isPage = false,
}: MaterialChallanViewModalProps) {
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    fetchWithAuth(`${API_BASE_URL}/companies`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list = json?.data?.companies || json?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const active = list.find((c: any) => c.isDefault || c.isActive) || list[0];
          setCompany(active);
        }
      })
      .catch(() => {});

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !challan) return null;

  const supplier = challan.supplier as any;
  const supplierAddress = [
    supplier?.addressLine1,
    supplier?.addressLine2,
    supplier?.city,
    supplier?.state,
    supplier?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const companyName = company?.companyName || "COMPANY NAME";
  const companyLocation = [company?.address, company?.city, company?.state, company?.pincode]
    .filter(Boolean)
    .join(", ");

  const rollRows = (challan.items || []).flatMap((it) =>
    (Array.isArray(it.rollDetails) ? it.rollDetails : []).map((r) => ({
      sku: it.sku,
      unit: it.unit || "Pcs",
      rolls: r.rolls,
      qty: r.qty,
      realQty: r.realQty,
    }))
  );

  return (
    <div
      onClick={(e) => {
        if (!isPage && e.target === e.currentTarget) onClose();
      }}
      className={
        isPage
          ? "min-h-screen bg-[#1f2023] overflow-y-auto p-4 sm:p-8 print:min-h-0 print:bg-white print:p-0"
          : "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 print:static print:bg-white print:p-0"
      }
    >
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #ffffff !important;
          }
        }
      `}</style>
      {/* Top-Right Action Bar */}
      <div className="w-full flex items-center justify-end gap-2 mb-4 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </button>
        <button
          type="button"
          onClick={() => {
            downloadDocumentPdf({
              fileName: `material-challan-${challan.challanNo || challan.id}.pdf`,
              documentTitle: "Material Purchase Challan",
              isChallan: true,
              docNo: challan.challanNo || "-",
              docDate: challan.challanDate || challan.createdAt,
              company: company as any,
              partySectionTitle: "Supplier.",
              partyName: challan.supplier?.partyName || challan.supplierName || "-",
              partyAddress: challan.supplier?.addressLine1 || "",
              partyGstin: (challan.supplier as any)?.gstin || "",
              partyPhone: challan.supplier?.phone || "",
              items: (challan.items || []).map((it: any, idx: number) => ({
                srNo: idx + 1,
                name: it.materialName || it.particular || it.sku || "-",
                subText: it.sku || undefined,
                hsn: it.hsn || "-",
                qty: Number(it.receivedQty || it.quantity || 0),
                rate: Number(it.rate || 0),
                total: Number(it.amount || it.total || 0),
              })),
              totals: [
                { label: "Total Received Qty", value: Number(challan.totalReceivedQty || 0) },
                { label: "Total Amount", value: Number(challan.totalAmount || 0), bold: true },
              ],
            });
            toast.success("Material Challan PDF downloaded.");
          }}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={async () => {
            const shareText = `Purchase Challan ${challan.challanNo} - ${
              challan.supplier?.partyName || challan.supplierName
            } (Qty: ${Number(challan.totalReceivedQty || 0).toFixed(2)})`;
            if (navigator.share) {
              try {
                await navigator.share({ title: `Challan ${challan.challanNo}`, text: shareText });
                return;
              } catch {
                // fallback to clipboard
              }
            }
            await navigator.clipboard?.writeText(shareText);
            toast.success("Challan details copied to clipboard.");
          }}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Printable White Sheet */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 print:shadow-none print:rounded-none">
        <div className="text-center mb-6">
          <h2 className="text-base sm:text-lg font-extrabold tracking-wide uppercase text-slate-900">
            PURCHASE CHALLAN
          </h2>
        </div>

        {/* Company & Challan Header */}
        <div className="flex flex-wrap print:flex-nowrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-start gap-3.5 max-w-md print:max-w-[65%]">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={companyName}
                className="w-14 h-14 object-contain rounded-xl border border-slate-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-900 text-[#E8C16D] font-black text-lg flex items-center justify-center shrink-0">
                {companyName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="text-xs space-y-0.5">
              <p className="text-sm sm:text-base font-extrabold text-slate-900 uppercase">
                {companyName}
              </p>
              {companyLocation && <p className="text-slate-600">{companyLocation}</p>}
              {company?.gstNumber && (
                <p className="font-bold text-slate-800">GSTN. {company.gstNumber}</p>
              )}
              {company?.phone && (
                <p className="font-semibold text-slate-700">Contact. {company.phone}</p>
              )}
            </div>
          </div>

          <div className="text-right text-xs space-y-1">
            <p className="text-slate-600">
              Date. <span className="font-bold text-slate-900">{formatDate(challan.challanDate)}</span>
            </p>
            <p className="text-slate-600">
              No. <span className="font-bold font-mono text-slate-900">{challan.challanNo}</span>
            </p>
          </div>
        </div>

        {/* Supplier & Transport Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 py-5 border-b border-slate-200 text-xs">
          <div className="space-y-1 pr-4 md:border-r print:border-r border-slate-200">
            <p className="font-bold text-slate-700">Supplier Detail.</p>
            <p className="font-extrabold text-sm text-slate-900 uppercase">
              {challan.supplier?.partyName || challan.supplierName}
            </p>
            {supplierAddress && (
              <p className="text-slate-600">
                <span className="font-semibold text-slate-800">Address. </span>
                {supplierAddress}
              </p>
            )}
            {(supplier?.gstNumber || supplier?.gstin) && (
              <p className="text-slate-700">
                <span className="font-semibold text-slate-800">GSTN. </span>
                {supplier?.gstNumber || supplier?.gstin}
              </p>
            )}
            <p className="text-slate-700">
              <span className="font-semibold text-slate-800">Contact. </span>
              {challan.contactNo || supplier?.phone || "-"}
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 uppercase font-semibold">COURIER PARTNER.</span>
              <span className="font-bold text-slate-900">{challan.courierPartner || "-"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 uppercase font-semibold">LR NO.</span>
              <span className="font-bold font-mono text-slate-900">{challan.lrNo || "-"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500 uppercase font-semibold">PARTY CHALLAN NO.</span>
              <span className="font-bold font-mono text-slate-900">
                {challan.partyChallanNo || "-"}
              </span>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">
                  DISPATCHED FROM.
                </p>
                <p className="font-bold text-slate-900">{supplier?.city || "-"}</p>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-slate-300" />
                <Truck className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="h-[1px] flex-1 bg-slate-300" />
              </div>
              <div className="text-left shrink-0">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">DESTINATION.</p>
                <p className="font-bold text-slate-900">{company?.city || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-y border-slate-200">
                <th className="py-2 px-3 w-12">Sr.</th>
                <th className="py-2 px-3">SKU.</th>
                <th className="py-2 px-3 text-right">Received Qty.</th>
                <th className="py-2 px-3 text-right">Rate.</th>
                <th className="py-2 px-3 text-right">Amount.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(challan.items || []).map((it, idx) => (
                <tr key={it.id || idx}>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{it.sku}</td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {Number(it.receivedQty || 0)} {it.unit || ""}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {Number(it.rate || 0).toFixed(2)} ₹
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold">
                    {Number(it.amount || 0).toFixed(2)} ₹
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200">
                <td className="py-2.5 px-3" />
                <td className="py-2.5 px-3 text-center">Total</td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {Number(challan.totalReceivedQty || 0).toFixed(2)}
                </td>
                <td className="py-2.5 px-3" />
                <td className="py-2.5 px-3 text-right font-mono">
                  {Number(challan.totalAmount || 0).toFixed(2)} ₹
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Taka / Packet Details if present */}
        {rollRows.length > 0 && (
          <div className="pb-6">
            <p className="text-xs font-bold text-slate-800 mb-2">Taka/Packet Details.</p>
            <table className="w-full max-w-lg text-left border-collapse text-xs border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="py-2 px-3">SKU.</th>
                  <th className="py-2 px-3 text-right">Taka/Packet No.</th>
                  <th className="py-2 px-3 text-right">Qty.</th>
                  <th className="py-2 px-3 text-right">Total Qty.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rollRows.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-medium text-slate-800">{r.sku}</td>
                    <td className="py-2 px-3 text-right font-mono">{r.rolls}</td>
                    <td className="py-2 px-3 text-right font-mono">
                      {Number(r.qty || 0).toFixed(2)} {r.unit}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      {Number(r.realQty || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature & Footer */}
        <div className="pt-8 flex justify-end">
          <div className="text-right text-xs space-y-1">
            <p className="italic text-slate-400">signature</p>
            <p className="font-bold text-slate-900">For {companyName}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              AUTHORIZED SIGNATORY
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Thank you for your business! For any inquiries, please contact us
          {company?.phone ? ` at ${company.phone}` : ""}
          {company?.email ? ` or ${company.email}` : ""}.
        </div>
      </div>
    </div>
  );
}
