"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import MaterialDebitNoteView from "@/components/Dashboard/Purchase/Material/DebitNote/components/MaterialDebitNoteView";
import { MaterialPurchaseDebitNote } from "@/components/Dashboard/Purchase/Material/DebitNote/types/materialDebitNote.types";
import { materialDebitNoteService } from "@/components/Dashboard/Purchase/Material/DebitNote/services/materialDebitNote.service";

export default function ViewMaterialDiscountDebitNotePage() {
  const params = useParams();
  const router = useRouter();
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
        toast.error(err?.message || "Failed to load discount debit note");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f2023] flex items-center justify-center text-sm text-slate-300">
        Loading discount debit note...
      </div>
    );
  }

  return (
    <MaterialDebitNoteView
      debitNote={debitNote}
      title="DISCOUNT DEBIT NOTE"
      onClose={() =>
        router.push("/dashboard/purchase/material/debit-note/discount")
      }
    />
  );
}
