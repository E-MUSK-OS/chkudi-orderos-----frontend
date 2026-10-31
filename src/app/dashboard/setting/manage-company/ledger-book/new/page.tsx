"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import LedgerBookForm from "@/components/Dashboard/Settings/ManageCompany/LedgerBook/components/LedgerBookForm";

export default function NewLedgerPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/dashboard/setting/manage-company/ledger-book");
  };

  const handleSaved = () => {
    router.push("/dashboard/setting/manage-company/ledger-book");
  };

  return (
    <DashboardLayout title="Ledger Book">
      <LedgerBookForm onBack={handleBack} onSaved={handleSaved} />
    </DashboardLayout>
  );
}
