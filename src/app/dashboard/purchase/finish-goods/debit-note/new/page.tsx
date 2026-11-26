"use client";

import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import DebitNoteCreateForm from "@/components/Dashboard/Purchase/DebitNote/components/DebitNoteCreateForm";

export default function NewDebitNotePage() {
  const router = useRouter();
  const listPath = "/dashboard/purchase/finish-goods/debit-note";

  return (
    <DashboardLayout title="Create Debit Note">
      <div className="max-w-[1700px] mx-auto">
        <DebitNoteCreateForm
          onSuccess={() => router.push(listPath)}
          onCancel={() => router.push(listPath)}
        />
      </div>
    </DashboardLayout>
  );
}
