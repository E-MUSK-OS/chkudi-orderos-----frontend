"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Printer, Download, Share2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { bankVoucherService } from "./services/bankVoucher.service";
import { printHtmlInIframe } from "@/components/Dashboard/OfflineSales/SalesInvoice/components/InvoiceViewModal";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";
import type { BankVoucher } from "./types/bankVoucher.types";
import { getMediaUrl } from "@/lib/utils";

interface BankVoucherViewPageProps {
  voucherId: string;
}

const LIST_ROUTE = "/dashboard/account/vouchers/bank-vouchers";

function formatDate(dateVal?: string | null): string {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatINR(amount: number): string {
  return Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function BankVoucherViewPage({ voucherId }: BankVoucherViewPageProps) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);

  const [voucher, setVoucher] = useState<BankVoucher | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [v, companiesRes] = await Promise.all([
          bankVoucherService.getById(voucherId),
          companyService.getCompanies().catch(() => ({ data: [] })),
        ]);
        if (!active) return;
        setVoucher(v);
        const list: Company[] = Array.isArray((companiesRes as any)?.data)
          ? (companiesRes as any).data
          : Array.isArray(companiesRes)
          ? (companiesRes as unknown as Company[])
          : [];
        const activeCompany = list.find((c) => c.isDefault) || list[0] || null;
        setCompany(activeCompany);
      } catch (err: any) {
        if (!active) return;
        toast.error(err?.response?.data?.message || "Failed to load bank voucher.");
        router.push(LIST_ROUTE);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [voucherId, router]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(LIST_ROUTE);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const handlePrint = () => {
    if (!sheetRef.current || !voucher) return;
    printHtmlInIframe(
      sheetRef.current.outerHTML,
      `${voucher.entryType} Voucher - ${voucher.voucherNo}`
    );
  };

  const handleDownloadPdf = () => {
    if (!voucher) return;
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = 18;

      const isReceiptDoc =
        voucher.entryType === "Receipt" || voucher.entryType === "Advance Receipt";
      const heading = isReceiptDoc ? "RECEIPT VOUCHER" : "PAYMENT VOUCHER";
      const compName = (company?.companyName || "COMPANY NAME").toUpperCase();
      const compAddr = [
        company?.billingAddress1 || company?.addressLine1,
        company?.billingAddress2 || company?.addressLine2,
        [
          company?.billingCity || company?.city,
          company?.billingState || company?.state,
          company?.billingPincode || company?.pincode,
        ]
          .filter(Boolean)
          .join(", "),
      ].filter(Boolean) as string[];

      const pAddr =
        voucher.address ||
        [
          voucher.party?.addressLine1,
          voucher.party?.addressLine2,
          voucher.party?.city,
          voucher.party?.state,
          voucher.party?.pincode,
        ]
          .filter(Boolean)
          .join(", ");

      // Heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text(heading, pageW / 2, y, { align: "center" });
      y += 10;

      // Company Header (Left) + Date/No (Right)
      doc.setFontSize(11);
      doc.text(compName, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Date. ${formatDate(voucher.date)}`, pageW - margin, y, { align: "right" });
      doc.text(`No. ${voucher.voucherNo}`, pageW - margin, y + 4.5, { align: "right" });

      y += 5;
      for (const line of compAddr) {
        doc.text(line, margin, y);
        y += 4;
      }
      if (company?.gstNumber) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`GSTN. ${company.gstNumber}`, margin, y);
        y += 4;
      }
      const contactPerson = company?.billingContactName || company?.ownerName;
      const contactPhone = company?.phone || company?.billingContactNo;
      if (contactPerson || contactPhone) {
        doc.setFont("helvetica", "bold");
        doc.text(
          `Contact. ${contactPerson || "-"}${contactPhone ? ` | No. ${contactPhone}` : ""}`,
          margin,
          y
        );
        y += 4;
      }

      y += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      // Two-column Party & Transaction Details
      const midX = pageW / 2 - 2;
      let leftY = y;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text("Payment To.", margin, leftY);
      leftY += 4.5;
      doc.setFontSize(8.5);
      doc.text(voucher.partyName.toUpperCase(), margin, leftY);
      leftY += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      if (pAddr) {
        const wrapped = doc.splitTextToSize(`Address. ${pAddr}`, midX - margin - 4);
        doc.text(wrapped, margin, leftY);
        leftY += wrapped.length * 4;
      }
      doc.text(`GSTN. ${voucher.party?.gstin || "-"}`, margin, leftY);
      leftY += 4;
      doc.text(`Contact. ${voucher.party?.phone || "-"}`, margin, leftY);
      leftY += 4;

      let rightY = y;
      const rightStart = midX + 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text("Transaction Details:", rightStart, rightY);
      rightY += 5;

      const txRows: [string, string][] = [
        ["MODE.", voucher.transactionType || "-"],
        ["REFERENCE NO.", voucher.transactionNo || voucher.refNo || "-"],
        ["BANK NAME.", (voucher.bankName || voucher.bankBookName || "-").toUpperCase()],
        ["BENEFICIARY NAME.", (voucher.beneficiary || voucher.partyName || "-").toUpperCase()],
        ["DATE.", formatDate(voucher.transactionDate || voucher.date)],
      ];
      doc.setFontSize(8);
      for (const [k, val] of txRows) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(k, rightStart, rightY);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(val, pageW - margin, rightY, { align: "right" });
        rightY += 5;
      }

      const sectionBottom = Math.max(leftY, rightY) + 2;
      doc.line(midX + 1, y - 2, midX + 1, sectionBottom - 2);
      doc.line(margin, sectionBottom, pageW - margin, sectionBottom);
      y = sectionBottom + 6;

      // Summary Banner
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const summaryText = `Payment done with a sum of Rs. ${voucher.amount} to ${voucher.partyName.toUpperCase()} in favour of ${voucher.narration || "purchase payment"}.`;
      const wrappedSummary = doc.splitTextToSize(summaryText, 110);
      doc.text(wrappedSummary, margin, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`Rs. ${formatINR(voucher.amount)}`, pageW - margin, y + 2, { align: "right" });

      y += Math.max(wrappedSummary.length * 4.5, 8) + 4;
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      // Table
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Sr.", "Type.", "Invoice No.", "Ref No.", "Invoice Amount.", "settlement Amount."]],
        body: [
          [
            "1",
            `${voucher.entryType} Voucher`,
            String(voucher.voucherNo),
            voucher.refNo || voucher.transactionNo || "",
            `${voucher.amount}`,
            `${voucher.amount}`,
          ],
        ],
        styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 41, 59] },
        headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold" },
        columnStyles: {
          4: { halign: "right" },
          5: { halign: "right" },
        },
      });

      const afterTableY = (doc as any).lastAutoTable?.finalY || y + 20;
      const sigY = afterTableY + 18;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text("signature", pageW - margin - 20, sigY, { align: "center" });
      doc.line(pageW - margin - 42, sigY + 2, pageW - margin, sigY + 2);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`For ${compName}`, pageW - margin - 20, sigY + 6.5, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("AUTHORIZED SIGNATORY", pageW - margin - 20, sigY + 10.5, { align: "center" });

      // Footer
      const footerY = sigY + 16;
      doc.line(margin, footerY, pageW - margin, footerY);
      doc.setFontSize(8);
      doc.text(
        `Thank you for your business! For any inquiries, please contact us at ${company?.phone || "8200705348"} or ${company?.email || "netuorderos@gmail.com"}. Visit our website:`,
        pageW / 2,
        footerY + 5,
        { align: "center" }
      );
      doc.text(company?.website || "https://netuorderos.io", pageW / 2, footerY + 9.5, {
        align: "center",
      });

      const slug = voucher.entryType.toLowerCase().replace(/\s+/g, "-");
      doc.save(`${slug}-voucher-${voucher.voucherNo}.pdf`);
      toast.success("Voucher PDF downloaded.");
    } catch (err) {
      console.error("Failed to generate voucher PDF:", err);
      toast.error("Failed to download PDF.");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${voucher?.entryType || "Bank"} Voucher #${voucher?.voucherNo}`,
          url,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Voucher link copied to clipboard.");
    } catch {
      toast.error("Unable to copy link.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#080B11] flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm text-[#6A4D1D] dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-[#B88728] dark:text-[#E8C16D]" />
          <span>Loading voucher...</span>
        </div>
      </div>
    );
  }

  if (!voucher) return null;

  const isReceipt = voucher.entryType === "Receipt";
  const voucherHeading = isReceipt ? "RECEIPT VOUCHER" : "PAYMENT VOUCHER";

  const companyName = company?.companyName || "COMPANY NAME";
  const companyAddressLines = [
    company?.billingAddress1 || company?.addressLine1,
    company?.billingAddress2 || company?.addressLine2,
    [company?.billingCity || company?.city, company?.billingState || company?.state, company?.billingPincode || company?.pincode]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);

  const partyAddress =
    voucher.address ||
    [
      voucher.party?.addressLine1,
      voucher.party?.addressLine2,
      voucher.party?.city,
      voucher.party?.state,
      voucher.party?.pincode,
    ]
      .filter(Boolean)
      .join(", ");

  const logoSrc = company?.logoUrl ? getMediaUrl(company.logoUrl) : "";
  const signatureSrc = company?.signatureUrl ? getMediaUrl(company.signatureUrl) : "";

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#080B11] text-slate-900 overflow-y-auto py-3 sm:py-5 px-3 sm:px-6 print:bg-white print:p-0">
      {/* Top Action Toolbar: Center on mobile, Top-Right on desktop */}
      <div className="sticky top-3 z-50 flex items-center justify-center gap-2 mb-3 md:mb-0 md:fixed md:top-4 md:right-5 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white border border-[#E7E0D2] dark:border-white/[0.12] hover:bg-[#FEFAEE] dark:hover:bg-[#131B2E] shadow-md transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          title="Download PDF"
          className="h-8 w-8 rounded-lg bg-white dark:bg-[#0F1626] hover:bg-[#FEFAEE] dark:hover:bg-[#131B2E] text-[#0A0E1A] dark:text-white border border-[#E7E0D2] dark:border-white/[0.12] flex items-center justify-center shadow-md transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleShare}
          title="Share"
          className="h-8 w-8 rounded-lg bg-white dark:bg-[#0F1626] hover:bg-[#FEFAEE] dark:hover:bg-[#131B2E] text-[#0A0E1A] dark:text-white border border-[#E7E0D2] dark:border-white/[0.12] flex items-center justify-center shadow-md transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => router.push(LIST_ROUTE)}
          title="Close"
          className="h-8 w-8 rounded-lg bg-white dark:bg-[#0F1626] hover:bg-[#FEFAEE] dark:hover:bg-[#131B2E] text-[#0A0E1A] dark:text-white border border-[#E7E0D2] dark:border-white/[0.12] flex items-center justify-center shadow-md transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Printable Voucher Sheet */}
      <div
        ref={sheetRef}
        className="max-w-[820px] mx-auto bg-white text-[#1E293B] rounded-xl shadow-2xl p-4 sm:p-6 print:shadow-none print:rounded-none print:max-w-full"
      >
        {/* Document Heading */}
        <h1 className="text-center text-base sm:text-lg font-extrabold tracking-wide text-[#1E293B] mb-3">
          {voucherHeading}
        </h1>

        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-start gap-3.5">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={companyName}
                className="h-14 w-14 rounded-xl object-contain border border-slate-200 bg-slate-900 p-1 shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-[#0A0E1A] text-[#E8C16D] flex items-center justify-center text-lg font-black shrink-0">
                {companyName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="space-y-0.5 text-xs text-slate-600">
              <div className="text-sm sm:text-base font-extrabold text-[#1E293B] uppercase">
                {companyName}
              </div>
              {companyAddressLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
              {company?.gstNumber && (
                <div className="font-bold text-[#1E293B] pt-0.5">
                  GSTN. {company.gstNumber}
                </div>
              )}
              {(company?.billingContactName || company?.ownerName || company?.phone || company?.billingContactNo) && (
                <div className="font-bold text-[#1E293B]">
                  Contact. {company?.billingContactName || company?.ownerName || "-"}{" "}
                  {(company?.phone || company?.billingContactNo) &&
                    `| No. ${company?.phone || company?.billingContactNo}`}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-600 sm:text-right shrink-0 space-y-0.5">
            <div>
              Date. <span className="font-semibold text-[#1E293B]">{formatDate(voucher.date)}</span>
            </div>
            <div>
              No. <span className="font-semibold text-[#1E293B]">{voucher.voucherNo}</span>
            </div>
          </div>
        </div>

        {/* Party & Transaction Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-b border-slate-200">
          {/* Left: Payment To */}
          <div className="sm:border-r sm:border-slate-200 sm:pr-5 space-y-1 text-xs text-slate-600">
            <div className="font-bold text-[#1E293B] mb-1.5">
              Payment To.
            </div>
            <div className="font-semibold text-[#1E293B] uppercase">
              {voucher.partyName}
            </div>
            {partyAddress && (
              <div>
                <span className="font-bold text-[#1E293B]">Address.</span> {partyAddress}
              </div>
            )}
            <div>
              <span className="font-bold text-[#1E293B]">GSTN.</span> {voucher.party?.gstin || "-"}
            </div>
            <div>
              <span className="font-bold text-[#1E293B]">Contact.</span> {voucher.party?.phone || "-"}
            </div>
          </div>

          {/* Right: Transaction Details */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-[#1E293B] mb-1.5">Transaction Details:</div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                MODE.
              </span>
              <span className="font-semibold text-[#1E293B]">
                {voucher.transactionType || "-"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                REFERENCE NO.
              </span>
              <span className="font-semibold text-[#1E293B]">
                {voucher.transactionNo || voucher.refNo || "-"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                BANK NAME.
              </span>
              <span className="font-semibold text-[#1E293B] uppercase">
                {voucher.bankName || voucher.bankBookName || "-"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                BENEFICIARY NAME.
              </span>
              <span className="font-semibold text-[#1E293B] uppercase">
                {voucher.beneficiary || voucher.partyName || "-"}
              </span>
            </div>

            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                DATE.
              </span>
              <span className="font-semibold text-[#1E293B] tabular-nums">
                {formatDate(voucher.transactionDate || voucher.date)}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Amount Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-200">
          <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed max-w-md">
            Payment done with a sum of{" "}
            <span className="font-bold text-[#1E293B]">
              Rs. {voucher.amount}
            </span>{" "}
            to{" "}
            <span className="font-bold text-[#1E293B] uppercase">
              {voucher.partyName}
            </span>{" "}
            in favour of {voucher.narration || "purchase payment"}.
          </p>

          <div className="sm:border-l sm:border-slate-200 sm:pl-6 text-right shrink-0">
            <span className="text-base sm:text-lg font-extrabold text-[#1E293B] tabular-nums">
              Rs. {formatINR(voucher.amount)} ₹
            </span>
          </div>
        </div>

        {/* Voucher Breakdown Table */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-[#1E293B] border-y border-slate-200">
                <th className="py-2.5 px-3 font-bold">Sr.</th>
                <th className="py-2.5 px-3 font-bold">Type.</th>
                <th className="py-2.5 px-3 font-bold">Invoice No.</th>
                <th className="py-2.5 px-3 font-bold">Ref No.</th>
                <th className="py-2.5 px-3 font-bold text-right">Invoice Amount.</th>
                <th className="py-2.5 px-3 font-bold text-right">settlement Amount.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-200">
              <tr>
                <td className="py-2.5 px-3 tabular-nums">1</td>
                <td className="py-2.5 px-3">{voucher.entryType} Voucher</td>
                <td className="py-2.5 px-3 tabular-nums">{voucher.voucherNo}</td>
                <td className="py-2.5 px-3">{voucher.refNo || voucher.transactionNo || ""}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {voucher.amount} ₹
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {voucher.amount} ₹
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Signature & Purchase-Invoice-style Footer */}
        <div className="mt-6">
          {/* Signature */}
          <div className="flex justify-end mt-8 mb-4">
            <div className="text-center space-y-1 min-w-[160px]">
              {signatureSrc ? (
                <div className="border-b border-slate-300 pb-1">
                  <img
                    src={signatureSrc}
                    alt="Signature"
                    className="h-10 mx-auto object-contain"
                  />
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
          <div className="border-t border-slate-200 pt-3 text-center text-[10.5px] text-slate-600">
            <div>
              Thank you for your business! For any inquiries, please contact us at{" "}
              {company?.phone || "8200705348"} or {company?.email || "netuorderos@gmail.com"}. Visit our website:
            </div>
            <div>{company?.website || "https://netuorderos.io"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
