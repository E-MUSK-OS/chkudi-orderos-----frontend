"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import EmployeeProfileForm from "@/components/Dashboard/Settings/ManageCompany/EmployeeProfile/components/EmployeeProfileForm";
import { employeeService } from "@/components/Dashboard/Settings/ManageCompany/EmployeeProfile/services/employee.service";
import { Employee } from "@/components/Dashboard/Settings/ManageCompany/EmployeeProfile/types/employee.types";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await employeeService.getEmployeeById(id);
        setEmployee(res.data);
      } catch (err: any) {
        const msg = err.message || "Failed to load employee for editing.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Employee Profile">
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
          <Loader2 size={36} className="animate-spin text-[#F5C451] mb-3" />
          <p className="text-sm font-medium">Loading employee details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout title="Employee Profile">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-[#0E121A] rounded-2xl border border-white/[0.08]">
          <p className="text-sm text-rose-400 mb-4">{error || "Employee not found."}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/setting/manage-company/employee-profile")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold text-xs transition-all cursor-pointer hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            <span>Back to Employee Profile</span>
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return <EmployeeProfileForm initialData={employee} mode="edit" />;
}

