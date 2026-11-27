"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { materialOrderService } from "../Order/services/materialOrder.service";
import MaterialChallanFilters, {
  MaterialChallanColumnOption,
} from "./components/MaterialChallanFilters";
import MaterialChallanTable from "./components/MaterialChallanTable";
import MaterialChallanViewModal from "./components/MaterialChallanViewModal";
import { MaterialPurchaseChallan } from "./types/materialChallan.types";
import { materialChallanService } from "./services/materialChallan.service";

export default function MaterialChallanPage() {
  const router = useRouter();
  const [challans, setChallans] = useState<MaterialPurchaseChallan[]>([]);
  const [loading, setLoading] = useState(true);

  const [total, setTotal] = useState(0);
  const [sumTotalQty, setSumTotalQty] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showSumRow, setShowSumRow] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingChallan, setViewingChallan] = useState<MaterialPurchaseChallan | null>(null);

  const [party, setParty] = useState("");
  const [partyChallanNo, setPartyChallanNo] = useState("");
  const [challanFor, setChallanFor] = useState("");
  const [material, setMaterial] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [materialOptions, setMaterialOptions] = useState<ThemeSelectOption[]>([]);

  const [columns, setColumns] = useState<MaterialChallanColumnOption[]>([
    { id: "no", label: "No.", visible: true },
    { id: "checkbox", label: "Checkbox", visible: true },
    { id: "challanNo", label: "Challan No.", visible: true },
    { id: "date", label: "Date", visible: true },
    { id: "party", label: "Party", visible: true },
    { id: "contactNo", label: "Contact No", visible: true },
    { id: "partyChallanNo", label: "Party Challan No.", visible: true },
    { id: "totalQty", label: "Total Qty", visible: true },
    { id: "challanFor", label: "Challan For", visible: true },
    { id: "preparedBy", label: "Prepared By", visible: true },
    { id: "status", label: "Status", visible: true },
  ]);

  useEffect(() => {
    materialOrderService
      .getMaterials()
      .then((list) => {
        const opts: ThemeSelectOption[] = list.map((m) => ({
          value: m.sku || m.masterSku || m.materialName,
          label: m.materialName || m.sku || m.masterSku,
        }));
        setMaterialOptions(opts);
      })
      .catch(() => {});
  }, []);

  const fetchChallans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await materialChallanService.getChallans({
        search,
        party,
        partyChallanNo,
        challanFor,
        material,
        invoiceStatus,
        startDate,
        endDate,
        page,
        limit,
      });
      if (res?.data) {
        setChallans(res.data.challans || []);
        setTotal(res.data.total || 0);
        setSumTotalQty(res.data.sumTotalQty || 0);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load material challans");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    party,
    partyChallanNo,
    challanFor,
    material,
    invoiceStatus,
    startDate,
    endDate,
    page,
    limit,
  ]);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  const handleToggleColumn = (colId: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleClearFilters = () => {
    setParty("");
    setPartyChallanNo("");
    setChallanFor("");
    setMaterial("");
    setInvoiceStatus("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
  };

  const handleDelete = async (ch: MaterialPurchaseChallan) => {
    if (!window.confirm(`Delete Material Challan ${ch.challanNo}?`)) return;
    try {
      await materialChallanService.deleteChallan(ch.id);
      setSelectedIds((prev) => prev.filter((id) => id !== ch.id));
      toast.success("Material Purchase Challan deleted.");
      fetchChallans();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete challan");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.length} selected Material Challan(s)?`
      )
    ) {
      return;
    }
    try {
      await Promise.all(
        selectedIds.map((id) => materialChallanService.deleteChallan(id))
      );
      toast.success(
        `Deleted ${selectedIds.length} Material Purchase Challan(s).`
      );
      setSelectedIds([]);
      fetchChallans();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete selected challans");
    }
  };

  const handleDownload = async () => {
    try {
      await materialChallanService.exportExcel({
        ids: selectedIds.length > 0 ? selectedIds : undefined,
        search,
        party,
        partyChallanNo,
        challanFor,
        material,
        invoiceStatus,
        startDate,
        endDate,
      });
      if (selectedIds.length > 0) {
        toast.success(
          `Downloaded ${selectedIds.length} Selected Challan(s) Excel`
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to export Excel");
    }
  };

  const memoizedMaterialOptions = useMemo(() => materialOptions, [materialOptions]);

  return (
    <DashboardLayout title="Challan [ Purchase Material & Service ]">
      <div className="w-full space-y-4">
        {/* Header Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base xl:text-xl font-bold text-[#0A0E1A] dark:text-white leading-snug">
                  Challan{" "}
                  <span className="inline-block whitespace-nowrap">
                    [ Purchase Material &amp; Service ]
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Manage purchase materials challans
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 whitespace-nowrap md:ml-auto">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2 h-9 sm:h-10 px-3.5 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedIds.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
                <span>
                  {selectedIds.length > 0
                    ? `Download (${selectedIds.length})`
                    : "Download"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard/purchase/material/challan/new")}
                className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Challan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <MaterialChallanFilters
          party={party}
          onPartyChange={(v) => {
            setParty(v);
            setPage(1);
          }}
          partyChallanNo={partyChallanNo}
          onPartyChallanNoChange={(v) => {
            setPartyChallanNo(v);
            setPage(1);
          }}
          challanFor={challanFor}
          onChallanForChange={(v) => {
            setChallanFor(v);
            setPage(1);
          }}
          material={material}
          onMaterialChange={(v) => {
            setMaterial(v);
            setPage(1);
          }}
          materialOptions={memoizedMaterialOptions}
          invoiceStatus={invoiceStatus}
          onInvoiceStatusChange={(v) => {
            setInvoiceStatus(v);
            setPage(1);
          }}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setPage(1);
          }}
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          columns={columns}
          onToggleColumn={handleToggleColumn}
          onClearFilters={handleClearFilters}
          onToggleAggregations={() => setShowSumRow((p) => !p)}
        />

        {/* Table */}
        <MaterialChallanTable
          challans={challans}
          loading={loading}
          columns={columns}
          showSumRow={showSumRow}
          page={page}
          limit={limit}
          total={total}
          sumTotalQty={sumTotalQty}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          onView={(ch) => {
            router.push(`/dashboard/purchase/material/challan/view/${ch.id}`);
          }}
          onEdit={(ch) => {
            router.push(`/dashboard/purchase/material/challan/${ch.id}/edit`);
          }}
          onDelete={handleDelete}
        />

        <MaterialChallanViewModal
          open={Boolean(viewingChallan)}
          challan={viewingChallan}
          onClose={() => setViewingChallan(null)}
        />
      </div>
    </DashboardLayout>
  );
}
