"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "../../layout/DashboardLayout";
import ProfileTabSelector from "./components/ProfileTabSelector";
import ExcelAccordionSection from "./components/ExcelAccordionSection";
import {
  PROFILES_LIST,
  PROFILE_SECTIONS,
  type ProfileKey,
} from "./constants/uploadExcel.constants";

export default function UploadExcelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial tab from URL query params (e.g. ?tab=product)
  const initialTab = (searchParams.get("tab") as ProfileKey) || "product";
  const [activeTab, setActiveTab] = useState<ProfileKey>(() => {
    return PROFILES_LIST.some((p) => p.key === initialTab) ? initialTab : "product";
  });

  // Keep state synced if URL changes
  useEffect(() => {
    const tabParam = searchParams.get("tab") as ProfileKey;
    if (tabParam && PROFILES_LIST.some((p) => p.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (key: ProfileKey) => {
    setActiveTab(key);
    router.replace(`/dashboard/settings/upload-excel?tab=${key}`);
  };

  const activeMeta = PROFILES_LIST.find((p) => p.key === activeTab) || PROFILES_LIST[0];
  const activeSections = PROFILE_SECTIONS[activeTab] || [];

  return (
    <DashboardLayout title="Upload Excel">
      <div className="space-y-6 max-w-[1600px] mx-auto pb-16 font-sans">
        {/* Header Banner matching Client, Profile & Wallet pages */}
        <section className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5 min-w-0 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Upload Excel
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {activeMeta.description}
              </p>
            </div>
          </div>
        </section>

        {/* Profile Tabs matching WalletTabs */}
        <ProfileTabSelector activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Sections List matching ClientConfigSectionCard */}
        <div className="space-y-3.5 pt-2">
          {activeSections.map((section, idx) => (
            <ExcelAccordionSection
              key={`${activeTab}-${section.id}`}
              profile={activeTab}
              section={section}
              defaultOpen={idx === 0}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
