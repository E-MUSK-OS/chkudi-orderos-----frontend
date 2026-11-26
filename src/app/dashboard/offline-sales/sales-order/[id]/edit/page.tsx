"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import SalesOrderCreateForm from "@/components/Dashboard/OfflineSales/SalesOrder/components/SalesOrderCreateForm";
import { salesOrderService } from "@/components/Dashboard/OfflineSales/SalesOrder/services/salesOrder.service";
import { SalesOrder } from "@/components/Dashboard/OfflineSales/SalesOrder/types/salesOrder.types";

export default function EditSalesOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listPath = "/dashboard/offline-sales/sales-order";
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    salesOrderService
      .getOrderById(params.id)
      .then((data) => setOrder(data))
      .catch((err: any) => {
        toast.error(err.message || "Failed to load Sales Order");
        router.push(listPath);
      })
      .finally(() => setLoading(false));
  }, [params?.id, router]);

  return (
    <DashboardLayout title="Edit Sales Order">
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Loading Sales Order...
        </div>
      ) : order ? (
        <SalesOrderCreateForm
          order={order}
          onSuccess={() => router.push(listPath)}
          onCancel={() => router.push(listPath)}
        />
      ) : null}
    </DashboardLayout>
  );
}
