"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import MaterialChallanViewModal from "@/components/Dashboard/Purchase/Material/Challan/components/MaterialChallanViewModal";
import { MaterialPurchaseChallan } from "@/components/Dashboard/Purchase/Material/Challan/types/materialChallan.types";
import { materialChallanService } from "@/components/Dashboard/Purchase/Material/Challan/services/materialChallan.service";

export default function ViewMaterialChallanPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");
  const [challan, setChallan] = useState<MaterialPurchaseChallan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    materialChallanService
      .getChallanById(id)
      .then((data) => setChallan(data))
      .catch((err) => {
        toast.error(err?.message || "Failed to load material challan");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f2023] flex items-center justify-center text-sm text-slate-300">
        Loading purchase challan...
      </div>
    );
  }

  return (
    <MaterialChallanViewModal
      open={Boolean(challan)}
      challan={challan}
      isPage
      onClose={() => router.push("/dashboard/purchase/material/challan")}
    />
  );
}
