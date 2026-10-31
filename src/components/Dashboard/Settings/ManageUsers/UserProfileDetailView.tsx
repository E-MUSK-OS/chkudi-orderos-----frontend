"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  KeyRound,
  Building,
  Briefcase,
  Mail,
  Phone,
  Cake,
  Copy,
  RotateCcw,
  Save,
  Check,
  Shield,
  LayoutDashboard,
  Calendar,
  User as UserIcon,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import ResetPasswordModal from "./components/ResetPasswordModal";
import { useUser, useUpdateUser, useUpdateUserStatus, useDeleteUser } from "./hooks/useManageUsers";
import type { ManagedUser } from "./types/userManagement.types";
import { getAvatarUrl } from "./utils/avatarUrl";
import { getCurrentUser, usePagePermissions } from "@/utils/pagePermissions";
import {
  getDynamicPermissionDefinitions,
  type PagePermission,
} from "@/constants/navigation";

interface Props {
  userId: string;
}

const DEFAULT_PERMISSIONS = getDynamicPermissionDefinitions();

const PERMISSION_ID_TO_PAGE_SLUG: Record<string, string> = {
  dashboard: "dashboard",
  vms: "vms",
  "vms/scans": "vms/scans",
  "vms/scans/trackingid-scan": "vms/scans/trackingid-scan",
  "vms/operator": "vms/operator",
  "vms/admin": "vms/admin",
  "vms/admin/users": "vms/admin/users",
  "vms/admin/account": "vms/admin/account",
  "products/inventory": "products/inventory",
  "settings/manage-product": "settings/manage-product",
  "order-process": "order-process",
  "order-process/myntra/manage-tag-loop": "order-process/myntra/manage-tag-loop",
  "order-process/myntra/myntra-order": "order-process/myntra/myntra-order",
  "order-process/myntra/myntra-picklist": "order-process/myntra/myntra-picklist",
  "order-process/myntra/stock-analysis": "order-process/myntra/stock-analysis",
  "order-process/myntra/invoice-formatter": "order-process/myntra/invoice-formatter",
  "order-process/amazon/order-process": "order-process/amazon/order-process",
  "order-process/amazon/awb-scan": "order-process/amazon/awb-scan",
  "products-analytics/amazon": "products-analytics/amazon",
  "transaction/sales/po-based": "transaction/sales/po-based",
  "offline-sales/sales-challan": "offline-sales/sales-challan",
  "offline-sales/sales-invoice": "offline-sales/sales-invoice",
  "purchase/finish-goods/challan": "purchase/finish-goods/challan",
  "purchase/finish-goods/invoice": "purchase/finish-goods/invoice",
  "settings/webstore": "settings/webstore",
  "settings/labels/label-config": "settings/labels/label-config",
  "settings/labels/label-print": "settings/labels/label-print",
  "settings/manage-users": "settings/manage-users",
  // Legacy aliases
  vms_tracking: "vms/scans/trackingid-scan",
  products_profile: "settings/manage-product",
  order_process_amazon: "order-process/amazon/order-process",
  order_process_myntra: "order-process/myntra/myntra-picklist",
  warehouse_inventory: "products/inventory",
  sku_mapping: "settings/labels/label-print",
  barcode_labels: "settings/labels/label-config",
  settings_manage_users: "settings/manage-users",
  order_purchase_mat: "purchase/finish-goods/challan",
  challan_purchase_mat: "purchase/finish-goods/challan",
  invoice_purchase_mat: "purchase/finish-goods/invoice",
  debit_note_mat: "offline-sales/sales-invoice",
  order_desk_purchase_mat: "purchase/finish-goods/challan",
  discount_debit_note_mat: "offline-sales/sales-invoice",
  order_purchase_prod: "purchase/finish-goods/challan",
};

export default function UserProfileDetailView({ userId }: Props) {
  const router = useRouter();
  const { data: response, isLoading, refetch } = useUser(userId);
  const user = response?.data;

  const updateUserMutation = useUpdateUser();
  const updateStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  const [permissions, setPermissions] = useState<PagePermission[]>(DEFAULT_PERMISSIONS);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUser = React.useMemo(() => getCurrentUser(), []);
  const isSuperAdminUser = user?.role === "SUPERADMIN";
  const canEditOrDelete = !(currentUser?.role === "ADMIN" && isSuperAdminUser);
  const { canUpdate, canDelete } = usePagePermissions("settings/manage-users");
  const canEditUser = canEditOrDelete && canUpdate;
  const canDeleteUser = canEditOrDelete && canDelete;

  const resolvedSuperAdmin =
    user?.superAdmin ||
    user?.userMapping?.superAdmin ||
    (user?.userMapping?.admin?.role === "SUPERADMIN" ? user?.userMapping?.admin : null);

  const resolvedAdmin =
    user?.admin ||
    (user?.userMapping?.admin?.role !== "SUPERADMIN" ? user?.userMapping?.admin : null);

  // Initialize permissions from stored `rights` or fallback
  useEffect(() => {
    const dynamicDefs = getDynamicPermissionDefinitions();
    if (user?.rights) {
      try {
        const parsed = JSON.parse(user.rights);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = dynamicDefs.map((def) => {
            const found = parsed.find(
              (p: any) =>
                p &&
                (p.id === def.id ||
                  p.id === def.path.replace(/^\/dashboard\/?/, "") ||
                  p.path === def.path ||
                  PERMISSION_ID_TO_PAGE_SLUG[p.id] === def.id)
            );
            return found
              ? {
                  ...def,
                  create: typeof found.create === "boolean" ? found.create : def.create,
                  read: typeof found.read === "boolean" ? found.read : def.read,
                  update: typeof found.update === "boolean" ? found.update : def.update,
                  delete: typeof found.delete === "boolean" ? found.delete : def.delete,
                }
              : def;
          });
          setPermissions(merged);
          return;
        }
      } catch (e) {
        console.error("Failed to parse stored rights:", e);
      }
    }

    const resolvedAllowedPages =
      user?.allowedPages || user?.userMapping?.allowedPages;

    if (resolvedAllowedPages && resolvedAllowedPages.includes("ALL")) {
      setPermissions(
        dynamicDefs.map((def) => ({
          ...def,
          create: true,
          read: true,
          update: true,
          delete: true,
        }))
      );
      return;
    }

    if (resolvedAllowedPages && resolvedAllowedPages.length > 0) {
      setPermissions(
        dynamicDefs.map((def) => {
          const slug = PERMISSION_ID_TO_PAGE_SLUG[def.id] || def.id;
          const isGranted =
            resolvedAllowedPages.includes("ALL") ||
            resolvedAllowedPages.includes(slug) ||
            resolvedAllowedPages.includes(def.id) ||
            resolvedAllowedPages.some(
              (p) => def.id.startsWith(p) || p.startsWith(def.id) || def.path.endsWith(p)
            );
          return {
            ...def,
            create: isGranted,
            read: isGranted,
            update: isGranted,
            delete: isGranted,
          };
        })
      );
      return;
    }

    setPermissions(dynamicDefs);
  }, [user]);

  const handleToggleRow = (permId: string) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.id !== permId) return p;
        const allChecked = p.create && p.read && p.update && p.delete;
        const nextVal = !allChecked;
        return { ...p, create: nextVal, read: nextVal, update: nextVal, delete: nextVal };
      })
    );
  };

  const handleTogglePermission = (permId: string, action: "create" | "read" | "update" | "delete") => {
    setPermissions((prev) =>
      prev.map((p) => (p.id === permId ? { ...p, [action]: !p[action] } : p))
    );
  };

  const isAllCategoryGranted =
    permissions.length > 0 &&
    permissions.every((p) => p.create && p.read && p.update && p.delete);

  const handleToggleAllCategory = () => {
    const nextVal = !isAllCategoryGranted;
    setPermissions((prev) =>
      prev.map((p) => ({
        ...p,
        create: nextVal,
        read: nextVal,
        update: nextVal,
        delete: nextVal,
      }))
    );
  };

  const handleResetToDefault = () => {
    const dynamicDefs = getDynamicPermissionDefinitions();
    setPermissions(dynamicDefs);
    toast.info("Permissions reset to default.");
  };

  const handleSaveRights = async () => {
    if (!user) return;
    try {
      const isAllGranted = permissions.every((p) => p.create && p.read && p.update && p.delete);
      const newAllowedPages = isAllGranted
        ? ["ALL"]
        : Array.from(
            new Set(
              permissions
                .filter((p) => p.read || p.create || p.update || p.delete)
                .flatMap((p) => [
                  PERMISSION_ID_TO_PAGE_SLUG[p.id] || p.id,
                  p.id,
                  p.path ? p.path.replace(/^\/dashboard\/?/, "") : p.id,
                ])
            )
          );

      await updateUserMutation.mutateAsync({
        id: user.id,
        data: {
          rights: JSON.stringify(permissions),
          allowedPages: newAllowedPages,
        },
      });
      await refetch();
      toast.success("Rights saved successfully.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save rights.");
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    try {
      setIsDeleting(true);
      await deleteUserMutation.mutateAsync(user.id);
      setDeleteModalOpen(false);
      router.push("/dashboard/settings/manage-users/user-profile");
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full pb-10 animate-pulse">
        <div className="h-24 rounded-3xl bg-slate-100 dark:bg-[#0F1626]" />
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-[#0F1626]" />
        <div className="h-96 rounded-3xl bg-slate-100 dark:bg-[#0F1626]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center rounded-3xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-[#0F1626]">
        <h3 className="text-base font-bold text-red-600">User Not Found</h3>
        <button
          type="button"
          onClick={() => router.push("/dashboard/settings/manage-users/user-profile")}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#E8C16D] text-[#0A0E1A] cursor-pointer"
        >
          Back to User Profile
        </button>
      </div>
    );
  }

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const createdDateStr = user.createdAt
    ? format(parseISO(user.createdAt), "dd-MM-yyyy")
    : "—";

  const updatedDateStr = user.updatedAt
    ? format(parseISO(user.updatedAt), "dd-MM-yyyy")
    : "—";

  const birthDateStr = user.dob
    ? format(parseISO(user.dob), "dd-MM-yyyy")
    : "—";

  const creatorName = user.userMapping?.admin?.fullName || "System Admin";

  return (
    <div className="space-y-6 w-full pb-10 animate-in fade-in duration-200">
      {/* 1. Page Header Card matching OrderOS Amazon theme */}
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.push("/dashboard/settings/manage-users/user-profile")}
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
                Detailed view of user profile, company associations, and system rights matrix.
              </p>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2.5">
            {canEditUser && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/settings/manage-users/user-profile/edit-user/${user.id}`)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-bold text-slate-800 dark:text-white hover:border-[#E8C16D] transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <Edit2 size={14} className="text-[#B88728] dark:text-[#E8C16D]" />
                <span>Edit</span>
              </button>
            )}

            {canDeleteUser && (
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Profile Banner Card matching OrderOS Amazon theme */}
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* User Bio Left */}
          <div className="flex items-start gap-5">
            {/* Avatar with edit icon badge */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border-2 border-[#E8C16D]/60 shadow-md group">
              {user.avatar ? (
                <Image src={getAvatarUrl(user.avatar)} alt={user.fullName} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-2xl bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D]">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => router.push(`/dashboard/settings/manage-users/user-profile/edit-user/${user.id}`)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                title="Edit Photo"
              >
                <Edit2 size={11} />
              </button>
            </div>

            {/* Info details */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-[#0A0E1A] dark:text-white">
                  {user.fullName}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    user.isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-200 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {user.isActive ? "Active" : "Inactive"}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25">
                  {user.role}
                </span>
              </div>

              {/* Super Admin line */}
              {resolvedSuperAdmin && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  <Shield size={13} className="text-[#B88728] dark:text-[#E8C16D] shrink-0" />
                  <span>
                    Super Admin • {resolvedSuperAdmin.fullName} ({resolvedSuperAdmin.email})
                  </span>
                </div>
              )}

              {/* Managing Admin line */}
              {resolvedAdmin && user.role !== "ADMIN" && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                  <UserIcon size={13} className="text-[#B88728] dark:text-[#E8C16D] shrink-0" />
                  <span>
                    Admin • {resolvedAdmin.fullName} ({resolvedAdmin.email})
                  </span>
                </div>
              )}

              {/* Companies line */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                <Building size={13} className="text-[#B88728] dark:text-[#E8C16D] shrink-0" />
                <span>Companies • {user.companies?.length ? user.companies.join(", ") : "None Assigned"}</span>
              </div>

              {/* Departments line */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                <Briefcase size={13} className="text-[#B88728] dark:text-[#E8C16D] shrink-0" />
                <span>Departments • {user.departments?.length ? user.departments.join(", ") : "None Assigned"}</span>
              </div>

              {/* Contact row: Email, Phone, Birthdate */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs">
                {/* Email */}
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Mail size={13} className="text-[#B88728] dark:text-[#E8C16D]" />
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Email.</span>
                  <span className="font-bold">{user.email}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(user.email, "Email")}
                    className="text-slate-400 hover:text-[#0A0E1A] dark:hover:text-white cursor-pointer ml-0.5"
                    title="Copy Email"
                  >
                    <Copy size={12} />
                  </button>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Phone size={13} className="text-[#B88728] dark:text-[#E8C16D]" />
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Phone.</span>
                  <span className="font-bold">{user.phone ? `+91 ${user.phone}` : "—"}</span>
                  {user.phone && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(user.phone || "", "Phone")}
                      className="text-slate-400 hover:text-[#0A0E1A] dark:hover:text-white cursor-pointer ml-0.5"
                      title="Copy Phone"
                    >
                      <Copy size={12} />
                    </button>
                  )}
                </div>

                {/* Birthdate */}
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Cake size={13} className="text-[#B88728] dark:text-[#E8C16D]" />
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Birthdate.</span>
                  <span className="font-bold">{birthDateStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action: Reset Password Button */}
          <div className="shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="inline-flex items-center gap-2 h-10 sm:h-11 px-4 sm:px-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] hover:border-[#E8C16D] text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <KeyRound size={15} className="text-[#B88728] dark:text-[#E8C16D]" />
              <span>Reset Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Permission Management Section */}
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-7 shadow-sm space-y-5">
        {/* Permission Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shadow-2xs">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#0A0E1A] dark:text-white">
                Permission Management
              </h3>
            </div>

            {/* Category: Dashboard Pages */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#E8C16D] dark:text-[#0A0E1A] shadow-xs">
                <LayoutDashboard size={14} />
                <span>Dashboard Pages ({permissions.length})</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 self-end md:self-center">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-[#E8C16D] transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <RotateCcw size={14} className="text-[#B88728] dark:text-[#E8C16D]" />
              <span>Reset to Default</span>
            </button>

            {canEditUser && (
              <button
                type="button"
                onClick={handleSaveRights}
                disabled={updateUserMutation.isPending}
                className="inline-flex items-center gap-2 h-10 px-6 rounded-2xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-60"
              >
                <Save size={15} />
                <span>Save Rights</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Permission Rights Table matching OrderOS Amazon theme */}
        <div className="overflow-x-auto rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] shadow-2xs">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] text-[#E8C16D] font-bold uppercase text-[11px] sm:text-xs tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No.</th>
                <th className="py-3.5 px-4 min-w-[240px]">Page</th>
                <th className="py-3.5 px-4 text-center min-w-[120px]">
                  <button
                    type="button"
                    onClick={handleToggleAllCategory}
                    className="inline-flex items-center gap-1.5 cursor-pointer font-bold uppercase hover:text-white transition"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        isAllCategoryGranted
                          ? "bg-[#E8C16D] border-[#E8C16D] text-[#0A0E1A]"
                          : "border-slate-400 dark:border-white/[0.3] bg-transparent"
                      }`}
                    >
                      {isAllCategoryGranted && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span>All Rights</span>
                  </button>
                </th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">+ Create</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">👁 Read</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">✏ Update</th>
                <th className="py-3.5 px-4 text-center min-w-[110px]">🗑 Delete</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E7E0D2]/60 dark:divide-white/[0.06] bg-white dark:bg-[#0F1626]">
              {permissions.map((row, index) => {
                const isRowAllGranted = row.create && row.read && row.update && row.delete;

                return (
                  <tr
                    key={`${row.id}-${index}`}
                    className="hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    {/* No */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* Page Title & Description */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#0A0E1A] dark:text-white text-xs sm:text-sm">
                        {row.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {row.description}
                      </div>
                    </td>

                    {/* All Rights Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRow(row.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isRowAllGranted
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            isRowAllGranted
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-400 dark:border-white/[0.2] bg-transparent"
                          }`}
                        >
                          {isRowAllGranted && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span>{isRowAllGranted ? "Granted" : "Denied"}</span>
                      </button>
                    </td>

                    {/* Create */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(row.id, "create")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          row.create
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            row.create
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-400 dark:border-white/[0.2] bg-transparent"
                          }`}
                        >
                          {row.create && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span>{row.create ? "Granted" : "Denied"}</span>
                      </button>
                    </td>

                    {/* Read */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(row.id, "read")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          row.read
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            row.read
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-400 dark:border-white/[0.2] bg-transparent"
                          }`}
                        >
                          {row.read && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span>{row.read ? "Granted" : "Denied"}</span>
                      </button>
                    </td>

                    {/* Update */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(row.id, "update")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          row.update
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            row.update
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-400 dark:border-white/[0.2] bg-transparent"
                          }`}
                        >
                          {row.update && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span>{row.update ? "Granted" : "Denied"}</span>
                      </button>
                    </td>

                    {/* Delete */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(row.id, "delete")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          row.delete
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            row.delete
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-400 dark:border-white/[0.2] bg-transparent"
                          }`}
                        >
                          {row.delete && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span>{row.delete ? "Granted" : "Denied"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bottom Metadata Footer Bar matching OrderOS Amazon theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
        {/* Creation Date */}
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xs">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              Creation Date
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-[#0A0E1A] dark:text-white truncate">
              {createdDateStr}
            </p>
          </div>
        </div>

        {/* Created By */}
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xs">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
            <UserIcon size={18} />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              Created By
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-[#0A0E1A] dark:text-white truncate">
              {creatorName}
            </p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xs">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              Last Updated
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-[#0A0E1A] dark:text-white truncate">
              {updatedDateStr}
            </p>
          </div>
        </div>

        {/* Last Updated By */}
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xs">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            <UserIcon size={18} />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              Last Updated By
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-[#0A0E1A] dark:text-white truncate">
              {user.fullName}
            </p>
          </div>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-6 py-5 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 shadow-xs">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#E8C16D]">
                    Delete User
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-300">
                    Are you sure you want to delete this user?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer shrink-0"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                This action will deactivate <span className="font-bold text-[#0A0E1A] dark:text-white">{user.fullName}</span> and remove their active system permissions.
              </p>

              <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#080B11] p-3.5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">User:</span>
                  <span className="font-bold text-[#0A0E1A] dark:text-white">{user.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Email:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Role:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">{user.role}</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  <span>{isDeleting ? "Deleting..." : "Delete User"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      <ResetPasswordModal
        userId={user.id}
        userName={user.fullName}
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
      />
    </div>
  );
}
