"use client";

import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import CreditNoteCreateForm from "@/components/Dashboard/OfflineSales/CreditNote/components/CreditNoteCreateForm";

export default function NewCreditNotePage() {
  const router = useRouter();
  const listPath = "/dashboard/offline-sales/credit-note";

  return (
    <DashboardLayout title="Create Credit Note">
      <CreditNoteCreateForm
        onSuccess={() => router.push(listPath)}
        onCancel={() => router.push(listPath)}
      />
    </DashboardLayout>
  );
}
