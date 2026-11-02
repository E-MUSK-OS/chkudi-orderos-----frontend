"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
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
      <div className="w-full space-y-5 font-sans text-[#0A0E1A] dark:text-slate-100">
        {/* Top Header matching Image 2 */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/setting/manage-company/salaried-employee")
            }
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
            title="Back to Salaried Employees"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white leading-tight">
              Salaried Employee
            </h1>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="w-full py-32 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#F5C451] dark:text-white" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Loading employee details...
            </span>
          </div>
        ) : !employee ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-3 text-center">
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
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-xs font-semibold dark:text-white transition-colors cursor-pointer"
            >
              Return to Salaried Employees
            </button>
          </div>
        ) : (
          /* Two Column Layout matching Image 2 */
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

