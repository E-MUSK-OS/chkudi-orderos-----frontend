"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import UserProfileForm from "@/components/Dashboard/Settings/ManageUsers/components/UserProfileForm";
import { useUser } from "@/components/Dashboard/Settings/ManageUsers/hooks/useManageUsers";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const returnPath = "/dashboard/settings/manage-users/user-profile";

  const { data: response, isLoading, error } = useUser(id);
  const user = response?.data;

  return (
    <DashboardLayout title="Edit User Profile">
      <div className="space-y-4 sm:space-y-6 w-full pb-10">
        {/* Header Card matching OrderOS Amazon theme */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-700 hover:text-[#0A0E1A] dark:text-slate-300 dark:hover:text-white bg-slate-50 dark:bg-[#080B11] hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer border border-slate-200 dark:border-white/[0.08] shadow-xs"
              title="Back to User Profile"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A0E1A] dark:text-white tracking-tight">
                User Profile
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Edit user details, departments, and page access rights.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body or Loading */}
        {isLoading ? (
          <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-8 animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 dark:bg-white/[0.06] rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-xl" />
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-xl" />
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-xl" />
            </div>
            <div className="h-40 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
          </div>
        ) : error || !user ? (
          <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 p-8 text-center">
            <h3 className="text-base font-bold text-red-600 dark:text-red-400">
              Unable to load user
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {(error as any)?.message || "The requested user was not found or you do not have permission to view it."}
            </p>
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              className="mt-4 h-10 px-5 rounded-2xl text-xs font-bold bg-[#E8C16D] text-[#0A0E1A]"
            >
              Back to User Profile
            </button>
          </div>
        ) : (
          <UserProfileForm
            initialData={user}
            mode="edit"
            onSuccess={() => router.push(returnPath)}
            onCancel={() => router.push(returnPath)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
