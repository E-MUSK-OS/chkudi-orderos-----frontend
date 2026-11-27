"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { X, Printer, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { challanService } from "./services/challan.service";
import type { SalesChallan } from "./types/challan.types";
import { DeliveryChallanSheet } from "./components/ViewSalesChallanModal";
import { printHtmlInIframe } from "../SalesInvoice/components/InvoiceViewModal";
import { companyService } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/services/company.service";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";

export default function SalesChallanViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [challan, setChallan] = useState<SalesChallan | null>(null);
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
          challanService.getChallanById(id),
          companyService.getCompanies({ pageSize: 20 }),
        ]);

        if (!active) return;

        if (chRes.status === "fulfilled" && chRes.value?.data) {
          setChallan(chRes.value.data);
        } else {
          toast.error("Failed to load sales challan details.");
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
        if (active) toast.error(err?.message || "Failed to load sales challan.");
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
      router.push("/sales/sales-challan");
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
      `Delivery Challan - ${challan.challanNo || ""}`
    );
  };

  const handleShare = async () => {
    if (!challan) return;
    const url = window.location.href;
    const text = `Delivery Challan #${challan.challanNo} - ${challan.party?.partyName || challan.partyName}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Delivery Challan #${challan.challanNo}`, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Challan link copied to clipboard!");
      }
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#232529] text-slate-900 overflow-y-auto">
      <div className="fixed top-4 right-5 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          disabled={!challan}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          disabled={!challan}
          title="Download PDF"
          className="h-8 w-8 rounded-lg bg-[#3A3D42] hover:bg-[#4A4E54] text-white flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={!challan}
          title="Share"
          className="h-8 w-8 rounded-lg bg-[#3A3D42] hover:bg-[#4A4E54] text-white flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleClose}
          title="Close"
          className="h-8 w-8 rounded-full bg-[#3A3D42] hover:bg-[#4A4E54] text-white flex items-center justify-center shadow-md transition-all cursor-pointer ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="min-h-screen py-4 sm:py-6 px-3 sm:px-6 flex justify-center items-start">
        {loading ? (
          <div className="w-full max-w-[794px] min-h-[1080px] bg-white rounded-md shadow-2xl flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading Delivery Challan...</span>
          </div>
        ) : !challan ? (
          <div className="w-full max-w-[794px] min-h-[400px] bg-white rounded-md shadow-2xl flex flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">Sales Challan not found.</p>
            <button
              type="button"
              onClick={() => router.push("/sales/sales-challan")}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
            >
              Back to Sales Challans
            </button>
          </div>
        ) : (
          <div ref={printAreaRef} className="w-full max-w-[794px] shadow-2xl">
            <DeliveryChallanSheet challan={challan} company={company} />
          </div>
        )}
      </div>
    </div>
  );
}
