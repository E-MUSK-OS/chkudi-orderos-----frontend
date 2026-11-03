"use client";

import { ShieldCheck, UserCheck, Calendar, Shield, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@/services/auth/auth.types";
import { profileService } from "@/services/profile.service";

function formatDisplayDate(rawDob: any): string {
  if (!rawDob) return "Not Set";
  if (typeof rawDob === "string") {
    const trimmed = rawDob.trim();
    if (!trimmed) return "Not Set";
    const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) {
      return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
    }
    const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmy) {
      return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`;
    }
  }
  try {
    const d = new Date(rawDob);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {}
  return "Not Set";
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }
  const savedUser = localStorage.getItem("user");
  if (!savedUser) {
    return null;
  }
  try {
    return JSON.parse(savedUser) as User;
  } catch {
    return null;
  }
}

export default function AccountStatus() {
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setUser(getStoredUser());

    const refresh = () => {
      setUser(getStoredUser());
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("user_profile_updated", refresh);

    // Also fetch fresh
    profileService.getProfile().then((data) => {
      if (data) setUser(data);
    }).catch(() => {});

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("user_profile_updated", refresh);
    };
  }, []);

  if (!isMounted) {
    return (
      <aside className="space-y-6 animate-pulse">
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D2] dark:border-white/[0.08]">
            <div className="h-6 w-36 rounded-lg bg-slate-200 dark:bg-white/[0.06]" />
            <div className="h-5 w-16 rounded bg-slate-200 dark:bg-white/[0.06]" />
          </div>
          <div className="mt-4 space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 w-28 rounded bg-slate-200 dark:bg-white/[0.06]" />
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FDFBF7] dark:bg-[#0A0E1A] p-5 shadow-xs">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-white/[0.06]" />
          <div className="mt-2 h-10 w-full rounded bg-slate-200 dark:bg-white/[0.06]" />
        </section>
      </aside>
    );
  }

  const roleBadgeStyle = {
    SUPERADMIN: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    ADMIN: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    USER: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
  }[(user?.role as "SUPERADMIN" | "ADMIN" | "USER") || "USER"] || "bg-slate-500/15 text-slate-400 border-slate-500/30";

  return (
    <aside className="space-y-6">
      {/* Account Status Card */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D2] dark:border-white/[0.08]">
          <h3 className="text-lg font-bold text-[#0A0E1A] dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#B88728] dark:text-[#E8C16D]" />
            Account Overview
          </h3>
          {user?.role && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${roleBadgeStyle}`}>
              {user.role}
            </span>
          )}
        </div>

        <div className="mt-4 space-y-3.5 text-xs sm:text-sm">
          {/* Account Status */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <UserCheck size={14} className="text-emerald-500" />
              Account Status
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>

          {/* Email Verification */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Mail size={14} className="text-blue-500" />
              Email Verification
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <ShieldCheck size={13} />
              {user?.isEmailVerified ? "Verified" : "Verified"}
            </span>
          </div>

          {/* Username */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Username
            </span>
            <span className="font-bold text-[#0A0E1A] dark:text-slate-200">
              @{user?.username || "—"}
            </span>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Phone size={14} className="text-amber-500" />
              Mobile
            </span>
            <span className="font-bold text-[#0A0E1A] dark:text-slate-200">
              {user?.phone || "Not Set"}
            </span>
          </div>

          {/* Gender */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <UserCheck size={14} className="text-purple-500" />
              Gender
            </span>
            <span className="font-bold text-[#0A0E1A] dark:text-slate-200">
              {user?.gender || "Not Set"}
            </span>
          </div>

          {/* Date of Birth */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500" />
              Date of Birth
            </span>
            <span className="font-bold text-[#0A0E1A] dark:text-slate-200">
              {formatDisplayDate(user?.dob)}
            </span>
          </div>

          {/* Member Since */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Calendar size={14} className="text-[#B88728] dark:text-[#E8C16D]" />
              Member Since
            </span>
            <span className="font-bold text-[#0A0E1A] dark:text-slate-200">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>
      </section>

      {/* Security Tip Card */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FDFBF7] dark:bg-[#0A0E1A] p-5 text-[#0A0E1A] dark:text-white shadow-xs">
        <p className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D] flex items-center gap-1.5">
          <Shield size={14} /> Profile Sync
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          Your profile image and personal information are automatically synced across OrderOS, including the header navigation, user directory, and activity logs.
        </p>
      </section>
    </aside>
  );
}
