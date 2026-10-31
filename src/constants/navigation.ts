"use client";

import React from "react";
import {
  Home,
  Video,
  Package,
  ClipboardCheck,
  FileSpreadsheet,
  ShoppingBag,
  Settings,
  ArrowLeftRight,
  Users,
  ScanBarcode,
  Barcode,
  Tag,
  Warehouse,
  PlusCircle,
  BarChart2,
  BarChart3,
  FileText,
  Truck,
  Layers,
  Bell,
  Wallet,
  Store,
  User,
  UserPlus,
  ClipboardList,
  CheckCircle,
} from "lucide-react";
import { isRouteAllowed, type UserPermissions } from "@/utils/pagePermissions";

export interface NavItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
  children?: NavItem[];
  external?: boolean;
  keywords?: string[];
  defaultTimeAgo?: string;
  isCore?: boolean;
}

export interface SearchPageItem {
  id: string;
  title: string;
  path: string;
  href: string;
  icon: React.ElementType;
  defaultTimeAgo: string;
  keywords?: string[];
  priority?: number;
}

/**
 * =========================================================================
 * 1. PRIMARY SITE NAVIGATION (SINGLE SOURCE OF TRUTH)
 * =========================================================================
 * Whenever you add a new page or section to the site, add it here in `navItems`.
 * It will AUTOMATICALLY appear in:
 *   1. The Sidebar navigation menu
 *   2. The Global Search (Ctrl + K) command palette with auto breadcrumb path!
 */
export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    defaultTimeAgo: "1w ago",
  },
  {
    label: "VMS",
    href: "/dashboard/vms",
    icon: Video,
    children: [
      {
        label: "Dashboard",
        href: "/dashboard/vms",
        defaultTimeAgo: "4d ago",
      },
      {
        label: "Scans",
        href: "/dashboard/vms/scans",
        children: [
          {
            label: "VMS",
            href: "/dashboard/vms/scans/vms",
            defaultTimeAgo: "4d ago",
          },
          {
            label: "TrackingID Scan",
            href: "/dashboard/vms/scans/trackingid-scan",
            defaultTimeAgo: "5d ago",
          },
        ],
      },
      {
        label: "Operator",
        href: "/dashboard/vms/operator",
        children: [
          {
            label: "VMS",
            href: "/dashboard/vms/operator/vms",
            defaultTimeAgo: "5d ago",
          },
        ],
      },
      {
        label: "Admin",
        href: "/dashboard/vms/admin",
        children: [
          {
            label: "Users",
            href: "/dashboard/vms/admin/users",
            defaultTimeAgo: "6d ago",
          },
          {
            label: "Accounts Name",
            href: "/dashboard/vms/admin/account",
            defaultTimeAgo: "6d ago",
          },
        ],
      },
    ],
  },
  {
    label: "Products",
    href: "/dashboard/products/inventory",
    icon: Package,
    children: [
      {
        label: "Inventory",
        href: "/dashboard/products/inventory",
        defaultTimeAgo: "25m ago",
        isCore: true,
      },
    ],
  },
  {
    label: "Order Process",
    href: "/dashboard/order-process",
    icon: ClipboardCheck,
    children: [
      {
        label: "Dashboard",
        href: "/dashboard/order-process",
        defaultTimeAgo: "1d ago",
      },
      {
        label: "Myntra",
        children: [
          {
            label: "Manage Tag Loop",
            href: "/dashboard/order-process/myntra/manage-tag-loop",
            defaultTimeAgo: "2d ago",
          },
          {
            label: "Myntra Order",
            href: "/dashboard/order-process/myntra/myntra-order",
            defaultTimeAgo: "6h ago",
            isCore: true,
          },
          {
            label: "Myntra Picklist",
            href: "/dashboard/order-process/myntra/myntra-picklist",
            defaultTimeAgo: "1d ago",
          },
          {
            label: "Stock Analysis",
            href: "/dashboard/order-process/myntra/stock-analysis",
            defaultTimeAgo: "2d ago",
          },
          {
            label: "Invoice Formatter",
            href: "/dashboard/order-process/myntra/invoice-formatter",
            defaultTimeAgo: "2d ago",
          },
        ],
      },
      {
        label: "Amazon",
        children: [
          {
            label: "Order Process",
            href: "/dashboard/order-process/amazon/order-process",
            defaultTimeAgo: "1d ago",
          },
          {
            label: "AWB Scan",
            href: "/dashboard/order-process/amazon/awb-scan",
            defaultTimeAgo: "1d ago",
          },
        ],
      },
    ],
  },
  {
    label: "Products Analytics",
    icon: Package,
    children: [
      {
        label: "Amazon",
        href: "/dashboard/products-analytics/amazon",
        defaultTimeAgo: "4d ago",
      },
    ],
  },
  {
    label: "Transaction",
    icon: ArrowLeftRight,
    children: [
      {
        label: "Sales",
        children: [
          {
            label: "PO Based",
            children: [
              {
                label: "Upload Requested PO",
                href: "/dashboard/transaction/sales/po-based/upload-requested-po",
                defaultTimeAgo: "3d ago",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Offline Sales",
    icon: FileSpreadsheet,
    children: [
      {
        label: "Sales Challan",
        href: "/dashboard/offline-sales/sales-challan",
        defaultTimeAgo: "4h ago",
        isCore: true,
      },
      {
        label: "Sales Invoice",
        href: "/dashboard/offline-sales/sales-invoice",
        defaultTimeAgo: "2h ago",
        isCore: true,
      },
    ],
  },
  {
    label: "Purchase",
    icon: ShoppingBag,
    children: [
      {
        label: "Finish Goods",
        children: [
          {
            label: "Purchase Challan",
            href: "/dashboard/purchase/finish-goods/challan",
            defaultTimeAgo: "20h ago",
          },
          {
            label: "Purchase Invoice",
            href: "/dashboard/purchase/finish-goods/invoice",
            defaultTimeAgo: "8h ago",
            isCore: true,
          },
        ],
      },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      {
        label: "Manage Users",
        icon: Users,
        children: [
          {
            label: "User Profile",
            href: "/dashboard/settings/manage-users/user-profile",
            defaultTimeAgo: "1h ago",
            isCore: true,
          },
        ],
      },
      {
        label: "Manage Product",
        icon: Package,
        href: "/dashboard/settings/manage-product/product-profile",
        children: [
          {
            label: "Product Profile",
            href: "/dashboard/settings/manage-product/product-profile",
            defaultTimeAgo: "10m ago",
            isCore: true,
          },
        ],
      },
      {
        label: "Barcode/Labels",
        icon: ScanBarcode,
        children: [
          {
            label: "Label Config",
            href: "/dashboard/settings/labels/label-config",
            defaultTimeAgo: "3d ago",
          },
          {
            label: "Label Print",
            href: "/dashboard/settings/labels/label-print",
            defaultTimeAgo: "2d ago",
          },
        ],
      },
      {
        label: "Webstore",
        href: "/dashboard/settings/webstore",
        defaultTimeAgo: "3d ago",
      },
    ],
  },
];

/**
 * =========================================================================
 * 2. STANDALONE & SECONDARY PAGES (NOT DIRECTLY IN SIDEBAR MENU)
 * =========================================================================
 * Direct links, action forms, and user account pages that are accessible
 * by search or URL but aren't parent items in the sidebar.
 */
export const standalonePages: SearchPageItem[] = [
  {
    id: "add-product",
    title: "Add Product",
    path: "Setting > Manage Product > Add Product",
    href: "/dashboard/settings/manage-product/product-profile/add-product",
    icon: PlusCircle,
    defaultTimeAgo: "12h ago",
    keywords: ["add product", "create product", "new product", "new sku"],
  },
  {
    id: "create-user",
    title: "Create User",
    path: "Setting > Manage Users > Create User",
    href: "/dashboard/settings/manage-users/user-profile/create-user",
    icon: UserPlus,
    defaultTimeAgo: "1w ago",
    keywords: ["create user", "add user", "new staff", "new user"],
  },
  {
    id: "notifications",
    title: "Notifications",
    path: "Account > Notifications",
    href: "/dashboard/notification",
    icon: Bell,
    defaultTimeAgo: "1w ago",
    keywords: ["notifications", "alerts", "inbox", "updates"],
  },
  {
    id: "my-profile",
    title: "My Profile",
    path: "Account > Profile",
    href: "/dashboard/profile",
    icon: User,
    defaultTimeAgo: "1w ago",
    keywords: ["profile", "my profile", "settings", "password", "my account"],
  },
  {
    id: "wallet",
    title: "Wallet",
    path: "Account > Wallet",
    href: "/dashboard/wallet",
    icon: Wallet,
    defaultTimeAgo: "1w ago",
    keywords: ["wallet", "balance", "recharge", "credits", "payment"],
  },
  {
    id: "vms-admin-logistics-partners",
    title: "Logistics Partners",
    path: "VMS > Admin > Logistics Partners",
    href: "/dashboard/vms/admin/logistics-partners",
    icon: Video,
    defaultTimeAgo: "6d ago",
    keywords: ["logistics", "partners", "vms"],
  },
  {
    id: "vms-reports",
    title: "Reports",
    path: "VMS > Reports",
    href: "/dashboard/vms/reports",
    icon: Video,
    defaultTimeAgo: "5d ago",
    keywords: ["reports", "vms reports", "analytics"],
  },
  {
    id: "product-variants",
    title: "Product Variants",
    path: "Products > Product Variants",
    href: "/dashboard/products/product-variants",
    icon: Package,
    defaultTimeAgo: "1w ago",
    keywords: ["variants", "product variants", "color", "size"],
  },
  {
    id: "sku-mapping",
    title: "SKU Mapping",
    path: "Products > SKU Mapping",
    href: "/dashboard/sku-mapping",
    icon: Barcode,
    defaultTimeAgo: "1w ago",
    keywords: ["sku mapping", "mapping", "channel sku"],
  },
  {
    id: "warehouse",
    title: "Warehouse",
    path: "Warehouse",
    href: "/dashboard/warehouse",
    icon: Warehouse,
    defaultTimeAgo: "1d ago",
    keywords: ["warehouse", "storage", "location"],
  },
];

/**
 * =========================================================================
 * 3. DYNAMIC SEARCH EXTRACTOR
 * =========================================================================
 * Recursively extracts all searchable pages from the navItems tree.
 * Automatically generates IDs, breadcrumb paths, search keywords, and inherits icons.
 */
export function extractPagesFromNav(
  items: NavItem[],
  parentPath: string[] = [],
  inheritedIcon?: React.ElementType
): SearchPageItem[] {
  const result: SearchPageItem[] = [];

  for (const item of items) {
    const currentPath = [...parentPath, item.label];
    const icon = item.icon || inheritedIcon || FileText;

    if (item.children && item.children.length > 0) {
      const childPages = extractPagesFromNav(item.children, currentPath, item.icon || inheritedIcon);
      result.push(...childPages);

      // If parent has a unique href not matching any child, also include it
      if (item.href && !childPages.some((c) => c.href === item.href)) {
        const slugId = item.href.replace(/^\//, "").replace(/[\/\?#]+/g, "-") || "dashboard";
        result.push({
          id: slugId,
          title: item.label,
          path: currentPath.join(" > "),
          href: item.href,
          icon: icon,
          defaultTimeAgo: item.defaultTimeAgo || "1d ago",
          priority: item.isCore ? 10 : 0,
          keywords: [
            ...item.label.toLowerCase().split(/\s+/),
            ...currentPath.map((p) => p.toLowerCase()),
            ...item.href.split("/").filter(Boolean),
            ...(item.keywords || []),
          ],
        });
      }
    } else if (item.href) {
      const slugId = item.href.replace(/^\//, "").replace(/[\/\?#]+/g, "-") || "dashboard";
      result.push({
        id: slugId,
        title: item.label,
        path: currentPath.join(" > "),
        href: item.href,
        icon: icon,
        defaultTimeAgo: item.defaultTimeAgo || "1d ago",
        priority: item.isCore ? 10 : 0,
        keywords: [
          ...item.label.toLowerCase().split(/\s+/),
          ...currentPath.map((p) => p.toLowerCase()),
          ...item.href.split("/").filter(Boolean),
          ...(item.keywords || []),
        ],
      });
    }
  }

  return result;
}

/**
 * =========================================================================
 * 4. GET ALL DYNAMIC SEARCHABLE PAGES
 * =========================================================================
 * Merges pages extracted dynamically from `navItems` with `standalonePages`.
 * Deduplicates by href and filters by user permissions if a user is passed.
 */
export function getDynamicSearchablePages(user?: UserPermissions | null): SearchPageItem[] {
  const navPages = extractPagesFromNav(navItems);
  const map = new Map<string, SearchPageItem>();

  // 1. Add nav pages
  for (const page of navPages) {
    map.set(page.href, page);
  }

  // 2. Add standalone pages (if not already present)
  for (const page of standalonePages) {
    if (!map.has(page.href)) {
      map.set(page.href, page);
    }
  }

  let list = Array.from(map.values());

  // 3. Filter by user permissions if provided
  if (user) {
    list = list.filter((p) => isRouteAllowed(p.href, user));
  }

  // 4. Default sort order: Core pages first, then natural order
  // Core pages defined in default view:
  const CORE_ORDER = [
    "/dashboard/settings/manage-product/product-profile",
    "/dashboard/products/inventory",
    "/dashboard/settings/manage-users/user-profile",
    "/dashboard/offline-sales/sales-invoice",
    "/dashboard/offline-sales/sales-challan",
    "/dashboard/order-process/myntra/myntra-order",
    "/dashboard/purchase/finish-goods/invoice",
  ];

  list.sort((a, b) => {
    const aCoreIdx = CORE_ORDER.indexOf(a.href);
    const bCoreIdx = CORE_ORDER.indexOf(b.href);

    if (aCoreIdx !== -1 && bCoreIdx !== -1) return aCoreIdx - bCoreIdx;
    if (aCoreIdx !== -1) return -1;
    if (bCoreIdx !== -1) return 1;

    return (b.priority || 0) - (a.priority || 0);
  });

  return list;
}

/**
 * =========================================================================
 * 5. RUNTIME REGISTRATION HELPER
 * =========================================================================
 * Allows any custom component, feature, or plugin to dynamically register
 * a searchable page at runtime.
 */
export function registerSearchPage(page: SearchPageItem) {
  if (!standalonePages.some((p) => p.href === page.href)) {
    standalonePages.push(page);
  }
}

/**
 * =========================================================================
 * 6. DYNAMIC PERMISSION DEFINITIONS GENERATOR
 * =========================================================================
 * Automatically converts all existing and newly created pages into
 * full-featured CRUD permission rows for the User Profile Rights table.
 */
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

export function getDynamicPermissionDefinitions(): PagePermission[] {
  const pages = getDynamicSearchablePages();
  const seenIds = new Set<string>();
  const result: PagePermission[] = [];

  for (const page of pages) {
    const cleanId =
      page.href.replace(/^\/dashboard\/?/, "").replace(/\/+$/, "") || "dashboard";

    if (seenIds.has(cleanId)) continue;
    seenIds.add(cleanId);

    const name = page.path ? page.path.replace(/ > /g, " - ") : page.title;

    result.push({
      id: cleanId,
      name,
      description: `Access, create, edit and delete permissions for ${page.title}`,
      category: "dashboard" as const,
      path: page.href,
      create: true,
      read: true,
      update: true,
      delete: true,
    });
  }

  return result;
}

