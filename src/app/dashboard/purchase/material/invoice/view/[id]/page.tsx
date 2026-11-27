"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import MaterialInvoiceView from "@/components/Dashboard/Purchase/Material/Invoice/components/MaterialInvoiceView";
import { MaterialPurchaseInvoice } from "@/components/Dashboard/Purchase/Material/Invoice/types/materialInvoice.types";
import { materialInvoiceService } from "@/components/Dashboard/Purchase/Material/Invoice/services/materialInvoice.service";

export default function ViewMaterialInvoicePage() {
  const params = useParams();
  const router = useRouter();
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
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f2023] flex items-center justify-center text-sm text-slate-300">
        Loading purchase invoice...
      </div>
    );
  }

  return (
    <MaterialInvoiceView
      invoice={invoice}
      onClose={() => router.push("/dashboard/purchase/material/invoice")}
    />
  );
}
