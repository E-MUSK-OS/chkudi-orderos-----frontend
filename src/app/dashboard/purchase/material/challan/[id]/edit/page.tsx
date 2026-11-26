"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import MaterialChallanForm from "@/components/Dashboard/Purchase/Material/Challan/components/MaterialChallanForm";
import { MaterialPurchaseChallan } from "@/components/Dashboard/Purchase/Material/Challan/types/materialChallan.types";
import { materialChallanService } from "@/components/Dashboard/Purchase/Material/Challan/services/materialChallan.service";

export default function EditMaterialChallanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [challan, setChallan] = useState<MaterialPurchaseChallan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    let active = true;
    materialChallanService
      .getChallanById(params.id)
      .then((data) => {
        if (active) setChallan(data);
      })
      .catch((err: any) => {
        toast.error(err?.message || "Failed to load Material Challan");
        router.push("/dashboard/purchase/material/challan");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params?.id, router]);

  return (
    <DashboardLayout title="Edit Material Challan">
      {loading ? (
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center text-xs text-slate-400">
          Loading Material Challan...
        </div>
      ) : challan ? (
        <MaterialChallanForm
          challanToEdit={challan}
          onBack={() => router.push("/dashboard/purchase/material/challan")}
          onSaved={() => router.push("/dashboard/purchase/material/challan")}
        />
      ) : null}
    </DashboardLayout>
  );
}
