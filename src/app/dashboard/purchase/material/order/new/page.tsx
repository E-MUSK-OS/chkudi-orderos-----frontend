"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import MaterialOrderForm from "@/components/Dashboard/Purchase/Material/Order/components/MaterialOrderForm";

export default function NewMaterialOrderPage() {
  const router = useRouter();

  return (
    <DashboardLayout title="Create Material Order">
      <MaterialOrderForm
        onBack={() => router.push("/dashboard/purchase/material/order")}
        onSaved={() => router.push("/dashboard/purchase/material/order")}
      />
    </DashboardLayout>
  );
}
