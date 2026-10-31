"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  ShieldCheck,
  Shield,
  Check,
  Briefcase,
  LayoutDashboard,
  RotateCcw,
  CheckCheck,
  Ban,
  Crop,
  Eye,
  Sliders,
} from "lucide-react";
import ProfileImageCropModal from "./ProfileImageCropModal";
import { userManagementService } from "../services/userManagement.service";
import { toast } from "sonner";
import { getAvatarUrl } from "../utils/avatarUrl";
import { getCurrentUser, type UserPermissions } from "@/utils/pagePermissions";

export interface PagePermission {
  id: string;
  name: string;
  description: string;
  category: "dashboard";
  path: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export const DEFAULT_PERMISSIONS: PagePermission[] = [
  // 1. Dashboard Root
  {
    id: "dashboard",
    name: "Dashboard (Home)",
    description: "Main OrderOS KPI metrics and executive overview",
    category: "dashboard",
    path: "/dashboard",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  // 2. VMS Module
  {
    id: "vms",
    name: "VMS - Dashboard",
    description: "Video Management System camera status & analytics",
    category: "dashboard",
    path: "/dashboard/vms",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "vms/scans",
    name: "VMS - Scans (VMS Scan)",
    description: "Real-time packing recording & scan desk",
    category: "dashboard",
    path: "/dashboard/vms/scans/vms",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "vms/scans/trackingid-scan",
    name: "VMS - Tracking ID Scan",
    description: "Verify and scan parcel tracking barcodes",
    category: "dashboard",
    path: "/dashboard/vms/scans/trackingid-scan",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "vms/operator",
    name: "VMS - Operator",
    description: "Operator recording station & packing verification",
    category: "dashboard",
    path: "/dashboard/vms/operator/vms",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "vms/admin",
    name: "VMS - Admin",
    description: "VMS administrative settings & system control",
    category: "dashboard",
    path: "/dashboard/vms/admin",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "vms/admin/users",
    name: "VMS - Admin: Users",
    description: "Manage VMS station operator accounts & credentials",
    category: "dashboard",
    path: "/dashboard/vms/admin/users",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "vms/admin/account",
    name: "VMS - Admin: Accounts Name",
    description: "Manage channel account mapping & nicknames",
    category: "dashboard",
    path: "/dashboard/vms/admin/account",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  // 3. Products & Inventory
  {
    id: "products/inventory",
    name: "Products - Inventory",
    description: "Warehouse stock levels, bin locations & quantity ledger",
    category: "dashboard",
    path: "/dashboard/products/inventory",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "settings/manage-product",
    name: "Products - Product Profile",
    description: "Master product catalog, SKU grouping & variants",
    category: "dashboard",
    path: "/dashboard/settings/manage-product/product-profile",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  // 4. Order Process
  {
    id: "order-process",
    name: "Order Process - Dashboard",
    description: "Centralized order processing dashboard",
    category: "dashboard",
    path: "/dashboard/order-process",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "order-process/myntra/manage-tag-loop",
    name: "Myntra - Manage Tag Loop",
    description: "Tag loops and security seal tracking for Myntra",
    category: "dashboard",
    path: "/dashboard/order-process/myntra/manage-tag-loop",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "order-process/myntra/myntra-order",
    name: "Myntra - Myntra Order",
    description: "Myntra dispatch orders and customer shipments",
    category: "dashboard",
    path: "/dashboard/order-process/myntra/myntra-order",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "order-process/myntra/myntra-picklist",
    name: "Myntra - Myntra Picklist",
    description: "Generate, verify, and confirm warehouse picklists",
    category: "dashboard",
    path: "/dashboard/order-process/myntra/myntra-picklist",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "order-process/myntra/stock-analysis",
    name: "Myntra - Stock Analysis",
    description: "Stock reconciliation & inventory analysis",
    category: "dashboard",
    path: "/dashboard/order-process/myntra/stock-analysis",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "order-process/myntra/invoice-formatter",
    name: "Myntra - Invoice Formatter",
    description: "Format and standardize Myntra customer invoices",
    category: "dashboard",
    path: "/dashboard/order-process/myntra/invoice-formatter",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "order-process/amazon/order-process",
    name: "Amazon - Order Process",
    description: "Amazon batches, shipping labels & dispatch processing",
    category: "dashboard",
    path: "/dashboard/order-process/amazon/order-process",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "order-process/amazon/awb-scan",
    name: "Amazon - AWB Scan",
    description: "Scan and verify Amazon shipping AWB barcodes",
    category: "dashboard",
    path: "/dashboard/order-process/amazon/awb-scan",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  // 5. Products Analytics
  {
    id: "products-analytics/amazon",
    name: "Products Analytics - Amazon",
    description: "Amazon sales velocity, performance & revenue insights",
    category: "dashboard",
    path: "/dashboard/products-analytics/amazon",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  // 6. Transaction
  {
    id: "transaction/sales/po-based",
    name: "Transaction - Sales PO Based",
    description: "Upload and process requested buyer purchase orders",
    category: "dashboard",
    path: "/dashboard/transaction/sales/po-based/upload-requested-po",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  // 7. Offline Sales
  {
    id: "offline-sales/sales-challan",
    name: "Offline Sales - Sales Challan",
    description: "Generate and manage offline delivery challans",
    category: "dashboard",
    path: "/dashboard/offline-sales/sales-challan",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "offline-sales/sales-invoice",
    name: "Offline Sales - Sales Invoice",
    description: "Create and export GST-compliant sales invoices",
    category: "dashboard",
    path: "/dashboard/offline-sales/sales-invoice",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  // 8. Purchase
  {
    id: "purchase/finish-goods/challan",
    name: "Purchase - Purchase Challan",
    description: "Inward finished goods delivery challans",
    category: "dashboard",
    path: "/dashboard/purchase/finish-goods/challan",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "purchase/finish-goods/invoice",
    name: "Purchase - Purchase Invoice",
    description: "Inward supplier purchase invoices and billing",
    category: "dashboard",
    path: "/dashboard/purchase/finish-goods/invoice",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  // 9. Settings
  {
    id: "settings/webstore",
    name: "Settings - Webstore",
    description: "Webstore credentials, API keys & channel sync",
    category: "dashboard",
    path: "/dashboard/settings/webstore",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "settings/labels/label-config",
    name: "Settings - Label Config",
    description: "Configure barcode template dimensions and printer setup",
    category: "dashboard",
    path: "/dashboard/settings/labels/label-config",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "settings/labels/label-print",
    name: "Settings - Label Print",
    description: "Thermal & laser barcode label printing station",
    category: "dashboard",
    path: "/dashboard/settings/labels/label-print",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
  {
    id: "settings/manage-users",
    name: "Settings - Manage Users",
    description: "Manage user profiles, credentials & permission matrix",
    category: "dashboard",
    path: "/dashboard/settings/manage-users/user-profile",
    create: true,
    read: true,
    update: true,
    delete: true,
  },
];

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

interface Props {
  avatar?: string;
  onAvatarChange: (url: string) => void;
  allowedPages: string[];
  onAllowedPagesChange: (pages: string[]) => void;
  rights?: string;
  onRightsChange?: (rights: string) => void;
  error?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  phone?: string;
}

export default function UserPhotoTab({
  avatar,
  onAvatarChange,
  allowedPages,
  onAllowedPagesChange,
  rights,
  onRightsChange,
  error,
  firstName,
  middleName,
  lastName,
  email,
  role = "USER",
  phone,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<UserPermissions | null>(null);

  // Full name & Initials for profile preview
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "User Name";
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  // Initialize permissions
  const [permissions, setPermissions] = useState<PagePermission[]>(() => {
    if (rights) {
      try {
        const parsed = JSON.parse(rights);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return DEFAULT_PERMISSIONS.map((def) => {
            const found = parsed.find((p: any) => p.id === def.id);
            return found ? { ...def, ...found } : def;
          });
        }
      } catch (e) {
        console.error("Failed to parse stored rights:", e);
      }
    }
    if (allowedPages && allowedPages.includes("ALL")) {
      return DEFAULT_PERMISSIONS.map((def) => ({
        ...def,
        create: true,
        read: true,
        update: true,
        delete: true,
      }));
    }
    if (allowedPages && allowedPages.length > 0) {
      return DEFAULT_PERMISSIONS.map((def) => {
        const slug = PERMISSION_ID_TO_PAGE_SLUG[def.id];
        const isGranted = slug ? allowedPages.includes(slug) : false;
        return {
          ...def,
          create: isGranted,
          read: isGranted,
          update: isGranted,
          delete: isGranted,
        };
      });
    }
    return DEFAULT_PERMISSIONS;
  });

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // Sync internal state when external rights or allowedPages change
  useEffect(() => {
    if (rights) {
      try {
        const parsed = JSON.parse(rights);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPermissions(
            DEFAULT_PERMISSIONS.map((def) => {
              const found = parsed.find((p: any) => p.id === def.id);
              return found ? { ...def, ...found } : def;
            })
          );
          return;
        }
      } catch (e) {
        console.error("Failed to parse stored rights:", e);
      }
    }
    if (allowedPages && allowedPages.includes("ALL")) {
      setPermissions(
        DEFAULT_PERMISSIONS.map((def) => ({
          ...def,
          create: true,
          read: true,
          update: true,
          delete: true,
        }))
      );
      return;
    }
    if (allowedPages && allowedPages.length > 0) {
      setPermissions(
        DEFAULT_PERMISSIONS.map((def) => {
          const slug = PERMISSION_ID_TO_PAGE_SLUG[def.id];
          const isGranted = slug ? allowedPages.includes(slug) : false;
          return {
            ...def,
            create: isGranted,
            read: isGranted,
            update: isGranted,
            delete: isGranted,
          };
        })
      );
    }
  }, [rights, allowedPages]);

  // Synchronize changes to parent form
  const syncChanges = (newPermissions: PagePermission[]) => {
    setPermissions(newPermissions);

    if (onRightsChange) {
      onRightsChange(JSON.stringify(newPermissions));
    }

    const isAllGranted = newPermissions.every(
      (p) => p.create && p.read && p.update && p.delete
    );

    if (isAllGranted) {
      onAllowedPagesChange(["ALL"]);
      return;
    }

    const activeSlugs = new Set<string>();
    newPermissions.forEach((p) => {
      if (p.create || p.read || p.update || p.delete) {
        const slug = PERMISSION_ID_TO_PAGE_SLUG[p.id];
        if (slug) activeSlugs.add(slug);
      }
    });

    onAllowedPagesChange(Array.from(activeSlugs));
  };

  const handleToggleRow = (permId: string) => {
    const updated = permissions.map((p) => {
      if (p.id !== permId) return p;
      const allChecked = p.create && p.read && p.update && p.delete;
      const nextVal = !allChecked;
      return { ...p, create: nextVal, read: nextVal, update: nextVal, delete: nextVal };
    });
    syncChanges(updated);
  };

  const handleTogglePermission = (
    permId: string,
    action: "create" | "read" | "update" | "delete"
  ) => {
    const updated = permissions.map((p) =>
      p.id === permId ? { ...p, [action]: !p[action] } : p
    );
    syncChanges(updated);
  };

  const isAllCategoryGranted =
    permissions.length > 0 &&
    permissions.every((p) => p.create && p.read && p.update && p.delete);

  const handleToggleAllCategory = () => {
    const nextVal = !isAllCategoryGranted;
    const updated = permissions.map((p) => ({
      ...p,
      create: nextVal,
      read: nextVal,
      update: nextVal,
      delete: nextVal,
    }));
    syncChanges(updated);
  };

  const handleResetToDefault = () => {
    syncChanges(DEFAULT_PERMISSIONS);
    toast.info("Permissions reset to default.");
  };

  const handleGrantAll = () => {
    const updated = permissions.map((p) => ({
      ...p,
      create: true,
      read: true,
      update: true,
      delete: true,
    }));
    syncChanges(updated);
    toast.success("All rights granted.");
  };

  const handleDenyAll = () => {
    const updated = permissions.map((p) => ({
      ...p,
      create: false,
      read: false,
      update: false,
      delete: false,
    }));
    syncChanges(updated);
    toast.info("All rights removed.");
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setIsCropModalOpen(true);
  };

  const handleEditCurrentAvatar = () => {
    if (!avatar) return;
    setCropImageSrc(getAvatarUrl(avatar));
    setIsCropModalOpen(true);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. User Photo Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm sm:text-base font-extrabold text-[#0A0E1A] dark:text-white">
            User Photo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload user photo from here. Click to adjust, crop, and preview how your profile card and avatar will look across OrderOS.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Upload / Current Photo */}
          <div className="md:col-span-5 flex flex-col items-start gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Profile Image
            </span>

            {avatar ? (
              <div className="flex flex-col gap-2.5 w-full max-w-[220px]">
                <div className="relative w-full aspect-square rounded-3xl overflow-hidden border-2 border-[#E8C16D] shadow-md group bg-slate-100 dark:bg-white/[0.04]">
                  <Image
                    src={getAvatarUrl(avatar)}
                    alt="User Avatar"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => onAvatarChange("")}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm z-10"
                    title="Remove Photo"
                  >
                    <X size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCurrentAvatar}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
                      <Crop size={18} />
                    </div>
                    <span className="text-xs font-bold">Adjust Crop & Preview</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleEditCurrentAvatar}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-slate-800 dark:text-slate-200 text-xs font-bold hover:border-[#E8C16D] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Crop size={12} className="text-[#B88728] dark:text-[#E8C16D]" />
                    <span>Adjust Crop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-transparent bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Upload size={12} />
                    <span>Change</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-[220px] aspect-square rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/[0.12] bg-slate-50 dark:bg-[#080B11] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:border-[#E8C16D] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 dark:text-slate-500 hover:text-[#0A0E1A] dark:hover:text-white"
              >
                {uploading ? (
                  <>
                    <svg className="h-6 w-6 animate-spin text-[#E8C16D]" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-500">Uploading...</span>
                  </>
                ) : (
                  <>
                    <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#141B2D] border border-slate-200 dark:border-white/[0.08] shadow-xs flex items-center justify-center text-[#B88728] dark:text-[#E8C16D]">
                      <Upload size={18} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload Photo</span>
                    <span className="text-[10px] text-slate-400">Drag & drop or click</span>
                    <span className="text-[10px] text-slate-400 font-medium">PNG, JPG up to 5MB</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Profile Appearance Preview */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={13} className="text-[#B88728] dark:text-[#E8C16D]" />
              <span>Live Appearance Preview</span>
            </span>

            <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-4 sm:p-5 shadow-xs">
              {/* Header preview row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {avatar ? (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04]">
                      <Image
                        src={getAvatarUrl(avatar)}
                        alt={fullName}
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
                    <h4 className="text-sm sm:text-base font-extrabold text-[#0A0E1A] dark:text-white truncate">
                      {fullName}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">OrderOS Account</span>
                  </div>
                </div>

                <span className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">
                  {role}
                </span>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2.5 py-2.5 border-y border-[#E7E0D2]/60 dark:border-white/[0.06] my-2 text-xs">
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold text-slate-400 mb-0.5">Email</span>
                  <span className="truncate block font-semibold text-[#0A0E1A] dark:text-slate-200">
                    {email || "user@example.com"}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-semibold text-slate-400 mb-0.5">Mobile No</span>
                  <span className="truncate block font-semibold text-[#0A0E1A] dark:text-slate-200">
                    {phone || "—"}
                  </span>
                </div>
              </div>

              {/* Preview status & mini circle */}
              <div className="flex items-center justify-between pt-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-slate-400">Navbar Icon:</span>
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[#E8C16D] bg-slate-100 dark:bg-[#141B2D]">
                    {avatar ? (
                      <Image
                        src={getAvatarUrl(avatar)}
                        alt={fullName}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-[#B88728] dark:text-[#E8C16D]">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Page Access Control Feature - Exact Table Form Matching View Mode */}
      <div className="pt-6 border-t border-[#E7E0D2] dark:border-white/[0.08] space-y-5">
        {/* Permission Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shadow-2xs">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#0A0E1A] dark:text-white">
                  Permission Management
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure granular page access and CRUD permissions for this account.
                </p>
              </div>
            </div>

            {/* Category: Dashboard Pages */}
            <div className="flex items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#E8C16D] dark:text-[#0A0E1A] shadow-xs">
                <LayoutDashboard size={14} />
                <span>Dashboard Pages ({permissions.length})</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            <button
              type="button"
              onClick={handleGrantAll}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <CheckCheck size={13} />
              <span>Grant All</span>
            </button>

            <button
              type="button"
              onClick={handleDenyAll}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Ban size={13} />
              <span>Deny All</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-[#E8C16D] transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <RotateCcw size={13} className="text-[#B88728] dark:text-[#E8C16D]" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-semibold">{error}</p>
        )}

        {/* Permission Rights Table matching View Mode exactly */}
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
                const slug = PERMISSION_ID_TO_PAGE_SLUG[row.id];

                // Admin downstream permission restriction
                const isRestrictedForAdmin =
                  currentUser?.role === "ADMIN" &&
                  currentUser.allowedPages &&
                  currentUser.allowedPages.length > 0 &&
                  !currentUser.allowedPages.includes("ALL") &&
                  slug &&
                  !currentUser.allowedPages.includes(slug) &&
                  !currentUser.allowedPages.includes(row.id);

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.04] transition-colors ${
                      isRestrictedForAdmin ? "opacity-40 pointer-events-none bg-slate-50/50 dark:bg-black/20" : ""
                    }`}
                  >
                    {/* No */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* Page Title & Description */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#0A0E1A] dark:text-white text-xs sm:text-sm flex items-center gap-2">
                        <span>{row.name}</span>
                        {isRestrictedForAdmin && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                            Restricted
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {row.description}
                      </div>
                    </td>

                    {/* All Rights Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        disabled={Boolean(isRestrictedForAdmin)}
                        onClick={() => handleToggleRow(row.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
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
                        disabled={Boolean(isRestrictedForAdmin)}
                        onClick={() => handleTogglePermission(row.id, "create")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
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
                        disabled={Boolean(isRestrictedForAdmin)}
                        onClick={() => handleTogglePermission(row.id, "read")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
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
                        disabled={Boolean(isRestrictedForAdmin)}
                        onClick={() => handleTogglePermission(row.id, "update")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
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
                        disabled={Boolean(isRestrictedForAdmin)}
                        onClick={() => handleTogglePermission(row.id, "delete")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
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

      {/* Profile Image Crop & Adjustment Modal */}
      {isCropModalOpen && cropImageSrc && (
        <ProfileImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={cropImageSrc}
          userNames={{ firstName, middleName, lastName }}
          email={email}
          role={role}
          phone={phone}
          onClose={() => {
            setIsCropModalOpen(false);
            setCropImageSrc("");
          }}
          onSave={(savedUrl) => {
            onAvatarChange(savedUrl);
            setIsCropModalOpen(false);
            setCropImageSrc("");
          }}
        />
      )}
    </div>
  );
}
