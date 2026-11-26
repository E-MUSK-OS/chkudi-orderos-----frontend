"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import FulfillmentHeader from "./components/FulfillmentHeader";
import FulfillmentFilters from "./components/FulfillmentFilters";
import FulfillmentTable from "./components/FulfillmentTable";
import { SalesOrder, SalesOrderFilterState } from "../SalesOrder/types/salesOrder.types";
import { salesOrderService } from "../SalesOrder/services/salesOrder.service";

export default function FulfillmentPlanningPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [filters, setFilters] = useState<SalesOrderFilterState>({
    search: "",
    party: "",
    status: "",
    fulfillmentPlan: "",
    startDate: "",
    endDate: "",
  });

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    date: true,
    orderNo: true,
    party: true,
    contactNo: true,
    orderQty: true,
    deliveredQty: true,
    pendingQty: true,
    totalAmount: true,
    expDeliveryDate: true,
    status: true,
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
      toast.error(err.message || "Failed to load Fulfillment Planning");
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
      fulfillmentPlan: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleToggleStatus = async (so: SalesOrder, nextStatus: string) => {
    try {
      const updated = await salesOrderService.updateFulfillmentPlan(so.id, nextStatus);
      setOrders((prev) => prev.map((item) => (item.id === so.id ? updated : item)));
      toast.success(`${so.orderNo} fulfillment updated to ${nextStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update fulfillment status");
    }
  };

  const handleDownload = async () => {
    try {
      await salesOrderService.exportExcel(filters, selectedIds);
      toast.success(
        selectedIds.length > 0
          ? `Exported ${selectedIds.length} selected record(s) to Excel`
          : "Fulfillment Planning exported to Excel"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to export");
    }
  };

  return (
    <DashboardLayout title="Fulfillment Planning">
      <div className="space-y-4">
        <FulfillmentHeader onDownload={handleDownload} />

        <FulfillmentFilters
          filters={filters}
          onChange={handleFilterChange}
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

        <FulfillmentTable
          orders={orders}
          loading={loading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onToggleStatus={handleToggleStatus}
          visibleColumns={visibleColumns}
          sortField={sortField}
          sortAsc={sortAsc}
          onSortChange={(f, a) => {
            setSortField(f);
            setSortAsc(a);
          }}
          showAggregations={showAggregations}
        />
      </div>
    </DashboardLayout>
  );
}
