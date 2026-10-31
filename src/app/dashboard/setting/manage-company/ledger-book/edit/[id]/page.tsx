"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import LedgerBookForm from "@/components/Dashboard/Settings/ManageCompany/LedgerBook/components/LedgerBookForm";
import { ledgerService } from "@/components/Dashboard/Settings/ManageCompany/LedgerBook/services/ledger.service";
import { Ledger } from "@/components/Dashboard/Settings/ManageCompany/LedgerBook/types/ledger.types";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function EditLedgerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await ledgerService.getLedgerById(id);
        setLedger(res.data);
      } catch (err: any) {
        const msg = err.message || "Failed to load ledger for editing.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleBack = () => {
    router.push("/dashboard/setting/manage-company/ledger-book");
  };

  const handleSaved = () => {
    router.push("/dashboard/setting/manage-company/ledger-book");
  };

  if (loading) {
    return (
      <DashboardLayout title="Ledger Book">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
          <Loader2 size={36} className="animate-spin text-[#F5C451] mb-3" />
          <p className="text-sm font-medium">Loading ledger details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !ledger) {
    return (
      <DashboardLayout title="Ledger Book">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-[#0E121A] rounded-2xl border border-white/[0.08]">
          <p className="text-sm text-rose-400 mb-4">{error || "Ledger not found."}</p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold text-xs transition-all cursor-pointer hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            <span>Back to Ledger Book</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ledger Book">
      <LedgerBookForm
        initialLedger={ledger}
        onBack={handleBack}
        onSaved={handleSaved}
      />
    </DashboardLayout>
  );
}
