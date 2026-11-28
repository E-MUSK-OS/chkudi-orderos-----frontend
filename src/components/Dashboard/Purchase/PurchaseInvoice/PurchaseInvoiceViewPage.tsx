"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { X, Printer, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { purchaseInvoiceService } from "./services/purchaseInvoice.service";
import type { PurchaseInvoice } from "./types/purchaseInvoice.types";
import { PurchaseInvoiceSheet } from "./components/PurchaseInvoiceViewSheet";
import { printHtmlInIframe } from "@/components/Dashboard/OfflineSales/SalesInvoice/components/InvoiceViewModal";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";
import { downloadDocumentPdf } from "@/lib/downloadDocumentPdf";

type CopyType = "Original for Recipient" | "Duplicate for Transporter" | "Triplicate for Supplier";

export default function PurchaseInvoiceViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<CopyType>("Original for Recipient");
  const [loading, setLoading] = useState(true);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [invRes, compRes] = await Promise.allSettled([
          purchaseInvoiceService.getInvoiceById(id),
          companyService.getCompanies({ pageSize: 20 }),
        ]);

        if (!active) return;

        if (invRes.status === "fulfilled" && invRes.value) {
          setInvoice(invRes.value);
        } else {
          toast.error("Failed to load purchase invoice details.");
        }

        if (compRes.status === "fulfilled" && compRes.value?.data?.length) {
          const companies = compRes.value.data;
          const invCompId =
            invRes.status === "fulfilled" ? invRes.value?.companyId : null;
          const preferred =
            (invCompId ? companies.find((c) => c.id === invCompId) : null) ||
            companies.find((c) => c.isDefault && c.status === "ACTIVE") ||
            companies.find((c) => c.isDefault) ||
            companies.find((c) => c.status === "ACTIVE") ||
            companies[0];
          setCompany(preferred || null);
        }
      } catch (err: any) {
        if (active) toast.error(err?.message || "Failed to load purchase invoice.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/purchase/finish-goods/invoice");
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handlePrint = () => {
    if (!printAreaRef.current || !invoice) return;
    printHtmlInIframe(
      printAreaRef.current.outerHTML,
      `Purchase Invoice - ${invoice.invoiceNo || ""}`
    );
  };

  const handleDownloadPdf = () => {
    if (!invoice) return;
    const invAny = invoice as any;
    downloadDocumentPdf({
      fileName: `purchase-invoice-${invoice.invoiceNo || invoice.id}.pdf`,
      documentTitle: invoice.invoiceType || "Purchase Invoice",
      copyLabel: selectedCopy,
      docNo: invoice.invoiceNo || "-",
      docDate: invoice.invoiceDate || invoice.createdAt,
      company,
      partySectionTitle: "Supplier / Billing To.",
      partyName: invoice.billingPartyName || "-",
      partyAddress: invoice.billingAddress || "",
      partyGstin: invoice.partyGstn || "",
      partyPhone: invAny.contactNo || invAny.party?.phone || "",
      metaRows: [
        { label: "Challan No.", value: invoice.challanNo || "-" },
        { label: "Voucher Type.", value: invAny.voucherType || "-" },
        { label: "Payment Status.", value: invAny.paymentStatus || "-" },
      ],
      items: (invoice.items || []).map((it, idx) => ({
        srNo: it.itemNo || idx + 1,
        name: it.particular || it.sku || "-",
        subText: it.sku || undefined,
        hsn: it.hsn || "-",
        qty: Number(it.quantity || 0),
        rate: Number(it.rate || 0),
        discount: Number(it.discountAmount || 0),
        taxable: Number(it.taxableAmount || 0),
        sgst: Number(it.sgstAmount || 0),
        cgst: Number(it.cgstAmount || 0),
        igst: Number(it.igstAmount || 0),
        total: Number(it.total || 0),
      })),
      totals: [
        { label: "Gross Amount", value: Number(invoice.totalAmount || 0) },
        { label: "Discount Amount", value: Number(invoice.totalDiscount || 0) },
        { label: "Before Tax Amount", value: Number(invoice.amountBeforeTax || 0) },
        { label: "SGST", value: Number(invoice.sgstAmount || 0) },
        { label: "CGST", value: Number(invoice.cgstAmount || 0) },
        { label: "IGST", value: Number(invoice.igstAmount || 0) },
        { label: "Other Expense", value: Number(invoice.expenseOnPurchase || 0) },
        { label: "Net Amount", value: Number(invoice.netAmount || 0), bold: true },
      ],
    });
    toast.success("Purchase Invoice PDF downloaded.");
  };

  const handleShare = async () => {
    if (!invoice) return;
    const url = window.location.href;
    const text = `Purchase Invoice #${invoice.invoiceNo} - ${invoice.billingPartyName}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Purchase Invoice #${invoice.invoiceNo}`, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Invoice link copied to clipboard!");
      }
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#080B11] text-slate-900 overflow-y-auto py-3 sm:py-5 px-3 sm:px-6 print:bg-white print:p-0">
      <div className="sticky top-3 z-50 flex items-center justify-center gap-2 mb-3 md:mb-0 md:fixed md:top-4 md:right-5 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          disabled={!invoice}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white border border-[#E7E0D2] dark:border-white/[0.12] hover:bg-[#FEFAEE] dark:hover:bg-[#131B2E] shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={!invoice}
          title="Download PDF"
          className="h-8 w-8 rounded-lg bg-white dark:bg-[#0F1626] hover:bg-[#FEFAEE] dark:hover:bg-[#131B2E] text-[#0A0E1A] dark:text-white border border-[#E7E0D2] dark:border-white/[0.12] flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={!invoice}
          title="Share"
          className="h-8 w-8 rounded-lg bg-white dark:bg-[#0F1626] hover:bg-[#FEFAEE] dark:hover:bg-[#131B2E] text-[#0A0E1A] dark:text-white border border-[#E7E0D2] dark:border-white/[0.12] flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleClose}
          title="Close"
          className="h-8 w-8 rounded-full bg-white dark:bg-[#0F1626] hover:bg-[#FEFAEE] dark:hover:bg-[#131B2E] text-[#0A0E1A] dark:text-white border border-[#E7E0D2] dark:border-white/[0.12] flex items-center justify-center shadow-md transition-all cursor-pointer ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-center items-start">
        {loading ? (
          <div className="w-full max-w-[794px] min-h-[360px] bg-white rounded-md shadow-2xl flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading Purchase Invoice...</span>
          </div>
        ) : !invoice ? (
          <div className="w-full max-w-[794px] min-h-[400px] bg-white rounded-md shadow-2xl flex flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">Purchase Invoice not found.</p>
            <button
              type="button"
              onClick={() => router.push("/purchase/finish-goods/invoice")}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
            >
              Back to Purchase Invoices
            </button>
          </div>
        ) : (
          <div ref={printAreaRef} className="w-full max-w-[794px] shadow-2xl">
            <PurchaseInvoiceSheet
              inv={invoice}
              company={company}
              selectedCopy={selectedCopy}
              onSelectCopy={setSelectedCopy}
            />
          </div>
        )}
      </div>
    </div>
  );
}
