"use client";

import React from "react";
import Image from "next/image";
import { Mail, Phone, Eye, Edit2, Trash2 } from "lucide-react";
import type { ManagedUser } from "../types/userManagement.types";
import { getAvatarUrl } from "../utils/avatarUrl";
import { getCurrentUser, usePagePermissions } from "@/utils/pagePermissions";

interface Props {
  user: ManagedUser;
  onView: (user: ManagedUser) => void;
  onEdit: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
  onDelete?: (user: ManagedUser) => void;
}

export default function UserCard({ user, onView, onEdit, onToggleStatus, onDelete }: Props) {
  const currentUser = React.useMemo(() => getCurrentUser(), []);
  const { canUpdate, canDelete } = usePagePermissions("settings/manage-users");
  const isSuperAdminCard = user.role === "SUPERADMIN";
  const canModify = !(currentUser?.role === "ADMIN" && isSuperAdminCard);
  // Initials fallback
  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  // Role badge colors
  const roleBadge = {
    SUPERADMIN: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    ADMIN: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    USER: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
  }[user.role] || "bg-slate-500/15 text-slate-400 border-slate-500/30";

  // Rights/Department tags beneath name
  const effectivePages =
    user.allowedPages && user.allowedPages.length > 0
      ? user.allowedPages
      : user.userMapping?.allowedPages || [];

  const rawTags =
    effectivePages.includes("ALL")
      ? ["ALL"]
      : user.departments && user.departments.length > 0
      ? user.departments
      : effectivePages.length > 0
      ? effectivePages
      : ["No Rights Assigned"];

  // Filter out any tag that duplicates the user's role badge (e.g. "ADMIN" or "USER" or "SUPERADMIN")
  const displayTags = rawTags.filter(
    (tag) => tag.trim().toUpperCase() !== user.role.toUpperCase()
  );

  return (
    <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-4 sm:p-5 shadow-xs hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/50 transition-all duration-200 group">
      <div>
        {/* Top Header: Avatar + Name + Role Badge */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            {user.avatar ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04]">
                <Image
                  src={getAvatarUrl(user.avatar)}
                  alt={user.fullName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center font-black text-sm bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0A0E1A] dark:text-white truncate">
                {user.fullName}
              </h3>

              {/* Tag row beneath name */}
              {displayTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {displayTags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08]"
                    >
                      {tag}
                    </span>
                  ))}
                  {displayTags.length > 2 && (
                    <span className="text-[10px] font-bold text-slate-400 self-center">
                      +{displayTags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Role Pill */}
          <span
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${roleBadge}`}
          >
            {user.role}
          </span>
        </div>

        {/* Middle Info: Username (Email) & Mobile No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3 border-y border-[#E7E0D2]/60 dark:border-white/[0.06] my-3">
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
              User Name (Email-Id)
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0A0E1A] dark:text-slate-200 truncate">
              <Mail size={12} className="shrink-0 text-slate-400" />
              <span className="truncate" title={user.email}>
                {user.email}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
              Mobile No
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0A0E1A] dark:text-slate-200">
              <Phone size={12} className="shrink-0 text-slate-400" />
              <span>{user.phone || "—"}</span>
            </div>
          </div>
        </div>

        {/* Association Badge: Managed by Super Admin / Admin */}
        {!isSuperAdminCard && (user.superAdmin || user.admin || user.userMapping?.superAdmin || user.userMapping?.admin) && (
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 truncate flex items-center gap-1">
            <span className="text-slate-400 font-medium">
              {user.role === "ADMIN"
                ? "Super Admin:"
                : (user.admin || user.userMapping?.admin) && (user.admin || user.userMapping?.admin)?.role !== "SUPERADMIN"
                ? "Admin:"
                : "Super Admin:"}
            </span>
            <span className="text-[#0A0E1A] dark:text-slate-200 font-bold truncate">
              {user.superAdmin?.fullName ||
                user.userMapping?.superAdmin?.fullName ||
                user.admin?.fullName ||
                user.userMapping?.admin?.fullName}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions: Active Badge on left, View/Edit buttons on right */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          disabled={!canModify}
          onClick={() => canModify && onToggleStatus(user)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
            canModify ? "cursor-pointer" : "cursor-default opacity-85"
          } ${
            user.isActive
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
          title={canModify ? "Toggle User Status" : "Super Admin status cannot be toggled by Admin"}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              user.isActive ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
          <span>{user.isActive ? "Active" : "Inactive"}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView(user)}
            className="h-8 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#131926] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors hover:border-[#E8C16D]"
          >
            <Eye size={13} />
            <span>View</span>
          </button>

          {canModify && canUpdate && (
            <button
              type="button"
              onClick={() => onEdit(user)}
              className="h-8 px-3 rounded-xl text-xs font-bold border border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>
          )}

          {canModify && canDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(user)}
              className="h-8 w-8 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
              title="Delete User Permanently"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
