"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import CompanyProfileForm from "./components/CompanyProfileForm";
import { Company } from "./types/company.types";
import { companyService } from "./services/company.service";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface CompanyProfileEditPageProps {
  id?: string;
}

export default function CompanyProfileEditPage({ id: propId }: CompanyProfileEditPageProps) {
  const router = useRouter();
  const params = useParams();
  const companyId = propId || (params?.id as string);

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await companyService.getCompanyById(companyId);
      setCompany(res.data);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Failed to load company profile.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleBack = () => {
    router.push("/dashboard/setting/manage-company/company-profile");
  };

  const handleSaved = (updated: Company) => {
    setCompany(updated);
  };

  return (
    <DashboardLayout title="Company Profile">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
          <Loader2 size={36} className="animate-spin text-[#F5C451] mb-3" />
          <p className="text-sm font-medium">Loading company profile details...</p>
        </div>
      ) : error || !company ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-[#0E121A] rounded-2xl border border-white/[0.08]">
          <p className="text-sm text-rose-400 mb-4">{error || "Company not found."}</p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold text-xs transition-all cursor-pointer hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            <span>Back to Company Profiles</span>
          </button>
        </div>
      ) : (
        <CompanyProfileForm
          company={company}
          onBack={handleBack}
          onSaved={handleSaved}
        />
      )}
    </DashboardLayout>
  );
}
