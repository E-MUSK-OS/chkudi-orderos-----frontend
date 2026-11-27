"use client";

import React, { useEffect, useState } from "react";
import { Download, Printer, Share2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { MaterialPurchaseDebitNote } from "../types/materialDebitNote.types";

interface MaterialDebitNoteViewProps {
  debitNote: MaterialPurchaseDebitNote | null;
  onClose: () => void;
  title?: string;
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

export default function MaterialDebitNoteView({
  debitNote,
  onClose,
  title = "DEBIT NOTE",
}: MaterialDebitNoteViewProps) {
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

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

    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!debitNote) return null;

  const supplier = debitNote.supplier as any;
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

  return (
    <div className="min-h-screen bg-[#1f2023] overflow-y-auto p-4 sm:p-8 print:min-h-0 print:bg-white print:p-0">
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
          onClick={() => window.print()}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={async () => {
            const shareText = `Debit Note ${debitNote.debitNoteNo} - ${
              debitNote.supplier?.partyName || debitNote.supplierName
            } (Net: ₹${Number(debitNote.netAmount || 0).toFixed(2)})`;
            if (navigator.share) {
              try {
                await navigator.share({
                  title: `Debit Note ${debitNote.debitNoteNo}`,
                  text: shareText,
                });
                return;
              } catch {
                // fallback
              }
            }
            await navigator.clipboard?.writeText(shareText);
            toast.success("Debit Note details copied to clipboard.");
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
        <div className="text-center mb-5">
          <h2 className="text-base sm:text-lg font-extrabold tracking-wide uppercase text-slate-900">
            DEBIT NOTE
          </h2>
        </div>

        {/* Company & DN Header */}
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
              Date.{" "}
              <span className="font-bold text-slate-900">
                {formatDate(debitNote.debitNoteDate)}
              </span>
            </p>
            <p className="text-slate-600">
              No.{" "}
              <span className="font-bold font-mono text-slate-900">
                {debitNote.debitNoteNo}
              </span>
            </p>
          </div>
        </div>

        {/* Supplier & Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 py-5 border-b border-slate-200 text-xs">
          <div className="space-y-1 pr-4 md:border-r print:border-r border-slate-200">
            <p className="font-bold text-slate-700">Supplier Detail.</p>
            <p className="font-extrabold text-sm text-slate-900 uppercase">
              {debitNote.supplier?.partyName || debitNote.supplierName}
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
              {debitNote.contactNo || supplier?.phone || "-"}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">
                  {title} NO
                </p>
                <p className="font-bold font-mono text-slate-900">{debitNote.debitNoteNo}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">DATE</p>
                <p className="font-bold text-slate-900">
                  {formatDate(debitNote.debitNoteDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">
                  DISPATCHED FROM.
                </p>
                <p className="font-bold text-slate-900">{company?.city || "-"}</p>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-slate-300" />
                <Truck className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="h-[1px] flex-1 bg-slate-300" />
              </div>
              <div className="text-left shrink-0">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">
                  DESTINATION.
                </p>
                <p className="font-bold text-slate-900">{supplier?.city || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Row Items Table matching reference */}
        <div className="py-5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-t border-slate-200">
                <th className="pt-2 pb-1 px-2.5 w-10">Sr.</th>
                <th className="pt-2 pb-1 px-2.5">SKU.</th>
                <th className="pt-2 pb-1 px-2.5 text-right">Qty.</th>
                <th className="pt-2 pb-1 px-2.5 text-right">Rate.</th>
                <th className="pt-2 pb-1 px-2.5 text-right">Less.Disc.</th>
                <th className="pt-2 pb-1 px-2.5 text-right">SGST.</th>
                <th className="pt-2 pb-1 px-2.5 text-right" />
              </tr>
              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <th className="pt-0.5 pb-2 px-2.5" />
                <th className="pt-0.5 pb-2 px-2.5">HSN - Invoice No.</th>
                <th className="pt-0.5 pb-2 px-2.5" />
                <th className="pt-0.5 pb-2 px-2.5 text-right">Gross Amt.</th>
                <th className="pt-0.5 pb-2 px-2.5 text-right">Taxable Amount.</th>
                <th className="pt-0.5 pb-2 px-2.5 text-right">CGST.</th>
                <th className="pt-0.5 pb-2 px-2.5 text-right">Total.</th>
              </tr>
            </thead>
            <tbody>
              {(debitNote.items || []).map((it, idx) => {
                const hsnInv = [it.hsnCode, it.refInvoiceNo].filter(Boolean).join(" - ") || "-";
                return (
                  <React.Fragment key={it.id || idx}>
                    <tr className="border-t border-slate-100">
                      <td className="pt-2.5 pb-1 px-2.5 font-mono text-slate-500 align-top">
                        {idx + 1}
                      </td>
                      <td className="pt-2.5 pb-1 px-2.5 font-semibold text-slate-900">
                        {it.sku}
                      </td>
                      <td className="pt-2.5 pb-1 px-2.5 text-right font-mono align-top">
                        {Number(it.qty || 0)} {it.unit || ""}
                      </td>
                      <td className="pt-2.5 pb-1 px-2.5 text-right font-mono align-top">
                        {Number(it.rate || 0).toFixed(2)} ₹
                      </td>
                      <td className="pt-2.5 pb-1 px-2.5 text-right font-mono align-top">
                        {Number(it.discAmount || 0).toFixed(2)} ₹
                      </td>
                      <td className="pt-2.5 pb-1 px-2.5 text-right font-mono align-top">
                        {Number(it.sgstAmount || 0).toFixed(2)} ₹
                      </td>
                      <td className="pt-2.5 pb-1 px-2.5" />
                    </tr>
                    <tr className="border-b border-slate-200 text-slate-700">
                      <td className="pt-0.5 pb-2.5 px-2.5" />
                      <td className="pt-0.5 pb-2.5 px-2.5 font-mono text-[11px]">
                        {hsnInv}
                      </td>
                      <td className="pt-0.5 pb-2.5 px-2.5" />
                      <td className="pt-0.5 pb-2.5 px-2.5 text-right font-mono">
                        {Number(it.amount || 0).toFixed(2)} ₹
                      </td>
                      <td className="pt-0.5 pb-2.5 px-2.5 text-right font-mono">
                        {Number(it.taxableAmount || 0).toFixed(2)} ₹
                      </td>
                      <td className="pt-0.5 pb-2.5 px-2.5 text-right font-mono">
                        {Number(it.cgstAmount || 0).toFixed(2)} ₹
                      </td>
                      <td className="pt-0.5 pb-2.5 px-2.5 text-right font-mono font-bold text-slate-900">
                        {Number(it.netAmount || 0).toFixed(2)} ₹
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Breakdown */}
        <div className="flex justify-end pb-6">
          <div className="w-full max-w-xs space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Amount</span>
              <span className="font-mono font-semibold">
                ₹ {Number(debitNote.grossAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Discount Amount</span>
              <span className="font-mono font-semibold">
                ₹ {Number(debitNote.discountAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Before Tax Amount</span>
              <span className="font-mono">
                ₹ {Number(debitNote.beforeTaxAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">SGST.</span>
              <span className="font-mono font-semibold">
                ₹ {Number(debitNote.sgstAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">CGST.</span>
              <span className="font-mono font-semibold">
                ₹ {Number(debitNote.cgstAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">IGST.</span>
              <span className="font-mono font-semibold">
                ₹ {Number(debitNote.igstAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>After Tax Amount</span>
              <span className="font-mono">
                ₹ {Number(debitNote.afterTaxAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">
                TDS ({Number(debitNote.tdsPercent || 0)}%)
              </span>
              <span className="font-mono font-semibold">
                ₹ {Number(debitNote.tdsAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">
                TCS ({Number(debitNote.tcsPercent || 0)}%)
              </span>
              <span className="font-mono font-semibold">
                ₹ {Number(debitNote.tcsAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Other Expense</span>
              <span className="font-mono font-semibold">
                ₹ {Number(debitNote.otherExpense || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1.5 border-t border-slate-300">
              <span>Net Amount</span>
              <span className="font-mono">
                ₹ {Number(debitNote.netAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Signature & Footer */}
        <div className="pt-6 flex justify-end">
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
