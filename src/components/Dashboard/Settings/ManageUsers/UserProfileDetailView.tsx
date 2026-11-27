"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { coordinateTableWheelScroll } from "@/utils/tableScrollCoordinator";
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
  Eye,
  Plus,
  Search,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import Pagination from "@/components/ui/Pagination";
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
  "inventory/material": "inventory/material",
  "inventory/product": "inventory/product",
  "products/inventory": "inventory/product",
  "settings/manage-product": "settings/manage-product",
  "order-process": "order-process",
  "order-process/myntra/manage-tag-loop": "order-process/myntra/manage-tag-loop",
  "order-process/myntra/myntra-order": "order-process/myntra/myntra-order",
  "order-process/myntra/myntra-picklist": "order-process/myntra/myntra-picklist",
  "order-process/myntra/stock-analysis": "order-process/myntra/stock-analysis",
  "order-process/myntra/invoice-formatter": "order-process/myntra/invoice-formatter",
  "order-process/amazon/order-process": "order-process/amazon/order-process",
  "order-process/amazon/awb-scan": "order-process/amazon/awb-scan",
  "order-process/flipkart/order-process": "order-process/flipkart/order-process",
  "products-analytics/amazon": "products-analytics/amazon",
  "transaction/sales/po-based": "transaction/sales/po-based",
  "sales/product-gallery": "sales/product-gallery",
  "sales/sales-challan": "sales/sales-challan",
  "sales/sales-invoice": "sales/sales-invoice",
  "purchase/finish-goods/challan": "purchase/finish-goods/challan",
  "purchase/finish-goods/invoice": "purchase/finish-goods/invoice",
  "settings/webstore": "settings/webstore",
  "settings/labels/label-config": "settings/labels/label-config",
  "settings/labels/label-print": "settings/labels/label-print",
  "settings/manage-users": "settings/manage-users",
  "/dashboard/settings/manage-users/user-profile": "settings/manage-users",
  "/dashboard/settings/manage-users/user-profile/create-user": "settings/manage-users",
  "settings/manage-users/user-profile": "settings/manage-users",
  "settings/manage-users/user-profile/create-user": "settings/manage-users",
  "manage-users": "settings/manage-users",
  // Legacy aliases
  vms_tracking: "vms/scans/trackingid-scan",
  products_profile: "settings/manage-product",
  order_process_amazon: "order-process/amazon/order-process",
  order_process_flipkart: "order-process/flipkart/order-process",
  order_process_myntra: "order-process/myntra/myntra-picklist",
  warehouse_inventory: "inventory/product",
  sku_mapping: "settings/labels/label-print",
  barcode_labels: "settings/labels/label-config",
  settings_manage_users: "settings/manage-users",
  order_purchase_mat: "purchase/finish-goods/challan",
  challan_purchase_mat: "purchase/finish-goods/challan",
  invoice_purchase_mat: "purchase/finish-goods/invoice",
  debit_note_mat: "sales/sales-invoice",
  order_desk_purchase_mat: "purchase/finish-goods/challan",
  discount_debit_note_mat: "sales/sales-invoice",
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
  const canEditOrDelete = isSuperAdminUser ? currentUser?.role === "SUPERADMIN" : true;
  const { canUpdate, canDelete } = usePagePermissions("settings/manage-users");
  const canEditUser = canEditOrDelete && canUpdate;
  const canDeleteUser = canEditOrDelete && canDelete && user?.id !== currentUser?.id;

  const resolvedSuperAdmin =
    user?.superAdmin ||
    user?.userMapping?.superAdmin ||
    (user?.userMapping?.admin?.role === "SUPERADMIN" ? user?.userMapping?.admin : null);

  const resolvedAdmin =
    user?.admin ||
    (user?.userMapping?.admin?.role !== "SUPERADMIN" ? user?.userMapping?.admin : null);

  // Pagination & search state for Permission Management
  const [permSearch, setPermSearch] = useState("");
  const [permPage, setPermPage] = useState(1);
  const [permPageSize, setPermPageSize] = useState(10);

  const filteredPermissions = React.useMemo(() => {
    const q = permSearch.toLowerCase().trim();
    if (!q) return permissions;
    return permissions.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.path?.toLowerCase().includes(q)
    );
  }, [permissions, permSearch]);

  useEffect(() => {
    setPermPage(1);
  }, [permSearch]);

  const totalPermRecords = filteredPermissions.length;
  const totalPermPages = Math.ceil(totalPermRecords / permPageSize) || 1;
  const paginatedPermissions = filteredPermissions.slice(
    (permPage - 1) * permPageSize,
    permPage * permPageSize
  );

  // Scroll & Height coordinator refs & state
  const containerRef = useRef<HTMLDivElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Calculate available height inside the scroll container so that when scrolled
  // past the Header Card & Metadata Bar on desktop (>= 1024px), the lower section
  // (Profile Banner + Permissions Card) fills the visible viewport exactly,
  // stopping at Profile Banner as shown in the user's reference image.
  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024 || isLoading || !user) {
      setTargetHeight(null);
      setTableMaxHeight(null);
      return;
    }
    if (!containerRef.current) return;
    const scrollContainer = containerRef.current.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const style = window.getComputedStyle(scrollContainer);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    const available = scrollContainer.clientHeight - paddingTop - paddingBottom;
    if (available > 320) {
      setTargetHeight(Math.floor(available));

      const bannerHeight = bannerRef.current?.offsetHeight || 160;
      const gap = 24; // gap-4 sm:gap-6
      const maxForPerms = available - bannerHeight - gap;
      if (maxForPerms > 160) {
        setTableMaxHeight(Math.floor(maxForPerms));
      }
    }
  }, [isLoading, user]);

  useEffect(() => {
    calculateHeight();

    const timer = setTimeout(calculateHeight, 100);
    const timer2 = setTimeout(calculateHeight, 300);

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    window.addEventListener("resize", calculateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });
      if (scrollContainer) resizeObserver.observe(scrollContainer);
      if (bannerRef.current) resizeObserver.observe(bannerRef.current);
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener("resize", calculateHeight);
      resizeObserver?.disconnect();
    };
  }, [calculateHeight, isLoading, user]);

  useEffect(() => {
    calculateHeight();
  }, [paginatedPermissions.length, permPageSize, calculateHeight]);

  // Reset scroll to top on initial load
  useEffect(() => {
    if (!isLoading && user) {
      const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    }
  }, [isLoading, user]);

  // Seamless scroll coordinator:
  // 1. When scrolling down, outer page scrolls until Header Card + Metadata are hidden and stops at the fixed position (Profile Banner + Permissions).
  // 2. Once at the fixed position, scrolling down over the table scrolls the table rows internally.
  // 3. When scrolling up, table scrolls up to the first row; then scrolling up reveals Header Card + Metadata.
  useEffect(() => {
    if (isLoading || !user) return;

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      coordinateTableWheelScroll({
        e,
        scrollContainer,
        tableContainer: tableContainerRef.current,
      });
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, [isLoading, user]);

  useEffect(() => {
    tableContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [permPage, permPageSize]);

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
          const isManageUsers =
            def.id.includes("manage-users") ||
            def.id.includes("user-profile") ||
            (def.path && def.path.toLowerCase().includes("manage users"));
          const isGranted =
            resolvedAllowedPages.includes("ALL") ||
            resolvedAllowedPages.includes(slug) ||
            resolvedAllowedPages.includes(def.id) ||
            resolvedAllowedPages.some(
              (p) => def.id.startsWith(p) || p.startsWith(def.id) || def.path.endsWith(p)
            );
          return {
            ...def,
            create: isManageUsers && !resolvedAllowedPages.includes("ALL") ? false : isGranted,
            read: isGranted,
            update: isManageUsers && !resolvedAllowedPages.includes("ALL") ? false : isGranted,
            delete: isManageUsers && !resolvedAllowedPages.includes("ALL") ? false : isGranted,
          };
        })
      );
      return;
    }

    setPermissions(dynamicDefs);
  }, [user]);

  const handleToggleRow = (permId: string) => {
    if (!canEditUser) return;
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
    if (!canEditUser) return;
    setPermissions((prev) =>
      prev.map((p) => (p.id === permId ? { ...p, [action]: !p[action] } : p))
    );
  };

  const isAllCategoryGranted =
    permissions.length > 0 &&
    permissions.every((p) => p.create && p.read && p.update && p.delete);

  const handleToggleAllCategory = () => {
    if (!canEditUser) return;
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
    if (!canEditUser) return;
    const dynamicDefs = getDynamicPermissionDefinitions();
    setPermissions(dynamicDefs);
    toast.info("Permissions reset to default.");
  };

  const handleSaveRights = async () => {
    if (!user || !canEditUser) return;
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

  const initials = user?.fullName
    ? user.fullName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "U";

  const createdDateStr = user?.createdAt
    ? format(parseISO(user.createdAt), "dd-MM-yyyy")
    : "—";

  const updatedDateStr = user?.updatedAt
    ? format(parseISO(user.updatedAt), "dd-MM-yyyy")
    : "—";

  const birthDateStr = user?.dob
    ? format(parseISO(user.dob), "dd-MM-yyyy")
    : "—";

  const creatorName = user?.userMapping?.admin?.fullName || "System Admin";

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 sm:gap-6 w-full font-sans animate-in fade-in duration-200"
    >
      {isLoading ? (
        <div className="space-y-6 w-full pb-10 animate-pulse">
          <div className="h-24 rounded-3xl bg-slate-100 dark:bg-[#0F1626]" />
          <div className="h-44 rounded-3xl bg-slate-100 dark:bg-[#0F1626]" />
          <div className="h-96 rounded-3xl bg-slate-100 dark:bg-[#0F1626]" />
        </div>
      ) : !user ? (
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
      ) : (
        <>
          {/* 1. Page Header Card & Metadata Bar (scrolls off when scrolling down) */}
          <div ref={headerCardRef} className="shrink-0 flex flex-col gap-4 sm:gap-6">
            <div className="w-full rounded-2xl sm:rounded-3xl border border-[#EAE4D8] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 sm:px-7 py-4 sm:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/settings/manage-users/user-profile")}
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
                    Detailed view of user profile, company associations, and system rights matrix.
                  </p>
                </div>
              </div>

              {/* Top Right Actions */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                {canEditUser && (
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/settings/manage-users/user-profile/edit-user/${user.id}`)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-[#E8C16D] text-slate-800 dark:text-white px-5 sm:px-6 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer active:scale-[0.97]"
                  >
                    <Edit2 size={15} className="text-[#B88728] dark:text-[#E8C16D]" />
                    <span>Edit</span>
                  </button>
                )}

                {canDeleteUser && (
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all shadow-xs active:scale-[0.97] cursor-pointer px-5 sm:px-6"
                  >
                    <Trash2 size={15} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metadata Footer Bar matching OrderOS Amazon theme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
          </div>

          {/* Lower Section (Profile Banner + Permission Management) - stops scrolling from Profile Banner as shown in image */}
          <div
            className="flex flex-col gap-4 sm:gap-6 min-h-0"
            style={{
              maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
            }}
          >
            {/* 2. Top Profile Banner Card matching OrderOS Amazon theme */}
            <div
              ref={bannerRef}
              className="shrink-0 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-7 shadow-sm"
            >
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
                    {canEditUser && (
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/settings/manage-users/user-profile/edit-user/${user.id}`)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                        title="Edit Photo"
                      >
                        <Edit2 size={11} />
                      </button>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-[#0A0E1A] dark:text-white">
                        {user.fullName}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${user.isActive
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

                {/* Right Button: Reset Password */}
                {canEditUser && (
                  <div className="shrink-0 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={() => setResetModalOpen(true)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-[#0A0E1A] dark:text-white px-5 sm:px-6 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer active:scale-[0.97]"
                    >
                      <KeyRound size={15} className="text-[#B88728] dark:text-[#E8C16D]" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Permission Management Card (fills remaining height) */}
            <div
              className="flex flex-col min-h-0 flex-1"
              style={{
                maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
              }}
            >
              <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm flex flex-col min-h-0 max-h-full overflow-hidden">
                {/* Header with Title & Action Buttons */}
                <div className="p-4 sm:p-6 pb-4 shrink-0 border-b border-[#E7E0D2]/60 dark:border-white/[0.08]">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shadow-2xs shrink-0">
                          <Shield className="h-4 w-4" />
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-[#0A0E1A] dark:text-white whitespace-nowrap">
                          Permission Management
                        </h3>
                      </div>

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#E8C16D] dark:text-[#0A0E1A] shadow-xs shrink-0 whitespace-nowrap">
                        <LayoutDashboard size={14} />
                        <span>
                          Dashboard Pages (
                          {permSearch.trim()
                            ? `${filteredPermissions.length} / ${permissions.length}`
                            : permissions.length}
                          )
                        </span>
                      </div>
                    </div>

                    {/* Right Side: Searchbar -> Reset to Default -> Save Rights */}
                    <div className="flex flex-wrap items-center gap-2.5 xl:justify-end">
                      <div className="relative w-full sm:w-64 shrink-0">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                        <input
                          type="text"
                          value={permSearch}
                          onChange={(e) => setPermSearch(e.target.value)}
                          placeholder="Search pages..."
                          className="w-full h-9 sm:h-10 pl-10 pr-8 text-xs font-medium rounded-full border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/20 focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#F5C451] dark:focus:ring-[#F5C451]/20 transition-all shadow-xs"
                        />
                        {permSearch && (
                          <button
                            type="button"
                            onClick={() => setPermSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Clear search"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        {canEditUser && (
                          <button
                            type="button"
                            onClick={handleResetToDefault}
                            className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-[#E8C16D] transition-all shadow-xs cursor-pointer active:scale-[0.98] whitespace-nowrap"
                          >
                            <RotateCcw size={14} className="text-[#B88728] dark:text-[#E8C16D]" />
                            <span>Reset to Default</span>
                          </button>
                        )}

                        {canEditUser && (
                          <button
                            type="button"
                            onClick={handleSaveRights}
                            disabled={updateUserMutation.isPending}
                            className="inline-flex items-center gap-2 h-10 px-6 rounded-2xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-60 whitespace-nowrap"
                          >
                            <Save size={15} />
                            <span>Save Rights</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Permission Rights Table matching OrderOS Amazon theme */}
                <div
                  ref={tableContainerRef}
                  className="overflow-x-auto min-h-0 sm:overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-[#0F1626]"
                  style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
                >
                  <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
                    <thead className="lg:sticky lg:top-0 z-10 border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#0F1626] text-[#6A4D1D] dark:text-[#E8C16D] font-bold uppercase text-[11px] sm:text-xs tracking-wider shadow-xs">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">No.</th>
                        <th className="py-3.5 px-4 min-w-[240px]">Page</th>
                        <th className="py-3.5 px-4 text-center min-w-[120px]">
                          <button
                            type="button"
                            disabled={!canEditUser}
                            onClick={handleToggleAllCategory}
                            className={`inline-flex items-center gap-1.5 font-bold uppercase transition ${canEditUser ? "cursor-pointer hover:opacity-80" : "cursor-default opacity-80"
                              }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isAllCategoryGranted
                                ? "bg-[#E8C16D] border-[#E8C16D] text-[#0A0E1A]"
                                : "border-slate-400 dark:border-white/[0.3] bg-transparent"
                                }`}
                            >
                              {isAllCategoryGranted && <Check size={10} strokeWidth={3} />}
                            </div>
                            <span>All Rights</span>
                          </button>
                        </th>
                        <th className="py-3.5 px-4 text-center min-w-[110px]">
                          <span className="inline-flex items-center gap-1 justify-center">
                            <Plus size={12} className="stroke-[2.5]" />
                            <span>Create</span>
                          </span>
                        </th>
                        <th className="py-3.5 px-4 text-center min-w-[110px]">
                          <span className="inline-flex items-center gap-1 justify-center">
                            <Eye size={12} />
                            <span>Read</span>
                          </span>
                        </th>
                        <th className="py-3.5 px-4 text-center min-w-[110px]">
                          <span className="inline-flex items-center gap-1 justify-center">
                            <Edit2 size={12} />
                            <span>Update</span>
                          </span>
                        </th>
                        <th className="py-3.5 px-4 text-center min-w-[110px]">
                          <span className="inline-flex items-center gap-1 justify-center">
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </span>
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#E7E0D2]/60 dark:divide-white/[0.06] bg-white dark:bg-[#0F1626]">
                      {paginatedPermissions.map((row, index) => {
                        const rowNumber = (permPage - 1) * permPageSize + index + 1;
                        const isRowAllGranted = row.create && row.read && row.update && row.delete;

                        return (
                          <tr
                            key={`${row.id}-${index}`}
                            className="hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.04] transition-colors"
                          >
                            {/* No */}
                            <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                              {rowNumber}
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
                                disabled={!canEditUser}
                                onClick={() => handleToggleRow(row.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${canEditUser ? "cursor-pointer" : "cursor-default opacity-85"
                                  } ${isRowAllGranted
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                    : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                                  }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isRowAllGranted
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
                                disabled={!canEditUser}
                                onClick={() => handleTogglePermission(row.id, "create")}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${canEditUser ? "cursor-pointer" : "cursor-default opacity-85"
                                  } ${row.create
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                    : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                                  }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${row.create
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
                                disabled={!canEditUser}
                                onClick={() => handleTogglePermission(row.id, "read")}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${canEditUser ? "cursor-pointer" : "cursor-default opacity-85"
                                  } ${row.read
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                    : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                                  }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${row.read
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
                                disabled={!canEditUser}
                                onClick={() => handleTogglePermission(row.id, "update")}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${canEditUser ? "cursor-pointer" : "cursor-default opacity-85"
                                  } ${row.update
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                    : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                                  }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${row.update
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
                                disabled={!canEditUser}
                                onClick={() => handleTogglePermission(row.id, "delete")}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${canEditUser ? "cursor-pointer" : "cursor-default opacity-85"
                                  } ${row.delete
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                    : "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200/60 dark:hover:bg-white/[0.08]"
                                  }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${row.delete
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

                {/* Bottom Global Pagination */}
                <Pagination
                  page={permPage}
                  totalPages={totalPermPages}
                  totalRecords={totalPermRecords}
                  limit={permPageSize}
                  pageSize={permPageSize}
                  itemName="pages"
                  variant="dark"
                  className="shrink-0 border-t border-[#F1E8D0] dark:border-white/[0.08] rounded-b-2xl sm:rounded-b-3xl bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
                  onPageChange={setPermPage}
                  onPageSizeChange={(size) => {
                    setPermPageSize(size);
                    setPermPage(1);
                  }}
                />
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
        </>
      )}
    </div>
  );
}
