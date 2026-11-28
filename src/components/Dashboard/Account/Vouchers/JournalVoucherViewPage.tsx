"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Printer, Download, Share2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { journalVoucherService } from "./services/journalVoucher.service";
import { printHtmlInIframe } from "@/components/Dashboard/OfflineSales/SalesInvoice/components/InvoiceViewModal";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";
import type { JournalVoucher } from "./types/journalVoucher.types";
import { getMediaUrl } from "@/lib/utils";

interface JournalVoucherViewPageProps {
  voucherId: string;
}

const LIST_ROUTE = "/dashboard/account/vouchers/journal-vouchers";

function formatDate(dateVal?: string | null): string {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function formatINR(amount: number): string {
  return Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function JournalVoucherViewPage({ voucherId }: JournalVoucherViewPageProps) {
  const router = useRouter();
  const sheetRef = useRef<HTMLDivElement>(null);

  const [voucher, setVoucher] = useState<JournalVoucher | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [v, companiesRes] = await Promise.all([
          journalVoucherService.getById(voucherId),
          companyService.getCompanies().catch(() => ({ data: [] })),
        ]);
        if (!active) return;
        setVoucher(v);
        const list: Company[] = Array.isArray((companiesRes as any)?.data)
          ? (companiesRes as any).data
          : Array.isArray(companiesRes)
          ? (companiesRes as unknown as Company[])
          : [];
        setCompany(list.find((c) => c.isDefault) || list[0] || null);
      } catch (err: any) {
        if (!active) return;
        toast.error(err?.response?.data?.message || "Failed to load journal voucher.");
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
      `Journal Voucher - ${voucher.voucherNo}`
    );
  };

  const handleDownloadPdf = () => {
    if (!voucher) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 18;
    const compName = (company?.companyName || "COMPANY NAME").toUpperCase();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("JOURNAL VOUCHER", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(11);
    doc.text(compName, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Date. ${formatDate(voucher.date)}`, pageW - margin, y, { align: "right" });
    doc.text(`No. ${voucher.voucherNo}`, pageW - margin, y + 4.5, { align: "right" });
    y += 12;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Sr.", "Credit Account", "Debit Account", "Ref No.", "Narration", "Amount"]],
      body: [
        [
          "1",
          voucher.creditAccountName,
          voucher.debitAccountName,
          voucher.refNo || "-",
          voucher.narration || "-",
          `${voucher.amount}`,
        ],
      ],
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold" },
      columnStyles: { 5: { halign: "right" } },
    });

    const sigY = ((doc as any).lastAutoTable?.finalY || y + 20) + 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(`For ${compName}`, pageW - margin - 20, sigY, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("AUTHORIZED SIGNATORY", pageW - margin - 20, sigY + 4, { align: "center" });

    const footerY = sigY + 12;
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

    doc.save(`journal-voucher-${voucher.voucherNo}.pdf`);
    toast.success("Journal Voucher PDF downloaded.");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Journal Voucher #${voucher?.voucherNo}`, url });
        return;
      } catch {
        // fallback
      }
    }
    await navigator.clipboard?.writeText(url);
    toast.success("Voucher link copied to clipboard.");
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

  const companyName = company?.companyName || "COMPANY NAME";
  const companyAddressLines = [
    company?.billingAddress1 || company?.addressLine1,
    company?.billingAddress2 || company?.addressLine2,
    [company?.billingCity || company?.city, company?.billingState || company?.state, company?.billingPincode || company?.pincode]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
  const logoSrc = company?.logoUrl ? getMediaUrl(company.logoUrl) : "";
  const signatureSrc = company?.signatureUrl ? getMediaUrl(company.signatureUrl) : "";

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#080B11] text-slate-900 overflow-y-auto py-3 sm:py-5 px-3 sm:px-6 print:bg-white print:p-0">
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

      <div
        ref={sheetRef}
        className="max-w-[820px] mx-auto bg-white text-[#1E293B] rounded-xl shadow-2xl p-4 sm:p-6 print:shadow-none print:rounded-none print:max-w-full"
      >
        <h1 className="text-center text-base sm:text-lg font-extrabold tracking-wide text-[#1E293B] mb-3">
          JOURNAL VOUCHER
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
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
                <div className="font-bold text-[#1E293B] pt-0.5">GSTN. {company.gstNumber}</div>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-600 sm:text-right shrink-0 space-y-0.5">
            <div>
              Date. <span className="font-semibold text-[#1E293B]">{formatDate(voucher.date)}</span>
            </div>
            <div>
              J.V. No. <span className="font-semibold text-[#1E293B]">{voucher.voucherNo}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto my-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-[#1E293B] border-y border-slate-200">
                <th className="py-2.5 px-3 font-bold">Sr.</th>
                <th className="py-2.5 px-3 font-bold">Credit Account Name</th>
                <th className="py-2.5 px-3 font-bold">Debit Account Name</th>
                <th className="py-2.5 px-3 font-bold">Ref No.</th>
                <th className="py-2.5 px-3 font-bold">Narration</th>
                <th className="py-2.5 px-3 font-bold text-right">Amount.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b border-slate-200">
              <tr>
                <td className="py-2.5 px-3 tabular-nums">1</td>
                <td className="py-2.5 px-3 font-semibold">{voucher.creditAccountName}</td>
                <td className="py-2.5 px-3 font-semibold">{voucher.debitAccountName}</td>
                <td className="py-2.5 px-3">{voucher.refNo || "-"}</td>
                <td className="py-2.5 px-3">{voucher.narration || "-"}</td>
                <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                  Rs. {formatINR(voucher.amount)} ₹
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <div className="flex justify-end mt-8 mb-4">
            <div className="text-center space-y-1 min-w-[160px]">
              {signatureSrc ? (
                <div className="border-b border-slate-300 pb-1">
                  <img src={signatureSrc} alt="Signature" className="h-10 mx-auto object-contain" />
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
