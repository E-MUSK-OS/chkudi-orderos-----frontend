"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import MaterialOrderFilters, { MaterialOrderColumnOption } from "./components/MaterialOrderFilters";
import MaterialOrderTable from "./components/MaterialOrderTable";
import { MaterialPurchaseOrder } from "./types/materialOrder.types";
import { materialOrderService } from "./services/materialOrder.service";

export default function MaterialOrderPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<MaterialPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & aggregates
  const [total, setTotal] = useState(0);
  const [sumOrderedQty, setSumOrderedQty] = useState(0);
  const [sumReceivedQty, setSumReceivedQty] = useState(0);
  const [sumPendingQty, setSumPendingQty] = useState(0);
  const [sumTotalAmount, setSumTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showSumRow, setShowSumRow] = useState(true);

  // Filters
  const [party, setParty] = useState("");
  const [status, setStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [columns, setColumns] = useState<MaterialOrderColumnOption[]>([
    { id: "no", label: "No.", visible: true },
    { id: "date", label: "Date.", visible: true },
    { id: "orderNo", label: "Order No.", visible: true },
    { id: "party", label: "Party.", visible: true },
    { id: "contactNo", label: "Contact No.", visible: true },
    { id: "orderQty", label: "Order Qty.", visible: true },
    { id: "receivedQty", label: "Received Qty.", visible: true },
    { id: "pendingQty", label: "Pending Qty.", visible: true },
    { id: "totalAmount", label: "Total Amount.", visible: true },
    { id: "status", label: "Status.", visible: true },
    { id: "poDays", label: "PO Days.", visible: true },
  ]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await materialOrderService.getOrders({
        search,
        party,
        status,
        startDate,
        endDate,
        page,
        limit,
      });
      if (res?.data) {
        setOrders(res.data.orders || []);
        setTotal(res.data.total || 0);
        setSumOrderedQty(res.data.sumOrderedQty || 0);
        setSumReceivedQty(res.data.sumReceivedQty || 0);
        setSumPendingQty(res.data.sumPendingQty || 0);
        setSumTotalAmount(res.data.sumTotalAmount || 0);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load material orders");
    } finally {
      setLoading(false);
    }
  }, [search, party, status, startDate, endDate, page, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleToggleColumn = (colId: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleClearFilters = () => {
    setParty("");
    setStatus("All");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
  };

  const handleDelete = async (ord: MaterialPurchaseOrder) => {
    if (!window.confirm(`Delete Material Order ${ord.orderNo}?`)) return;
    try {
      await materialOrderService.deleteOrder(ord.id);
      toast.success("Material Purchase Order deleted.");
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete order");
    }
  };

  const handleDownload = async () => {
    try {
      await materialOrderService.exportExcel({
        search,
        party,
        status,
        startDate,
        endDate,
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to export Excel");
    }
  };

  return (
    <DashboardLayout title="Order [ Purchase Material & Service ]">
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
                Order{" "}
                <span className="inline-block whitespace-nowrap">
                  [ Purchase Material &amp; Service ]
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage purchase materials orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap md:ml-auto">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/purchase/material/order/new")}
              className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <MaterialOrderFilters
        party={party}
        onPartyChange={(v) => {
          setParty(v);
          setPage(1);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
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
      <MaterialOrderTable
        orders={orders}
        loading={loading}
        columns={columns}
        showSumRow={showSumRow}
        page={page}
        limit={limit}
        total={total}
        sumOrderedQty={sumOrderedQty}
        sumReceivedQty={sumReceivedQty}
        sumPendingQty={sumPendingQty}
        sumTotalAmount={sumTotalAmount}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        onEdit={(ord) => {
          router.push(`/dashboard/purchase/material/order/${ord.id}/edit`);
        }}
        onDelete={handleDelete}
      />
      </div>
    </DashboardLayout>
  );
}
