"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import MaterialDiscountDebitNoteForm from "@/components/Dashboard/Purchase/Material/DebitNote/components/MaterialDiscountDebitNoteForm";

function NewDiscountDebitNoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvoiceId = searchParams.get("invoiceId");

  return (
    <MaterialDiscountDebitNoteForm
      initialInvoiceId={initialInvoiceId}
      onBack={() => router.push("/dashboard/purchase/material/debit-note/discount")}
      onSaved={() => router.push("/dashboard/purchase/material/debit-note/discount")}
    />
  );
}

export default function NewMaterialDiscountDebitNotePage() {
  return (
    <DashboardLayout title="Discount Debit Note [ Material & Service ]">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
        }
      >
        <NewDiscountDebitNoteContent />
      </Suspense>
    </DashboardLayout>
  );
}
