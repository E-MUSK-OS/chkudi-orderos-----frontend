"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import MaterialInvoiceForm from "@/components/Dashboard/Purchase/Material/Invoice/components/MaterialInvoiceForm";

export default function NewMaterialInvoicePage() {
  const router = useRouter();
  return (
    <DashboardLayout title="Create Invoice [ Purchase Material & Service ]">
      <MaterialInvoiceForm
        onBack={() => router.push("/dashboard/purchase/material/invoice")}
        onSaved={() => router.push("/dashboard/purchase/material/invoice")}
      />
    </DashboardLayout>
  );
}
