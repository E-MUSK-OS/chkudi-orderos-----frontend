"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import MaterialInvoiceForm from "@/components/Dashboard/Purchase/Material/Invoice/components/MaterialInvoiceForm";
import { MaterialPurchaseInvoice } from "@/components/Dashboard/Purchase/Material/Invoice/types/materialInvoice.types";
import { materialInvoiceService } from "@/components/Dashboard/Purchase/Material/Invoice/services/materialInvoice.service";

export default function EditMaterialInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");
  const [invoice, setInvoice] = useState<MaterialPurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    materialInvoiceService
      .getInvoiceById(id)
      .then((data) => setInvoice(data))
      .catch((err) => {
        toast.error(err?.message || "Failed to load material invoice");
        router.push("/dashboard/purchase/material/invoice");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  return (
    <DashboardLayout title="Edit Invoice [ Purchase Material & Service ]">
      {loading ? (
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center text-sm text-slate-400">
          Loading material purchase invoice...
        </div>
      ) : (
        <MaterialInvoiceForm
          invoiceToEdit={invoice}
          onBack={() => router.push("/dashboard/purchase/material/invoice")}
          onSaved={() => router.push("/dashboard/purchase/material/invoice")}
        />
      )}
    </DashboardLayout>
  );
}
