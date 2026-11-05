"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Users } from "lucide-react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import SalaryDetailsCard from "./components/SalaryDetailsCard";
import AbsentHourRecordsCard from "./components/AbsentHourRecordsCard";
import { SalariedEmployee } from "./types/salariedEmployee.types";
import { salariedEmployeeService } from "./services/salariedEmployee.service";
import { toast } from "sonner";

interface SalariedEmployeeDetailPageProps {
  id: string;
}

export default function SalariedEmployeeDetailPage({
  id,
}: SalariedEmployeeDetailPageProps) {
  const router = useRouter();
  const [employee, setEmployee] = useState<SalariedEmployee | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      const data = await salariedEmployeeService.getSalariedEmployeeById(
        id,
        "2026-2027"
      );
      setEmployee(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load salaried employee.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  return (
    <DashboardLayout title="Salaried Employee">
      <div className="w-full space-y-4 font-sans text-slate-900 dark:text-slate-100 pb-8 max-w-[1600px] mx-auto">
        {/* Top Header Bar matching Employee Profile & Ledger Book */}
        <div className="w-full rounded-2xl sm:rounded-3xl border border-[#EAE4D8] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 sm:px-7 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/setting/manage-company/salaried-employee")
              }
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Back to Salaried Employees"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Salaried Employee
              </h1>
              <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium ml-0.5">
                <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Setting
                </span>
                <span>/</span>
                <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Manage Company
                </span>
                <span>/</span>
                <span className="text-[#B88728] dark:text-[#E8C16D] font-bold">
                  Salaried Employee
                </span>
                {employee && (
                  <>
                    <span>•</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {employee.fullName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="w-full py-32 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#B88728] dark:text-[#E8C16D]" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Loading employee details...
            </span>
          </div>
        ) : !employee ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-3 text-center bg-white border border-[#EAE4D8] dark:bg-[#0F1626] dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-sm p-8">
            <AlertCircle size={36} className="text-red-500 dark:text-red-400" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Employee not found
            </p>
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/setting/manage-company/salaried-employee"
                )
              }
              className="px-5 py-2.5 rounded-full bg-[#0A0E1A] text-white hover:bg-black dark:bg-white dark:text-[#0A0E1A] text-xs font-bold transition-all cursor-pointer"
            >
              Return to Salaried Employees
            </button>
          </div>
        ) : (
          /* Two Column Layout matching visual design */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Card: Basic Salary and Working Details (approx 5 cols on lg) */}
            <div className="lg:col-span-5 w-full">
              <SalaryDetailsCard
                employee={employee}
                onUpdateSuccess={(updated) => {
                  setEmployee((prev) => (prev ? { ...prev, ...updated } : updated));
                }}
              />
            </div>

            {/* Right Card: Absent Hour Records (2026-2027) (approx 7 cols on lg) */}
            <div className="lg:col-span-7 w-full">
              <AbsentHourRecordsCard
                employee={employee}
                financialYear="2026-2027"
                onRecordsChange={fetchEmployee}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
