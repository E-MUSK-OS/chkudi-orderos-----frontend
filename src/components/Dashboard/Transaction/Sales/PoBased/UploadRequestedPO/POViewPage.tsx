"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import POItemsTable from "./components/POItemsTable";
import DeletePOModal from "./components/DeletePOModal";
import { requestedPoService } from "./services/requestedPo.service";
import { RequestedPO, RequestedPOItem } from "./types/requestedPo.types";
import {
  ArrowLeft,
  FileSpreadsheet,
  Trash2,
  Building2,
  Calendar,
  Boxes,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface POViewPageProps {
  id?: string;
}

export default function POViewPage({ id: propId }: POViewPageProps) {
  const router = useRouter();
  const params = useParams();
  const rawId = propId || (params?.id as string);
  const poId = rawId ? decodeURIComponent(rawId) : "";

  const [po, setPo] = useState<RequestedPO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Fetch PO details directly from the database via API
  useEffect(() => {
    let ignore = false;
    async function fetchPo() {
      if (!poId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await requestedPoService.getById(poId);
        if (!ignore) {
          setPo(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error("Failed to load PO details from database:", err);
          setPo(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchPo();
    return () => {
      ignore = true;
    };
  }, [poId]);

  // Handle scanned items change and persist to database
  const handleItemsChange = async (newItems: RequestedPOItem[]) => {
    if (!po) return;
    const updatedPo: RequestedPO = {
      ...po,
      items: newItems,
    };
    setPo(updatedPo);
    try {
      await requestedPoService.save(updatedPo);
    } catch (err: unknown) {
      console.error("Failed to persist updated items to database:", err);
      toast.error("Failed to auto-save scanned items to database.");
    }
  };

  // When clicking Back, pass storeId in URL so upload page restores the previously open store & table
  const handleBack = () => {
    if (po?.storeId) {
      router.push(
        `/dashboard/transaction/sales/po-based/upload-requested-po?storeId=${encodeURIComponent(po.storeId)}`
      );
    } else {
      router.push("/dashboard/transaction/sales/po-based/upload-requested-po");
    }
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!po) return;
    const targetStoreId = po.storeId;
    const poLabel = po.poNumber || po.fileName;
    try {
      await requestedPoService.delete(po.id);
      toast.success(`PO #${poLabel} deleted.`);
      setDeleteModalOpen(false);
      if (targetStoreId) {
        router.push(
          `/dashboard/transaction/sales/po-based/upload-requested-po?storeId=${encodeURIComponent(targetStoreId)}`
        );
      } else {
        router.push("/dashboard/transaction/sales/po-based/upload-requested-po");
      }
    } catch (err: unknown) {
      console.error("Failed to delete purchase order:", err);
      toast.error("Failed to delete purchase order.");
    }
  };

  const totalScanned = useMemo(() => {
    if (!po?.items) return 0;
    return po.items.reduce((acc, it) => acc + (it.scannedQuantity || 0), 0);
  }, [po]);

  const totalInitialUnits = useMemo(() => {
    if (!po?.items) return po?.totalQuantity || 0;
    return po.items.reduce(
      (acc, it) => acc + (it.initialQuantity ?? it.quantity ?? 0),
      0
    );
  }, [po]);

  if (loading) {
    return (
      <DashboardLayout title="PO Details | OrderOS">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500 dark:text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-[#B88728] dark:text-[#E8C16D] mb-3" />
          <p className="text-sm font-semibold">Loading PO details from database...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!po) {
    return (
      <DashboardLayout title="PO Details | OrderOS">
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white border border-[#E7E0D2] shadow-sm dark:bg-[#0F1626] rounded-2xl sm:rounded-3xl dark:border-white/[0.08] text-center max-w-[600px] mx-auto my-12">
          <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            Purchase Order Not Found
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
            The requested purchase order could not be found or may have been deleted.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8C16D]/60 dark:border-transparent bg-[#FEFAEE] text-[#6A4D1D] hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] ring-1 ring-[#E8C16D]/20 dark:ring-0 dark:bg-[#F5C451] dark:text-slate-900 font-bold text-xs transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <ArrowLeft size={16} />
            <span>Back to Upload Requested PO</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const backUrl = po.storeId
    ? `/dashboard/transaction/sales/po-based/upload-requested-po?storeId=${encodeURIComponent(po.storeId)}`
    : "/dashboard/transaction/sales/po-based/upload-requested-po";

  return (
    <DashboardLayout title={`PO #${po.poNumber || "Details"} | OrderOS`}>
      <div className="space-y-4 sm:space-y-6">
        {/* Top Rounded Header Card matching OrderOS theme and cards below */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="p-2 sm:p-2.5 rounded-xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 hover:bg-[#FFF3D6] dark:bg-[#1A160E] dark:text-[#E8C16D] dark:hover:bg-[#252014] transition-all cursor-pointer shadow-2xs shrink-0"
                title="Back to Upload Requested PO"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40 shrink-0 shadow-2xs">
                  <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]" />
                </div>
                <div>
                  <h1 className="text-[26px] font-bold tracking-tight text-[#0A0E1A] dark:text-white">
                    Purchase Order #{po.poNumber}
                  </h1>

                  {/* Breadcrumbs */}
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium select-none">
                    <Link
                      href="/dashboard"
                      className="hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-colors"
                    >
                      Transaction
                    </Link>
                    <span>/</span>
                    <span className="hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-colors">
                      Sales
                    </span>
                    <span>/</span>
                    <span className="hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-colors">
                      PO Based
                    </span>
                    <span>/</span>
                    <Link
                      href={backUrl}
                      className="hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-colors"
                    >
                      Upload Requested PO
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-[#008ECC] dark:text-[#38BDF8]">
                      PO #{po.poNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Action Buttons (Back & Delete PO) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#FFF9EC] text-slate-700 hover:text-[#B88728] border border-[#E7E0D2] hover:border-[#E8C16D] shadow-2xs dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-200 dark:border-white/[0.1] transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 shadow-2xs dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:hover:text-rose-300 dark:border-rose-500/20 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete PO</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Card with Key Metadata Pills */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Store & PO Info */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {po.storeName && (
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-[#B88728] dark:bg-[#F5C451]/10 dark:text-[#F5C451]">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Webstore
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      {po.storeName}
                    </p>
                  </div>
                </div>
              )}

              {po.poDate && (
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      PO Date
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      {po.poDate}
                    </p>
                  </div>
                </div>
              )}

              {po.fileName && (
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      File Source
                    </p>
                    <p
                      className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]"
                      title={po.fileName}
                    >
                      {po.fileName}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Status & Totals Pills */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {po.status || "Uploaded"}
              </span>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D]">
                <Boxes className="h-3.5 w-3.5" />
                <span>{totalInitialUnits} Units</span>
              </div>

              {totalScanned > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>
                    Scanned: {totalScanned} / {totalInitialUnits}
                  </span>
                </div>
              )}

              {po.totalAmount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <span>
                    ₹{po.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table with Barcode ASIN Scanner */}
        <POItemsTable
          items={po.items || []}
          poNumber={po.poNumber}
          columns={po.columns}
          onClose={handleBack}
          onDeletePo={handleDelete}
          onItemsChange={handleItemsChange}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeletePOModal
        open={deleteModalOpen}
        poNumber={po.poNumber}
        itemsCount={po.itemsCount}
        totalQuantity={totalInitialUnits}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  );
}
