"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import UserProfileForm from "@/components/Dashboard/Settings/ManageUsers/components/UserProfileForm";
import { usePagePermissions } from "@/utils/pagePermissions";

export default function CreateUserPage() {
  const router = useRouter();
  const returnPath = "/dashboard/settings/manage-users/user-profile";
  const { canCreate } = usePagePermissions("settings/manage-users");

  if (!canCreate) {
    return (
      <DashboardLayout title="Create User Profile">
        <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Access Denied</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You do not have permission to create users.
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
    <DashboardLayout title="Create User Profile">
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
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                User Profile
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Create a new user profile with department, role, and page permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Create Form Container */}
        <UserProfileForm
          mode="create"
          onSuccess={() => router.push(returnPath)}
          onCancel={() => router.push(returnPath)}
        />
      </div>
    </DashboardLayout>
  );
}
