"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import UserProfileForm from "@/components/Dashboard/Settings/ManageUsers/components/UserProfileForm";
import { useUser } from "@/components/Dashboard/Settings/ManageUsers/hooks/useManageUsers";
import { usePagePermissions } from "@/utils/pagePermissions";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const returnPath = "/dashboard/settings/manage-users/user-profile";

  const { canUpdate } = usePagePermissions("settings/manage-users");
  const { data: response, isLoading, error } = useUser(id);
  const user = response?.data;

  if (!canUpdate) {
    return (
      <DashboardLayout title="Edit User Profile">
        <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Access Denied</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You do not have permission to edit users.
          </p>
          <button
            type="button"
            onClick={() => router.push(returnPath)}
            className="h-10 px-5 rounded-2xl text-xs font-bold bg-[#E8C16D] text-[#0A0E1A]"
          >
            Back to User Profile
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit User Profile">
      <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100 pb-10 max-w-[1600px] mx-auto">
        {/* Header Card matching Material Profile & Company Profile */}
        <div className="w-full rounded-2xl sm:rounded-3xl border border-[#EAE4D8] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 sm:px-7 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.push(returnPath)}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Back to User Profile"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
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
