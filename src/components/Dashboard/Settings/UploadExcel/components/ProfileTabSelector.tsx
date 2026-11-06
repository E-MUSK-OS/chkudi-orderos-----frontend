"use client";

import React from "react";
import {
  Building2,
  BookOpen,
  Users,
  Wallet,
  Layers,
  Package,
} from "lucide-react";
import { PROFILES_LIST, type ProfileKey } from "../constants/uploadExcel.constants";

interface ProfileTabSelectorProps {
  activeTab: ProfileKey;
  onTabChange: (key: ProfileKey) => void;
}

const tabIcons: Record<ProfileKey, React.ElementType> = {
  company: Building2,
  ledger: BookOpen,
  employee: Users,
  salaried: Wallet,
  material: Layers,
  product: Package,
};

export default function ProfileTabSelector({
  activeTab,
  onTabChange,
}: ProfileTabSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 border-b border-[#E7E0D2] dark:border-white/[0.08]">
      {PROFILES_LIST.map((profile) => {
        const Icon = tabIcons[profile.key];
        const isActive = activeTab === profile.key;

        return (
          <button
            key={profile.key}
            type="button"
            onClick={() => onTabChange(profile.key)}
            className={`flex items-center gap-2 rounded-t-2xl border-b-2 px-3.5 sm:px-5 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
              isActive
                ? "border-[#B88728] text-[#B88728] bg-[#FFF9EC]/70 dark:border-[#F5C451] dark:text-[#F5C451] dark:bg-white/[0.04]"
                : "border-transparent text-slate-500 hover:text-[#0A0E1A] hover:bg-slate-50/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.02]"
            }`}
          >
            <Icon size={16} />
            <span>{profile.label}</span>
          </button>
        );
      })}
    </div>
  );
}
