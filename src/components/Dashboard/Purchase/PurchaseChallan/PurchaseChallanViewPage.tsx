"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { X, Printer, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { purchaseChallanService } from "./services/purchaseChallan.service";
import type { PurchaseChallan } from "./types/purchaseChallan.types";
import { PurchaseChallanSheet } from "./components/ViewPurchaseChallanModal";
import { printHtmlInIframe } from "@/components/Dashboard/OfflineSales/SalesInvoice/components/InvoiceViewModal";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";
import { downloadDocumentPdf } from "@/lib/downloadDocumentPdf";

export default function PurchaseChallanViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [challan, setChallan] = useState<PurchaseChallan | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [chRes, compRes] = await Promise.allSettled([
          purchaseChallanService.getChallanById(id),
          companyService.getCompanies({ pageSize: 20 }),
        ]);

        if (!active) return;

        if (chRes.status === "fulfilled" && chRes.value?.data) {
          setChallan(chRes.value.data);
        } else {
          toast.error("Failed to load purchase challan details.");
        }

        if (compRes.status === "fulfilled" && compRes.value?.data?.length) {
          const companies = compRes.value.data;
          const challanCompId =
            chRes.status === "fulfilled" ? chRes.value?.data?.companyId : null;
          const preferred =
            (challanCompId ? companies.find((c) => c.id === challanCompId) : null) ||
            companies.find((c) => c.isDefault && c.status === "ACTIVE") ||
            companies.find((c) => c.isDefault) ||
            companies.find((c) => c.status === "ACTIVE") ||
            companies[0];
          setCompany(preferred || null);
        }
      } catch (err: any) {
        if (active) toast.error(err?.message || "Failed to load purchase challan.");
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
      router.push("/purchase/finish-goods/challan");
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
    if (!printAreaRef.current || !challan) return;
    printHtmlInIframe(
      printAreaRef.current.outerHTML,
      `Purchase Challan - ${challan.challanNo || ""}`
    );
  };

  const handleDownloadPdf = () => {
    if (!challan) return;
    const chAny = challan as any;
    downloadDocumentPdf({
      fileName: `purchase-challan-${challan.challanNo || challan.id}.pdf`,
      documentTitle: "Purchase Challan",
      isChallan: true,
      docNo: challan.challanNo || "-",
      docDate: challan.challanDate || challan.createdAt,
      company,
      partySectionTitle: "Supplier.",
      partyName: challan.supplier?.partyName || challan.supplierName || "-",
      partyAddress: challan.supplier?.addressLine1 || "",
      partyGstin: challan.supplier?.gstin || "",
      partyPhone: challan.supplier?.phone || "",
      metaRows: [
        { label: "Party Challan No.", value: challan.partyChallanNo || "-" },
        { label: "Purchase Type.", value: chAny.purchaseType || "-" },
        { label: "Status.", value: chAny.status || "-" },
      ],
      items: (challan.items || []).map((it: any, idx: number) => ({
        srNo: it.itemNo || idx + 1,
        name: it.particular || it.productName || it.sku || "-",
        subText: it.sku || undefined,
        hsn: it.hsn || "-",
        qty: Number(it.quantity || it.qty || 0),
        rate: Number(it.rate || 0),
        total: Number(it.amount || it.total || 0),
      })),
      totals: [
        { label: "Total Quantity", value: Number(chAny.totalQuantity ?? chAny.totalQty ?? 0) },
        { label: "Total Amount", value: Number(challan.totalAmount || 0), bold: true },
      ],
    });
    toast.success("Purchase Challan PDF downloaded.");
  };

  const handleShare = async () => {
    if (!challan) return;
    const url = window.location.href;
    const text = `Purchase Challan #${challan.challanNo} - ${challan.supplier?.partyName || challan.supplierName}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Purchase Challan #${challan.challanNo}`, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Challan link copied to clipboard!");
      }
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#080B11] text-slate-900 overflow-y-auto py-3 sm:py-5 px-3 sm:px-6 print:bg-white print:p-0">
      <div className="sticky top-3 z-50 flex items-center justify-center gap-2 mb-3 md:mb-0 md:fixed md:top-4 md:right-5 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          disabled={!challan}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white border border-[#E7E0D2] dark:border-white/[0.12] hover:bg-[#FEFAEE] dark:hover:bg-[#131B2E] shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={!challan}
          title="Download PDF"
          className="h-8 w-8 rounded-lg bg-white dark:bg-[#0F1626] hover:bg-[#FEFAEE] dark:hover:bg-[#131B2E] text-[#0A0E1A] dark:text-white border border-[#E7E0D2] dark:border-white/[0.12] flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={!challan}
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
            <span>Loading Purchase Challan...</span>
          </div>
        ) : !challan ? (
          <div className="w-full max-w-[794px] min-h-[400px] bg-white rounded-md shadow-2xl flex flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">Purchase Challan not found.</p>
            <button
              type="button"
              onClick={() => router.push("/purchase/finish-goods/challan")}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
            >
              Back to Purchase Challans
            </button>
          </div>
        ) : (
          <div ref={printAreaRef} className="w-full max-w-[794px] shadow-2xl">
            <PurchaseChallanSheet challan={challan} company={company} />
          </div>
        )}
      </div>
    </div>
  );
}
