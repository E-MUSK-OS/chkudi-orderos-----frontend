"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Printer, Truck, Download, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { SalesInvoice } from "../types/salesInvoice.types";
import { salesInvoiceService } from "../services/salesInvoice.service";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";

interface InvoiceViewModalProps {
  isOpen: boolean;
  invoice: SalesInvoice | null;
  onClose: () => void;
}

type CopyType = "Original for Recipient" | "Duplicate for Transporter" | "Triplicate for Supplier";

function formatCurrency(num: number | string | undefined | null): string {
  const n = Number(num || 0);
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQty(num: number | string | undefined | null): string {
  const n = Number(num || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

function formatDate(dateVal: any): string {
  if (!dateVal) return "-";
  const str = String(dateVal);
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`;
  const dmy = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dmy) return `${dmy[1]}-${dmy[2]}-${dmy[3]}`;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return str;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function printHtmlInIframe(htmlContent: string, title = "Tax Invoice") {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((el) => el.outerHTML)
    .join("\n");

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${styles}
  <style>
    @page { size: A4 portrait; margin: 6mm; }
    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .print-invoice-sheet {
      max-width: 100% !important;
      width: 100% !important;
      min-height: 282mm !important;
      display: flex !important;
      flex-direction: column !important;
      margin: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 12px 16px 54px 16px !important;
    }
    .print-invoice-sheet .print-bottom-section {
      margin-top: auto !important;
      padding-top: 16px !important;
    }
    .print-invoice-sheet .print-page-footer {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      background: #ffffff !important;
      padding: 8px 16px 4px 16px !important;
      border-top: 1px solid #e2e8f0 !important;
      z-index: 20 !important;
    }
    .invoice-page-break { page-break-after: always; break-after: page; }
    .invoice-page-break:last-child { page-break-after: auto; break-after: auto; }
  </style>
</head>
<body class="bg-white text-slate-900">
  ${htmlContent}
</body>
</html>`);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 350);
}

interface TaxInvoiceSheetProps {
  inv: SalesInvoice;
  company: Company | null;
  selectedCopy?: CopyType;
  onSelectCopy?: (copy: CopyType) => void;
}

export function TaxInvoiceSheet({
  inv,
  company,
  selectedCopy = "Original for Recipient",
  onSelectCopy,
}: TaxInvoiceSheetProps) {
  const companyName =
    inv.companyName || company?.legalName || company?.companyName || "Company Name";
  const companyAddressLines = useMemo(() => {
    if (!company) return [];
    return [
      company.billingAddress1 || company.addressLine1,
      company.billingAddress2 || company.addressLine2,
      company.billingAddress3 || company.billingArea,
      [
        company.billingCity || company.city,
        company.billingState || company.state,
        company.billingPincode || company.pincode,
      ]
        .filter(Boolean)
        .join(", "),
    ].filter((l): l is string => Boolean(l && l.trim()));
  }, [company]);

  const partyAddressLines = useMemo(() => {
    return [
      inv.billingAddress,
      [inv.billingCity, inv.billingState, inv.billingPincode].filter(Boolean).join(" "),
    ].filter((l): l is string => Boolean(l && l.trim()));
  }, [inv]);

  const qrValue = useMemo(() => {
    const amount = Number(inv.netAmount || 0).toFixed(2);
    if (company?.upiId) {
      const pn = encodeURIComponent(company.accountHolderName || company.accountName || companyName);
      return `upi://pay?pa=${encodeURIComponent(company.upiId)}&pn=${pn}&am=${amount}&cu=INR`;
    }
    return [
      `PAY TO: ${companyName}`,
      `BANK: ${company?.bankName || inv.bankName || "-"}`,
      `A/C: ${company?.accountNumber || "-"}`,
      `IFSC: ${company?.ifscCode || "-"}`,
      `AMOUNT: INR ${amount}`,
    ].join("\n");
  }, [company, companyName, inv]);

  const items = Array.isArray(inv.items) ? inv.items : [];
  const dispatchedFrom = company?.billingCity || company?.city || "-";
  const destination = inv.shippingCity || inv.billingCity || "-";
  const contactName = company?.billingContactName || company?.ownerName || "";
  const contactPhone = company?.billingContactNo || company?.phone || "";
  const partyGstn = inv.partyGstn || inv.party?.gstn || "-";
  const partyContact = inv.billingMobile || inv.party?.mobile || "-";

  return (
    <div className="print-invoice-sheet mx-auto max-w-[794px] min-h-[1080px] bg-white text-slate-900 rounded-md shadow-sm border border-slate-200 px-7 py-6 text-[12px] leading-relaxed flex flex-col">
      {/* Top Title Row */}
      <div className="relative flex items-center justify-center mb-4">
        <h1 className="text-base font-bold tracking-wide text-slate-900 uppercase">TAX INVOICE</h1>
        <span className="absolute right-0 text-sm font-semibold tracking-wider text-slate-300 uppercase">
          SALE
        </span>
      </div>

      {/* Company Header + Copy Checkboxes */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-start gap-3.5">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={companyName}
              className="h-16 w-16 rounded-lg object-contain border border-slate-200 bg-slate-950 p-1 shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-[#0A0E1A] text-[#E8C16D] flex items-center justify-center font-bold text-lg tracking-wider shrink-0">
              {companyName
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>
          )}

          <div className="space-y-0.5 text-[11.5px] text-slate-700">
            <div className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
              {companyName}
            </div>
            {inv.branchName && (
              <div className="font-semibold text-slate-800">
                Branch. {inv.branchName}
              </div>
            )}
            {companyAddressLines.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
            {company?.gstNumber && (
              <div className="font-bold text-slate-900">GSTN. {company.gstNumber}</div>
            )}
            {(contactName || contactPhone) && (
              <div className="font-semibold text-slate-900">
                {contactName ? `Contact. ${contactName.toUpperCase()}` : ""}
                {contactName && contactPhone ? " | " : ""}
                {contactPhone ? `No. ${contactPhone}` : ""}
              </div>
            )}
          </div>
        </div>

        {/* Copy Type Selector */}
        <div className="space-y-1.5 text-[11px] text-slate-700 shrink-0 pt-1">
          {(
            [
              "Original for Recipient",
              "Duplicate for Transporter",
              "Triplicate for Supplier",
            ] as CopyType[]
          ).map((copy) => {
            const isChecked = selectedCopy === copy;
            return (
              <button
                key={copy}
                type="button"
                onClick={() => onSelectCopy?.(copy)}
                className="flex items-center gap-2 cursor-pointer text-left w-full"
              >
                <span
                  className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    isChecked ? "border-slate-900" : "border-slate-400"
                  }`}
                >
                  {isChecked && <span className="h-2 w-2 rounded-full bg-slate-900" />}
                </span>
                <span className={isChecked ? "font-semibold text-slate-900" : ""}>{copy}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Party Detail & Invoice Meta + Dispatch */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-4">
        <div className="sm:col-span-5 space-y-0.5 text-[11.5px] text-slate-700">
          <div className="text-xs font-bold text-slate-900 mb-1">Party Detail.</div>
          <div className="font-semibold text-slate-900 uppercase">{inv.billingPartyName}</div>
          {partyAddressLines.length > 0 && (
            <div>
              <span className="font-bold text-slate-800">Address. </span>
              {partyAddressLines.join(", ")}
            </div>
          )}
          <div>
            <span className="font-bold text-slate-800">GSTN. </span>
            {partyGstn}
          </div>
          <div>
            <span className="font-bold text-slate-800">Contact. </span>
            {partyContact}
          </div>
        </div>

        <div className="sm:col-span-7 flex flex-col justify-between gap-3">
          <div className="bg-[#F3F5F8] rounded px-3.5 py-2.5 flex items-start justify-between gap-4 text-[11px]">
            <div className="space-y-2">
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">INVOICE NO:</div>
                <div className="font-bold text-slate-900">{inv.invoiceNo}</div>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase">REMARK:- </span>
                <span className="text-slate-700">{inv.remarks || ""}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">DATE:</div>
              <div className="font-bold text-slate-900">{formatDate(inv.invoiceDate)}</div>
            </div>
          </div>

          {/* Dispatched From -> Destination */}
          <div className="flex items-center justify-between gap-2 px-2 text-[11px]">
            <div className="text-center min-w-[90px]">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">
                DISPATCHED FROM.
              </div>
              <div className="font-semibold text-slate-900">{dispatchedFrom}</div>
            </div>
            <div className="flex-1 flex items-center gap-1.5">
              <div className="h-px flex-1 bg-slate-300" />
              <Truck className="w-4 h-4 text-slate-700 shrink-0" />
              <div className="h-px flex-1 bg-slate-300" />
            </div>
            <div className="text-center min-w-[90px]">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">DESTINATION.</div>
              <div className="font-semibold text-slate-900">{destination}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table (2-row layout matching screenshot) */}
      <div className="mt-1">
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="bg-[#F3F5F8] text-slate-900 font-bold border-t border-slate-200">
              <th className="py-1.5 px-2.5 text-left w-10">Sr.</th>
              <th className="py-1.5 px-2 text-left">SKU.</th>
              <th className="py-1.5 px-2 text-right w-20">Qty.</th>
              <th className="py-1.5 px-2 text-right w-24">Rate.</th>
              <th className="py-1.5 px-2 text-right w-24">Disc.</th>
              <th className="py-1.5 px-2 text-right w-24">SGST.</th>
              <th className="py-1.5 px-2.5 text-right w-28"></th>
            </tr>
            <tr className="bg-[#F3F5F8] text-slate-900 font-bold border-b border-slate-200">
              <th className="pb-1.5 px-2.5 text-left"></th>
              <th className="pb-1.5 px-2 text-left">HSN.</th>
              <th className="pb-1.5 px-2 text-right"></th>
              <th className="pb-1.5 px-2 text-right">Gross Amt.</th>
              <th className="pb-1.5 px-2 text-right">Taxable Amount.</th>
              <th className="pb-1.5 px-2 text-right">CGST.</th>
              <th className="pb-1.5 px-2.5 text-right">Total.</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No items found in this invoice.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <React.Fragment key={item.id || idx}>
                  <tr className="border-t border-slate-200">
                    <td className="pt-2.5 pb-0.5 px-2.5 align-top text-slate-700">
                      {item.itemNo || idx + 1}
                    </td>
                    <td className="pt-2.5 pb-0.5 px-2 align-top">
                      <div className="font-semibold text-slate-900">
                        {item.particular || item.sku}
                      </div>
                      {(item.sku || inv.challanNo) && (
                        <div className="text-[10.5px] text-slate-500">
                          {item.sku || inv.challanNo}
                        </div>
                      )}
                    </td>
                    <td className="pt-2.5 pb-0.5 px-2 text-right align-top text-slate-800">
                      {formatQty(item.quantity)}
                    </td>
                    <td className="pt-2.5 pb-0.5 px-2 text-right align-top text-slate-800">
                      {formatCurrency(item.rate)} ₹
                    </td>
                    <td className="pt-2.5 pb-0.5 px-2 text-right align-top text-slate-800">
                      {formatCurrency(item.discountAmount)} ₹
                    </td>
                    <td className="pt-2.5 pb-0.5 px-2 text-right align-top text-slate-800">
                      {formatCurrency(item.sgstAmount)} ₹
                    </td>
                    <td className="pt-2.5 pb-0.5 px-2.5 text-right align-top"></td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="pt-0.5 pb-2 px-2.5"></td>
                    <td className="pt-0.5 pb-2 px-2 text-slate-700">{item.hsn || "-"}</td>
                    <td className="pt-0.5 pb-2 px-2"></td>
                    <td className="pt-0.5 pb-2 px-2 text-right font-bold text-slate-900">
                      {formatCurrency(item.amount)} ₹
                    </td>
                    <td className="pt-0.5 pb-2 px-2 text-right font-bold text-slate-900">
                      {formatCurrency(item.taxableAmount)} ₹
                    </td>
                    <td className="pt-0.5 pb-2 px-2 text-right text-slate-800">
                      {formatCurrency(item.cgstAmount)} ₹
                    </td>
                    <td className="pt-0.5 pb-2 px-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(item.total)} ₹
                    </td>
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="print-bottom-section mt-auto pt-6">
      {/* Bottom Section: Bank Details + Totals Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
        {/* Left: Bank Details */}
        <div className="sm:col-span-7 bg-[#F3F5F8] rounded p-4">
          <div className="text-xs font-bold text-slate-900 uppercase mb-3">BANK DETAILS</div>
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded border border-slate-200 shrink-0">
              <QRCodeSVG value={qrValue} size={92} level="M" />
            </div>
            <div className="space-y-1 text-[11px] text-slate-800 min-w-0">
              <div className="flex gap-2">
                <span className="font-bold w-24 shrink-0">BANK Name:</span>
                <span className="uppercase truncate">{company?.bankName || inv.bankName || "-"}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold w-24 shrink-0">Account Name:</span>
                <span className="uppercase truncate">
                  {company?.accountHolderName || company?.accountName || companyName}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold w-24 shrink-0">Account No:</span>
                <span>{company?.accountNumber || "-"}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold w-24 shrink-0">Branch Name:</span>
                <span className="uppercase truncate">{company?.branchName || "-"}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold w-24 shrink-0">IFSC:</span>
                <span className="uppercase">{company?.ifscCode || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Totals */}
        <div className="sm:col-span-5 space-y-1.5 text-[12px]">
          <div className="flex justify-between text-slate-700">
            <span>Gross Amount</span>
            <span>₹ {formatCurrency(inv.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Discount Amount</span>
            <span>₹ {formatCurrency(inv.totalDiscount)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900">
            <span>Before Tax Amount</span>
            <span>₹ {formatCurrency(inv.amountBeforeTax)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>SGST.</span>
            <span>₹ {formatCurrency(inv.sgstAmount)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>CGST.</span>
            <span>₹ {formatCurrency(inv.cgstAmount)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>IGST.</span>
            <span>₹ {formatCurrency(inv.igstAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900">
            <span>After Tax Amount</span>
            <span>₹ {formatCurrency(inv.amountAfterTax)}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>TDS (0%)</span>
            <span>₹ 0.00</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>TCS (0%)</span>
            <span>₹ 0.00</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Other Expense</span>
            <span>₹ {formatCurrency(inv.expenseOnSales)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
            <span>Net Amount</span>
            <span>₹ {formatCurrency(inv.netAmount)}</span>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="flex justify-end mt-8 mb-4">
        <div className="text-center space-y-1 min-w-[160px]">
          {company?.signatureUrl ? (
            <div className="border-b border-slate-300 pb-1">
              <img src={company.signatureUrl} alt="Signature" className="h-10 mx-auto object-contain" />
            </div>
          ) : (
            <div className="text-[11px] italic text-slate-400 border-b border-slate-300 pb-1">
              signature
            </div>
          )}
          <div className="text-[11.5px] font-bold text-slate-900 uppercase pt-0.5">
            For {companyName}
          </div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            AUTHORIZED SIGNATORY
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="print-page-footer border-t border-slate-200 pt-3 text-center text-[10.5px] text-slate-600">
        <div>
          Thank you for your business! For any inquiries, please contact us at 8200705348 or
          netuorderos@gmail.com. Visit our website:
        </div>
        <div>netuorderos.io</div>
      </div>
      </div>
    </div>
  );
}

export default function InvoiceViewModal({ isOpen, invoice, onClose }: InvoiceViewModalProps) {
  const [fullInvoice, setFullInvoice] = useState<SalesInvoice | null>(invoice);
  const [company, setCompany] = useState<Company | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<CopyType>("Original for Recipient");
  const [loading, setLoading] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !invoice) return;
    setFullInvoice(invoice);
    let active = true;

    const loadDetails = async () => {
      setLoading(true);
      try {
        const [invRes, compRes] = await Promise.allSettled([
          salesInvoiceService.getInvoiceById(invoice.id),
          companyService.getCompanies({ pageSize: 20 }),
        ]);

        if (!active) return;

        if (invRes.status === "fulfilled" && invRes.value) {
          setFullInvoice(invRes.value);
        }

        if (compRes.status === "fulfilled" && compRes.value?.data?.length) {
          const companies = compRes.value.data;
          const preferred =
            companies.find((c) => c.isDefault && c.status === "ACTIVE") ||
            companies.find((c) => c.isDefault) ||
            companies.find((c) => c.status === "ACTIVE") ||
            companies[0];
          setCompany(preferred || null);
        }
      } catch (_) {
        // Keep partial invoice data if fetch fails
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDetails();
    return () => {
      active = false;
    };
  }, [isOpen, invoice]);

  const inv = fullInvoice || invoice;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handlePrint = () => {
    if (!printAreaRef.current) return;
    printHtmlInIframe(printAreaRef.current.outerHTML, `Tax Invoice - ${inv?.invoiceNo || ""}`);
  };

  const handleShare = async () => {
    if (!inv) return;
    const text = `Tax Invoice #${inv.invoiceNo} - ${inv.billingPartyName} (Net Amount: ₹ ${formatCurrency(inv.netAmount)})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Tax Invoice #${inv.invoiceNo}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Invoice details copied to clipboard!");
      }
    } catch (_) {}
  };

  if (!isOpen || !inv) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#232529] overflow-y-auto overscroll-contain animate-in fade-in duration-150"
    >
      {/* Floating Top-Right Toolbar */}
      <div className="fixed top-4 right-5 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          title="Download PDF"
          className="h-8 w-8 rounded-lg bg-[#3A3D42] hover:bg-[#4A4E54] text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleShare}
          title="Share"
          className="h-8 w-8 rounded-lg bg-[#3A3D42] hover:bg-[#4A4E54] text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="h-8 w-8 rounded-full bg-[#3A3D42] hover:bg-[#4A4E54] text-white flex items-center justify-center shadow-md transition-all cursor-pointer ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Centered Full-Page White A4 Sheet */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="min-h-full py-4 sm:py-6 px-3 sm:px-6 flex justify-center items-start"
      >
        <div ref={printAreaRef} className="w-full max-w-[794px] shadow-2xl">
          <TaxInvoiceSheet
            inv={inv}
            company={company}
            selectedCopy={selectedCopy}
            onSelectCopy={setSelectedCopy}
          />
        </div>
      </div>
    </div>
  );
}
