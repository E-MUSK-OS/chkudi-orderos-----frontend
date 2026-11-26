"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import CreditNoteCreateForm from "@/components/Dashboard/OfflineSales/CreditNote/components/CreditNoteCreateForm";
import { salesCreditNoteService } from "@/components/Dashboard/OfflineSales/CreditNote/services/salesCreditNote.service";
import { SalesCreditNote } from "@/components/Dashboard/OfflineSales/CreditNote/types/salesCreditNote.types";

export default function EditCreditNotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listPath = "/dashboard/offline-sales/credit-note";
  const [creditNote, setCreditNote] = useState<SalesCreditNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    salesCreditNoteService
      .getCreditNoteById(params.id)
      .then((data) => setCreditNote(data))
      .catch((err: any) => {
        toast.error(err.message || "Failed to load Credit Note");
        router.push(listPath);
      })
      .finally(() => setLoading(false));
  }, [params?.id, router]);

  return (
    <DashboardLayout title="Edit Credit Note">
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Loading Credit Note...
        </div>
      ) : creditNote ? (
        <CreditNoteCreateForm
          creditNote={creditNote}
          onSuccess={() => router.push(listPath)}
          onCancel={() => router.push(listPath)}
        />
      ) : null}
    </DashboardLayout>
  );
}
