"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import MaterialReturnDebitNoteForm from "@/components/Dashboard/Purchase/Material/DebitNote/components/MaterialReturnDebitNoteForm";

function NewReturnDebitNoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");

  return (
    <MaterialReturnDebitNoteForm
      initialInvoiceId={invoiceId}
      onBack={() => router.push("/dashboard/purchase/material/debit-note/return")}
      onSaved={() => router.push("/dashboard/purchase/material/debit-note/return")}
    />
  );
}

export default function NewMaterialReturnDebitNotePage() {
  return (
    <DashboardLayout title="Create Debit Note [ Material & Service ]">
      <Suspense
        fallback={
          <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center text-sm text-slate-400">
            Loading...
          </div>
        }
      >
        <NewReturnDebitNoteContent />
      </Suspense>
    </DashboardLayout>
  );
}
