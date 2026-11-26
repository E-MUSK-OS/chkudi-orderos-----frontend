"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import MaterialOrderForm from "@/components/Dashboard/Purchase/Material/Order/components/MaterialOrderForm";
import { MaterialPurchaseOrder } from "@/components/Dashboard/Purchase/Material/Order/types/materialOrder.types";
import { materialOrderService } from "@/components/Dashboard/Purchase/Material/Order/services/materialOrder.service";

export default function EditMaterialOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<MaterialPurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    let active = true;
    materialOrderService
      .getOrderById(params.id)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch((err: any) => {
        toast.error(err?.message || "Failed to load Material Order");
        router.push("/dashboard/purchase/material/order");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params?.id, router]);

  return (
    <DashboardLayout title="Edit Material Order">
      {loading ? (
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center text-xs text-slate-400">
          Loading Material Order...
        </div>
      ) : order ? (
        <MaterialOrderForm
          orderToEdit={order}
          onBack={() => router.push("/dashboard/purchase/material/order")}
          onSaved={() => router.push("/dashboard/purchase/material/order")}
        />
      ) : null}
    </DashboardLayout>
  );
}
