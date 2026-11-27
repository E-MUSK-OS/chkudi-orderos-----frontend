"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import MaterialReturnDebitNoteForm from "@/components/Dashboard/Purchase/Material/DebitNote/components/MaterialReturnDebitNoteForm";
import { MaterialPurchaseDebitNote } from "@/components/Dashboard/Purchase/Material/DebitNote/types/materialDebitNote.types";
import { materialDebitNoteService } from "@/components/Dashboard/Purchase/Material/DebitNote/services/materialDebitNote.service";

export default function EditMaterialReturnDebitNotePage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");
  const [debitNote, setDebitNote] = useState<MaterialPurchaseDebitNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    materialDebitNoteService
      .getDebitNoteById(id)
      .then((data) => setDebitNote(data))
      .catch((err) => {
        toast.error(err?.message || "Failed to load debit note");
        router.push("/dashboard/purchase/material/debit-note/return");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  return (
    <DashboardLayout title="Edit Debit Note [ Material & Service ]">
      {loading ? (
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center text-sm text-slate-400">
          Loading material debit note...
        </div>
      ) : (
        <MaterialReturnDebitNoteForm
          debitNoteToEdit={debitNote}
          onBack={() => router.push("/dashboard/purchase/material/debit-note/return")}
          onSaved={() => router.push("/dashboard/purchase/material/debit-note/return")}
        />
      )}
    </DashboardLayout>
  );
}
