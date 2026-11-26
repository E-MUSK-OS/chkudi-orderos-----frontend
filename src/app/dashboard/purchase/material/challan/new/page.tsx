"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import MaterialChallanForm from "@/components/Dashboard/Purchase/Material/Challan/components/MaterialChallanForm";

export default function NewMaterialChallanPage() {
  const router = useRouter();

  return (
    <DashboardLayout title="Create Material Challan">
      <MaterialChallanForm
        onBack={() => router.push("/dashboard/purchase/material/challan")}
        onSaved={() => router.push("/dashboard/purchase/material/challan")}
      />
    </DashboardLayout>
  );
}
