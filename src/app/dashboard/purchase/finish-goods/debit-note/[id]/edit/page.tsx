"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import DebitNoteCreateForm from "@/components/Dashboard/Purchase/DebitNote/components/DebitNoteCreateForm";
import { purchaseDebitNoteService } from "@/components/Dashboard/Purchase/DebitNote/services/purchaseDebitNote.service";
import { PurchaseDebitNote } from "@/components/Dashboard/Purchase/DebitNote/types/purchaseDebitNote.types";

export default function EditDebitNotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listPath = "/dashboard/purchase/finish-goods/debit-note";
  const [debitNote, setDebitNote] = useState<PurchaseDebitNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    purchaseDebitNoteService
      .getDebitNoteById(params.id)
      .then((data) => setDebitNote(data))
      .catch((err: any) => {
        toast.error(err.message || "Failed to load Debit Note");
        router.push(listPath);
      })
      .finally(() => setLoading(false));
  }, [params?.id, router]);

  return (
    <DashboardLayout title="Edit Debit Note">
      <div className="max-w-[1700px] mx-auto">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading Debit Note...
          </div>
        ) : debitNote ? (
          <DebitNoteCreateForm
            debitNote={debitNote}
            onSuccess={() => router.push(listPath)}
            onCancel={() => router.push(listPath)}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
