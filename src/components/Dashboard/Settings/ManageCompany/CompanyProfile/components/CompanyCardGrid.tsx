"use client";

import React from "react";
import { Building2, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { Company } from "../types/company.types";
import CompanyCard from "./CompanyCard";

interface CompanyCardGridProps {
  companies: Company[];
  loading: boolean;
  onModify: (company: Company) => void;
  onToggleStatus: (company: Company) => void;
  onDelete?: (company: Company) => void;
  onView?: (company: Company) => void;
  onAddNew: () => void;
  togglingId?: string | null;
}

export default function CompanyCardGrid({
  companies,
  loading,
  onModify,
  onToggleStatus,
  onDelete,
  onView,
  onAddNew,
  togglingId,
}: CompanyCardGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-56 rounded-2xl border border-slate-200 bg-slate-100/60 dark:border-white/[0.08] dark:bg-[#0F1626]/60 p-5 animate-pulse flex flex-col justify-between"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-white/[0.08] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/[0.08]" />
                <div className="h-3 w-1/3 rounded bg-white/[0.08]" />
              </div>
              <div className="w-16 h-6 rounded-full bg-white/[0.08]" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
              <div className="space-y-1.5">
                <div className="h-2.5 w-12 rounded bg-white/[0.08]" />
                <div className="h-3.5 w-28 rounded bg-white/[0.08]" />
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 w-12 rounded bg-white/[0.08]" />
                <div className="h-3.5 w-28 rounded bg-white/[0.08]" />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/[0.06]">
              <div className="w-8 h-4 rounded-full bg-white/[0.08]" />
              <div className="flex gap-2">
                <div className="w-16 h-7 rounded-lg bg-white/[0.08]" />
                <div className="w-16 h-7 rounded-lg bg-white/[0.08]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-white/[0.1] bg-white/50 dark:bg-[#0F1626]/30 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] mb-4">
          <Building2 className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          No Companies Found
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          You haven't registered any company profile yet or none match your filter criteria.
        </p>
        <Button
          variant="primary"
          fullWidth={false}
          onClick={onAddNew}
          leftIcon={<Plus size={18} />}
          className="mt-5 h-10 px-6 text-xs sm:text-sm font-bold rounded-2xl active:scale-[0.98]"
        >
          Create Company
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
      {companies.map((company) => (
        <CompanyCard
          key={company.id}
          company={company}
          onModify={onModify}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          onView={onView}
          togglingStatus={togglingId === company.id}
        />
      ))}
    </div>
  );
}
