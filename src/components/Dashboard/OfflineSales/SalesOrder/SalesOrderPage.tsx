"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import SalesOrderListHeader from "./components/SalesOrderListHeader";
import SalesOrderFilters from "./components/SalesOrderFilters";
import SalesOrderTable from "./components/SalesOrderTable";
import DeleteSalesOrderModal from "./components/DeleteSalesOrderModal";
import { SalesOrder, SalesOrderFilterState } from "./types/salesOrder.types";
import { salesOrderService } from "./services/salesOrder.service";

export default function SalesOrderPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState<SalesOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState<SalesOrderFilterState>({
    search: "",
    party: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    date: true,
    orderNo: true,
    party: true,
    contactNo: true,
    poNo: true,
    orderQty: true,
    deliveredQty: true,
    pendingQty: true,
    totalAmount: true,
    deliveryStatus: true,
    expDeliveryDate: true,
    fulfillmentPlan: true,
    actions: true,
  });

  const [sortField, setSortField] = useState<keyof SalesOrder>("orderDate");
  const [sortAsc, setSortAsc] = useState(false);
  const [showAggregations, setShowAggregations] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await salesOrderService.getOrders(filters);
      setOrders(res.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load Sales Orders");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFilterChange = (key: keyof SalesOrderFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      party: "",
      status: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    try {
      setDeleting(true);
      await salesOrderService.deleteOrder(deletingTarget.id);
      toast.success(`Sales Order ${deletingTarget.orderNo} deleted!`);
      setDeleteModalOpen(false);
      setDeletingTarget(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete Sales Order");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      await salesOrderService.exportExcel(filters);
      toast.success("Sales Orders exported to Excel");
    } catch (err: any) {
      toast.error(err.message || "Failed to export");
    }
  };

  return (
    <DashboardLayout title="Sales Order">
      <div className="space-y-4">
        <SalesOrderListHeader
          onCreate={() => router.push("/dashboard/offline-sales/sales-order/new")}
          onDownload={handleDownload}
        />

        <SalesOrderFilters
          filters={filters}
          onChange={handleFilterChange}
          onDateRangeChange={(s, e) =>
            setFilters((prev) => ({ ...prev, startDate: s, endDate: e }))
          }
          onSearch={fetchOrders}
          onReset={handleResetFilters}
          visibleColumns={visibleColumns}
          onToggleColumn={(key) =>
            setVisibleColumns((prev) => ({ ...prev, [key]: prev[key] === false }))
          }
          onClearSorting={() => {
            setSortField("orderDate");
            setSortAsc(false);
          }}
          onClearAggregations={() => setShowAggregations((p) => !p)}
          onResetPinning={() => {}}
        />

        <SalesOrderTable
          orders={orders}
          loading={loading}
          onView={(so) =>
            router.push(`/dashboard/offline-sales/sales-order/${so.id}/view`)
          }
          onEdit={(so) =>
            router.push(`/dashboard/offline-sales/sales-order/${so.id}/edit`)
          }
          onFulfillmentReport={(so) =>
            router.push(`/dashboard/offline-sales/sales-order/${so.id}/fulfillment-report`)
          }
          onDelete={(so) => {
            setDeletingTarget(so);
            setDeleteModalOpen(true);
          }}
          visibleColumns={visibleColumns}
          sortField={sortField}
          sortAsc={sortAsc}
          onSortChange={(f, a) => {
            setSortField(f);
            setSortAsc(a);
          }}
          showAggregations={showAggregations}
        />

        <DeleteSalesOrderModal
          open={deleteModalOpen}
          orderNo={deletingTarget?.orderNo}
          deleting={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setDeletingTarget(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
