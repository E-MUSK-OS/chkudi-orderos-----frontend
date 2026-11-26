"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import PurchaseOrderHeader from "./components/PurchaseOrderHeader";
import PurchaseOrderFilters, { ColumnOption } from "./components/PurchaseOrderFilters";
import PurchaseOrderTable from "./components/PurchaseOrderTable";
import CreatePurchaseOrderModal from "./components/CreatePurchaseOrderModal";
import { PurchaseOrder } from "./types/purchaseOrder.types";
import { purchaseOrderService } from "./services/purchaseOrder.service";
import { toast } from "sonner";

export default function PurchaseOrderPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Aggregates & Pagination
  const [total, setTotal] = useState(0);
  const [sumOrderedQty, setSumOrderedQty] = useState(0);
  const [sumReceivedQty, setSumReceivedQty] = useState(0);
  const [sumPendingQty, setSumPendingQty] = useState(0);
  const [sumTotalAmount, setSumTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters State
  const [sku, setSku] = useState("");
  const [lotNo, setLotNo] = useState("");
  const [party, setParty] = useState("");
  const [status, setStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // Column Visibility State
  const [columns, setColumns] = useState<ColumnOption[]>([
    { id: "no", label: "No.", visible: true },
    { id: "orderNo", label: "Order No.", visible: true },
    { id: "lotNoSku", label: "Lot No. & Product SKU", visible: true },
    { id: "date", label: "Date.", visible: true },
    { id: "party", label: "Party.", visible: true },
    { id: "contactNo", label: "Contact No.", visible: true },
    { id: "orderQty", label: "Order Qty.", visible: true },
    { id: "receivedQty", label: "Received Qty.", visible: true },
    { id: "pendingQty", label: "Pending Qty.", visible: true },
    { id: "totalAmount", label: "Total Amount.", visible: true },
    { id: "status", label: "Status.", visible: true },
    { id: "poDays", label: "PO Days.", visible: true },
  ]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await purchaseOrderService.getOrders({
        search,
        sku,
        lotNo,
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
      console.error(err);
      toast.error(err.message || "Failed to load purchase orders.");
    } finally {
      setLoading(false);
    }
  }, [search, sku, lotNo, party, status, startDate, endDate, page, limit]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 200);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleClearFilters = () => {
    setSku("");
    setLotNo("");
    setParty("");
    setStatus("All");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setPage(1);
    toast.success("Filters reset successfully.");
  };

  const handleToggleColumn = (id: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, visible: !col.visible } : col))
    );
  };

  const handleDownload = async () => {
    try {
      toast.info("Generating Purchase Orders Excel...");
      await purchaseOrderService.downloadOrdersExcel({
        search,
        sku,
        lotNo,
        party,
        status,
        startDate,
        endDate,
      });
      toast.success("Purchase Orders Excel downloaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to download Excel.");
    }
  };

  const handleCreateOrder = () => {
    setOrderToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setOrderToEdit(order);
    setIsModalOpen(true);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) return;
    try {
      await purchaseOrderService.deleteOrder(id);
      toast.success("Purchase order deleted successfully.");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete purchase order.");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <DashboardLayout title="Order [ Purchase Product ]">
      <div className="flex flex-col gap-4 sm:gap-5 max-w-[1700px] mx-auto font-sans pb-10">
        {/* 1. Top Header */}
        <PurchaseOrderHeader
          onDownload={handleDownload}
        />

      {/* 2. Filters Bar matching Image 2 */}
      <PurchaseOrderFilters
        sku={sku}
        onSkuChange={(val) => {
          setSku(val);
          setPage(1);
        }}
        lotNo={lotNo}
        onLotNoChange={(val) => {
          setLotNo(val);
          setPage(1);
        }}
        party={party}
        onPartyChange={(val) => {
          setParty(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(val) => {
          setStartDate(val);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(val) => {
          setEndDate(val);
          setPage(1);
        }}
        onDateRangeChange={(start, end) => {
          setStartDate(start);
          setEndDate(end);
          setPage(1);
        }}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onClearFilters={handleClearFilters}
        onRefresh={fetchOrders}
        columns={columns}
        onToggleColumn={handleToggleColumn}
      />

      {/* 3. Orders Table matching Image 2 */}
      <PurchaseOrderTable
        orders={orders}
        loading={loading}
        columns={columns}
        sumOrderedQty={sumOrderedQty}
        sumReceivedQty={sumReceivedQty}
        sumPendingQty={sumPendingQty}
        sumTotalAmount={sumTotalAmount}
        onEdit={handleEditOrder}
        onDelete={handleDeleteOrder}
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />

      {/* 4. Create / Edit Modal */}
      <CreatePurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderToEdit={orderToEdit}
        onSuccess={fetchOrders}
      />
    </div>
  </DashboardLayout>
  );
}
