"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Mail, Phone, Calendar, Shield, UserCheck } from "lucide-react";
import type { ManagedUser } from "../types/userManagement.types";
import { getAvatarUrl } from "../utils/avatarUrl";
import { getCurrentUser } from "@/utils/pagePermissions";
import { getInitials } from "@/components/Dashboard/profile/ProfileForm";

interface Props {
  user: ManagedUser | null;
  open: boolean;
  onClose: () => void;
  onEdit: (user: ManagedUser) => void;
}

export default function UserViewModal({ user, open, onClose, onEdit }: Props) {
  const currentUser = React.useMemo(() => getCurrentUser(), []);
  if (!open || !user) return null;

  const [imgError, setImgError] = useState(false);
  const isSuperAdminCard = user.role === "SUPERADMIN";
  const canEdit = !(currentUser?.role === "ADMIN" && isSuperAdminCard);

  useEffect(() => {
    setImgError(false);
  }, [user.avatar]);

  const initials = getInitials(user.fullName, user.email);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#E7E0D2] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0A0E1A] dark:text-white">
                User Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed profile & access permissions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* User Bio Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#080B11] border border-slate-200/80 dark:border-white/[0.06]">
            {user.avatar && !imgError ? (
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-[#E8C16D]">
                <Image
                  src={getAvatarUrl(user.avatar)}
                  alt={user.fullName}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => setImgError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center font-black text-lg bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#0A0E1A] dark:text-white truncate">
                  {user.fullName}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Username: @{user.username}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    user.isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {user.isActive ? "Active Account" : "Inactive Account"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Personal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#131926] shadow-xs">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold mb-1">
                <Mail size={13} className="text-[#B88728] dark:text-[#E8C16D]" /> Email Address
              </span>
              <p className="font-bold text-[#0A0E1A] dark:text-slate-200 break-all">{user.email}</p>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#131926] shadow-xs">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold mb-1">
                <Phone size={13} className="text-[#B88728] dark:text-[#E8C16D]" /> Mobile Number
              </span>
              <p className="font-bold text-[#0A0E1A] dark:text-slate-200">{user.phone || "—"}</p>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#131926] shadow-xs">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold mb-1">
                <Calendar size={13} className="text-[#B88728] dark:text-[#E8C16D]" /> Date of Birth
              </span>
              <p className="font-bold text-[#0A0E1A] dark:text-slate-200">
                {user.dob ? new Date(user.dob).toLocaleDateString() : "—"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#131926] shadow-xs">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold mb-1">
                <UserCheck size={13} className="text-[#B88728] dark:text-[#E8C16D]" /> Gender
              </span>
              <p className="font-bold text-[#0A0E1A] dark:text-slate-200">{user.gender || "—"}</p>
            </div>
          </div>

          {/* Departments & Companies */}
          <div className="space-y-3">
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Departments
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.departments && user.departments.length > 0 ? (
                  user.departments.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]"
                    >
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None</span>
                )}
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Companies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.companies && user.companies.length > 0 ? (
                  user.companies.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#E8C16D]/15 text-[#0A0E1A] dark:text-[#E8C16D] border border-[#E8C16D]/30"
                    >
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None</span>
                )}
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Allowed Pages / Access Rights
              </span>
              <div className="flex flex-wrap gap-1.5">
                {((user.allowedPages && user.allowedPages.length > 0)
                  ? user.allowedPages
                  : user.userMapping?.allowedPages || []
                ).length > 0 ? (
                  ((user.allowedPages && user.allowedPages.length > 0)
                    ? user.allowedPages
                    : user.userMapping?.allowedPages || []
                  ).map((p) => (
                    <span
                      key={p}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No Pages Granted</span>
                )}
              </div>
            </div>

            {/* SuperAdmin & Admin Association Hierarchy */}
            {(user.superAdmin || user.admin || user.userMapping?.superAdmin || user.userMapping?.admin || isSuperAdminCard) && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#080B11] border border-slate-200/80 dark:border-white/[0.06] space-y-2">
                <span className="block text-[11px] font-bold text-slate-400">
                  Account Hierarchy & Association:
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  {isSuperAdminCard ? (
                    <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      SuperAdmin: {user.fullName} ({user.email})
                    </span>
                  ) : (
                    <>
                      {(user.superAdmin || user.userMapping?.superAdmin || (user.userMapping?.admin?.role === "SUPERADMIN" ? user.userMapping.admin : null)) && (
                        <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                          SuperAdmin: {(user.superAdmin || user.userMapping?.superAdmin || user.userMapping?.admin)?.fullName} ({(user.superAdmin || user.userMapping?.superAdmin || user.userMapping?.admin)?.email})
                        </span>
                      )}
                      {(user.superAdmin || user.userMapping?.superAdmin) && (user.admin || user.userMapping?.admin) && (user.admin || user.userMapping?.admin)?.role !== "SUPERADMIN" && (
                        <span className="text-slate-400">➔</span>
                      )}
                      {(user.admin || user.userMapping?.admin) && (user.admin || user.userMapping?.admin)?.role !== "SUPERADMIN" && (
                        <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                          Admin: {(user.admin || user.userMapping?.admin)?.fullName} ({(user.admin || user.userMapping?.admin)?.email})
                        </span>
                      )}
                      <span className="text-slate-400">➔</span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white">
                        {user.fullName} ({user.role})
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 sm:p-6 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#080B11]">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 rounded-2xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer shadow-xs"
          >
            Close
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              className="min-h-[40px] px-6 rounded-2xl text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] cursor-pointer shadow-xs active:scale-[0.98] transition-all"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
