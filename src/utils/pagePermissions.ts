"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export interface UserPermissions {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  allowedPages?: string[];
  rights?: string | null;
  avatar?: string;
}

export interface NavItem {
  label: string;
  href?: string;
  icon?: any;
  children?: NavItem[];
  external?: boolean;
}

/**
 * Safely retrieves the current logged-in user from localStorage.
 */
export function getCurrentUser(): UserPermissions | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse user from localStorage:", err);
    return null;
  }
}

/**
 * Checks whether a particular path or page module ID is permitted for the given user.
 */
export function isRouteAllowed(
  pathname: string,
  user?: UserPermissions | null
): boolean {
  if (!user) return true; // Let auth guard handle unauthenticated state

  // Super Admin has unrestricted access to all pages
  if (user.role === "SUPERADMIN") return true;

  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "") || "/";

  // Extract relative subPath under /dashboard
  let subPath = cleanPath;
  if (cleanPath.startsWith("/dashboard/")) {
    subPath = cleanPath.slice("/dashboard/".length);
  } else if (cleanPath === "/dashboard") {
    subPath = "dashboard";
  } else if (cleanPath.startsWith("/")) {
    subPath = cleanPath.slice(1);
  }

  // 0. Workspace-level Client Configuration enforcement (SuperAdmin is exempt)
  if (typeof window !== "undefined") {
    try {
      const rawConfig = localStorage.getItem("client_configuration");
      if (rawConfig) {
        const clientConfig = JSON.parse(rawConfig);
        const configData: Record<string, boolean> | null = clientConfig.configurationData || null;
        const enabledSections: string[] = clientConfig.enabledSections || [];

        // Never lock SuperAdmin or Admin out of Client Configuration page
        const isClientConfigRoute =
          subPath === "settings/configuration" ||
          subPath.startsWith("settings/configuration/");

        if (!isClientConfigRoute) {
          // Check root section suppression
          if (Array.isArray(enabledSections) && enabledSections.length > 0) {
            const lowerSections = enabledSections.map((s: string) =>
              s.toLowerCase().replace(/_/g, "-")
            );
            const firstSegment = subPath.split("/")[0].toLowerCase().replace(/_/g, "-");

            let mappedSegment = firstSegment;
            if (firstSegment === "setting") mappedSegment = "settings";

            if (mappedSegment && !lowerSections.includes(mappedSegment)) {
              return false;
            }
          }

          // Check granular route suppression if configurationData map exists
          if (configData && typeof configData === "object") {
            const routeNodeId = cleanPath
              .replace(/^\/dashboard\/?/, "")
              .replace(/[^a-zA-Z0-9]+/g, "_")
              .replace(/_+$/, "")
              .toLowerCase() || "dashboard";

            if (configData[routeNodeId] === false) {
              return false;
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Manage users protection (strictly Admin / SuperAdmin only)
  if (subPath.startsWith("settings/manage-users") && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return false;
  }

  // 1. Primary source of truth: granular rights JSON matrix
  if (user.rights) {
    try {
      const rightsList = typeof user.rights === "string" ? JSON.parse(user.rights) : user.rights;
      if (Array.isArray(rightsList) && rightsList.length > 0) {
        const cleanQuery = subPath.toLowerCase();

        let match = rightsList.find((p: any) => {
          if (!p || !p.id) return false;
          const cleanId = p.id.replace(/^\/dashboard\/?/, "").replace(/\/+$/, "").toLowerCase();
          const cleanPath = (p.path || "").replace(/^\/dashboard\/?/, "").replace(/\/+$/, "").toLowerCase();
          const mapped = (PERMISSION_ID_TO_PAGE_SLUG[p.id] || "").toLowerCase();
          return cleanId === cleanQuery || cleanPath === cleanQuery || mapped === cleanQuery;
        });

        if (!match) {
          match = rightsList.find((p: any) => {
            if (!p || !p.id) return false;
            const cleanId = p.id.replace(/^\/dashboard\/?/, "").replace(/\/+$/, "").toLowerCase();
            const cleanPath = (p.path || "").replace(/^\/dashboard\/?/, "").replace(/\/+$/, "").toLowerCase();
            return cleanId.startsWith(cleanQuery) || cleanQuery.startsWith(cleanId) ||
                   cleanPath.startsWith(cleanQuery) || cleanQuery.startsWith(cleanPath);
          });
        }

        if (match) {
          return Boolean(match.read);
        }
      }
    } catch (e) {
      console.error("Failed to parse user rights in isRouteAllowed:", e);
    }
  }

  const allowed = user.allowedPages || [];

  // "ALL" grants full access if not explicitly restricted in rights
  if (allowed.includes("ALL")) return true;

  // For ADMIN with empty allowedPages (legacy / unconfigured), default to allow all.
  // If Super Admin has assigned specific pages to this Admin (non-empty), strictly enforce them.
  if (user.role === "ADMIN" && allowed.length === 0) {
    return true;
  }

  // Standard USER with no allowed pages assigned has 0 access
  if (user.role === "USER" && allowed.length === 0) {
    return false;
  }

  // Dashboard root
  if (cleanPath === "/dashboard" || cleanPath === "") {
    return allowed.includes("dashboard") || allowed.includes("ALL");
  }

  // 1. Exact or prefix match against any allowed page
  for (const page of allowed) {
    if (page === "ALL") return true;
    if (subPath === page) return true;
    if (subPath.startsWith(page + "/")) return true;
    if (page.startsWith(subPath + "/")) return true;
  }

  // 2. Legacy alias compatibility
  if (subPath.startsWith("vms")) {
    if (allowed.includes("vms")) return true;
    if (subPath.startsWith("vms/operator") && allowed.includes("vms/operator")) return true;
    if (subPath.startsWith("vms/admin") && allowed.includes("vms/admin")) return true;
    if (subPath.startsWith("vms/scans") && (allowed.includes("vms/scans") || allowed.includes("vms_tracking"))) return true;
  }

  if (subPath.startsWith("products")) {
    if (allowed.includes("products") || allowed.includes("inventory") || allowed.includes("products/inventory")) return true;
  }

  if (subPath.startsWith("order-process")) {
    if (allowed.includes("orderprocess") || allowed.includes("order-process")) return true;
  }

  if (subPath.startsWith("products-analytics")) {
    if (allowed.includes("products-analytics") || allowed.includes("products")) return true;
  }

  if (subPath.startsWith("transaction")) {
    if (allowed.includes("transaction")) return true;
  }

  if (subPath.startsWith("offline-sales")) {
    if (subPath.includes("challan") && (allowed.includes("challan") || allowed.includes("offline-sales/sales-challan"))) return true;
    if (allowed.includes("offline-sales")) return true;
  }

  if (subPath.startsWith("purchase")) {
    if (subPath.includes("challan") && (allowed.includes("purchase-challan") || allowed.includes("purchase/finish-goods/challan"))) return true;
    if (subPath.includes("invoice") && (allowed.includes("purchase-invoice") || allowed.includes("purchase/finish-goods/invoice"))) return true;
    if (allowed.includes("purchase")) return true;
  }

  if (subPath.startsWith("settings")) {
    if (subPath.startsWith("settings/configuration")) {
      if (user.role === "ADMIN" || user.role === "SUPERADMIN") return true;
      return allowed.includes("settings/configuration") || allowed.includes("configuration") || allowed.includes("settings");
    }
    if (subPath.startsWith("settings/manage-users")) {
      return allowed.includes("manage-users") || allowed.includes("settings/manage-users") || allowed.includes("settings");
    }
    if (subPath.startsWith("settings/labels")) {
      return allowed.includes("labels") || allowed.includes("settings/labels") || allowed.includes("settings");
    }
    if (subPath.startsWith("settings/manage-product")) {
      return allowed.includes("products") || allowed.includes("settings/manage-product") || allowed.includes("settings");
    }
    if (subPath.startsWith("settings/webstore")) {
      return allowed.includes("webstore") || allowed.includes("settings/webstore") || allowed.includes("settings");
    }
    return allowed.includes("settings");
  }

  return false;
}

/**
 * Checks if a specific sidebar NavItem is permitted for the given user.
 */
export function isNavItemAllowed(
  item: NavItem,
  user?: UserPermissions | null
): boolean {
  if (!user) return true;
  if (user.role === "SUPERADMIN") return true;

  // Check based on href first if present
  if (item.href) {
    return isRouteAllowed(item.href, user);
  }

  const allowed = user.allowedPages || [];
  if (allowed.includes("ALL")) return true;

  if (user.role === "ADMIN" && allowed.length === 0) {
    return true;
  }

  if (user.role === "USER" && allowed.length === 0) {
    return false;
  }

  // Label-based fallback for parent groups without direct href
  const label = item.label.toLowerCase();
  if (label.includes("dashboard")) return allowed.includes("dashboard") || allowed.some((p) => p.startsWith("dashboard"));
  if (label.includes("vms")) return allowed.some((p) => p.startsWith("vms"));
  if (label.includes("products analytics")) return allowed.some((p) => p.startsWith("products-analytics"));
  if (label.includes("product")) return allowed.some((p) => p.startsWith("products") || p.startsWith("settings/manage-product"));
  if (label.includes("order process")) return allowed.some((p) => p.startsWith("order-process") || p === "orderprocess");
  if (label.includes("transaction")) return allowed.some((p) => p.startsWith("transaction"));
  if (label.includes("offline sales")) return allowed.some((p) => p.startsWith("offline-sales") || p === "challan");
  if (label.includes("purchase")) return allowed.some((p) => p.startsWith("purchase"));
  if (label.includes("manage users")) {
    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") return false;
    return allowed.some((p) => p.includes("manage-users") || p === "settings");
  }
  if (label.includes("barcode") || label.includes("labels")) return allowed.some((p) => p.includes("labels") || p === "settings");
  if (label.includes("configuration")) {
    if (user.role === "ADMIN" || user.role === "SUPERADMIN") return true;
    return allowed.some((p) => p.includes("configuration") || p === "settings");
  }
  if (label.includes("settings")) return allowed.some((p) => p.startsWith("settings") || p.includes("labels") || p.includes("manage-users"));

  return false;
}

/**
 * Recursively filters navigation items based on user permissions.
 * If a parent node has children, it will only be included if at least one of its children is allowed.
 */
export function filterNavItemsForUser(
  items: NavItem[],
  user?: UserPermissions | null,
  isRoot = true
): NavItem[] {
  if (!user) return items;
  if (user.role === "SUPERADMIN") return items;

  const allowed = user.allowedPages || [];
  if (!user.rights) {
    if (allowed.includes("ALL")) return items;
    if (user.role === "ADMIN" && allowed.length === 0) return items;
  }

  // Workspace-level Client Configuration check for non-SuperAdmins
  let clientEnabledSections: string[] | null = null;
  let clientConfigData: Record<string, boolean> | null = null;

  if (typeof window !== "undefined") {
    try {
      const rawConfig = localStorage.getItem("client_configuration");
      if (rawConfig) {
        const parsed = JSON.parse(rawConfig);
        if (Array.isArray(parsed.enabledSections)) {
          clientEnabledSections = parsed.enabledSections.map((s: string) =>
            s.toLowerCase().replace(/_/g, "-")
          );
        }
        if (parsed.configurationData && typeof parsed.configurationData === "object") {
          clientConfigData = parsed.configurationData;
        }
      }
    } catch {
      // ignore
    }
  }

  return items
    .map((item) => {
      const isClientConfigItem =
        item.label.toLowerCase().includes("configuration") ||
        (item.href && item.href.includes("settings/configuration"));

      const labelKey = item.label.toLowerCase().replace(/\s+/g, "-");
      const nodeId = item.href
        ? item.href
            .replace(/^\/dashboard\/?/, "")
            .replace(/[^a-zA-Z0-9]+/g, "_")
            .replace(/_+$/, "")
            .toLowerCase() || "dashboard"
        : labelKey.replace(/-/g, "_");

      if (!isClientConfigItem) {
        // Top-level section suppression applies ONLY to root navigation items
        if (isRoot && clientEnabledSections && clientEnabledSections.length > 0) {
          if (!clientEnabledSections.includes(labelKey) && !clientEnabledSections.includes(nodeId.replace(/_/g, "-"))) {
            return null;
          }
        }
      }

      // If item has children, recursively filter them first
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterNavItemsForUser(item.children, user, false);
        if (filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren,
          };
        }
        // If no children survived, check if parent itself has a valid accessible href
        if (item.href && isRouteAllowed(item.href, user)) {
          const { children, ...rest } = item;
          return rest;
        }
        return null;
      }

      // Leaf item suppression check: only check clientConfigData for leaf items!
      if (!isClientConfigItem && clientConfigData && clientConfigData[nodeId] === false) {
        return null;
      }

      // Leaf item permission check
      if (isNavItemAllowed(item, user)) {
        return item;
      }

      return null;
    })
    .filter(Boolean) as NavItem[];
}

/**
 * Returns the first accessible route for this user.
 * Dynamically resolves candidate routes in priority order against isRouteAllowed,
 * ensuring users and admins are never redirected to a route blocked by client configuration.
 */
export function getFirstAllowedRoute(user?: UserPermissions | null): string {
  if (!user || user.role === "SUPERADMIN") return "/dashboard";

  const candidateRoutes = [
    "/dashboard",
    "/dashboard/vms",
    "/dashboard/products/inventory",
    "/dashboard/order-process",
    "/dashboard/products-analytics/amazon",
    "/dashboard/transaction/sales/po-based/upload-requested-po",
    "/dashboard/offline-sales/sales-challan",
    "/dashboard/purchase/finish-goods/challan",
    "/dashboard/settings/configuration/client",
    "/dashboard/settings/manage-users/user-profile",
    "/dashboard/settings/manage-product/product-profile",
    "/dashboard/settings/webstore",
  ];

  for (const route of candidateRoutes) {
    if (isRouteAllowed(route, user)) {
      return route;
    }
  }

  // Safe fallback for Admin and SuperAdmin is the Configuration page
  if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
    return "/dashboard/settings/configuration/client";
  }

  return "/dashboard";
}

/**
 * =========================================================================
 * GRANULAR CRUD PERMISSIONS (Create, Read, Update, Delete)
 * =========================================================================
 */

export interface PageCrudPermission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

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
};

/**
 * Evaluates the user's specific CRUD rights for a given page/resource.
 */
export function getPagePermission(
  pageSlug: string,
  user?: UserPermissions | null
): PageCrudPermission {
  if (!user) {
    return { create: true, read: true, update: true, delete: true };
  }

  // Super Admin has unrestricted CRUD access to all resources
  if (user.role === "SUPERADMIN") {
    return { create: true, read: true, update: true, delete: true };
  }

  // 1. If user has rights JSON matrix stored, it is the PRIMARY source of truth!
  if (user.rights) {
    try {
      const rightsList = typeof user.rights === "string" ? JSON.parse(user.rights) : user.rights;
      if (Array.isArray(rightsList) && rightsList.length > 0) {
        const cleanQuery = pageSlug.replace(/^\/dashboard\/?/, "").replace(/\/+$/, "").toLowerCase();

        // 1. Exact match
        let match = rightsList.find((p: any) => {
          if (!p || !p.id) return false;
          const cleanId = p.id.replace(/^\/dashboard\/?/, "").replace(/\/+$/, "").toLowerCase();
          const cleanPath = (p.path || "").replace(/^\/dashboard\/?/, "").replace(/\/+$/, "").toLowerCase();
          const mapped = (PERMISSION_ID_TO_PAGE_SLUG[p.id] || "").toLowerCase();
          return cleanId === cleanQuery || cleanPath === cleanQuery || mapped === cleanQuery;
        });

        // 2. Prefix / StartsWith match
        if (!match) {
          match = rightsList.find((p: any) => {
            if (!p || !p.id) return false;
            const cleanId = p.id.replace(/^\/dashboard\/?/, "").replace(/\/+$/, "").toLowerCase();
            const cleanPath = (p.path || "").replace(/^\/dashboard\/?/, "").replace(/\/+$/, "").toLowerCase();
            return cleanId.startsWith(cleanQuery) || cleanQuery.startsWith(cleanId) ||
                   cleanPath.startsWith(cleanQuery) || cleanQuery.startsWith(cleanPath);
          });
        }

        // 3. Substring match
        if (!match) {
          match = rightsList.find((p: any) => {
            if (!p || !p.id) return false;
            const cleanId = p.id.replace(/^\/dashboard\/?/, "").replace(/\/+$/, "").toLowerCase();
            return cleanId.includes(cleanQuery) || cleanQuery.includes(cleanId);
          });
        }

        if (match) {
          return {
            create: Boolean(match.create),
            read: Boolean(match.read),
            update: Boolean(match.update),
            delete: Boolean(match.delete),
          };
        }
      }
    } catch (e) {
      console.error("Failed to parse user rights:", e);
    }
  }

  // 2. Fallback: "ALL" page access grants full permissions if no specific rights entry exists
  const allowed = user.allowedPages || [];
  if (allowed.includes("ALL")) {
    return { create: true, read: true, update: true, delete: true };
  }

  // Fallback: If no granular rights matrix exists, fall back to route-level access
  const routeAllowed = isRouteAllowed(pageSlug, user);
  return {
    create: routeAllowed,
    read: routeAllowed,
    update: routeAllowed,
    delete: routeAllowed,
  };
}

export function canUserCreate(pageSlug: string, user?: UserPermissions | null): boolean {
  return getPagePermission(pageSlug, user).create;
}

export function canUserRead(pageSlug: string, user?: UserPermissions | null): boolean {
  return getPagePermission(pageSlug, user).read;
}

export function canUserUpdate(pageSlug: string, user?: UserPermissions | null): boolean {
  return getPagePermission(pageSlug, user).update;
}

export function canUserDelete(pageSlug: string, user?: UserPermissions | null): boolean {
  return getPagePermission(pageSlug, user).delete;
}

/**
 * React hook to reactively retrieve Create, Read, Update, Delete rights
 * for the current logged-in user on a specific page/resource.
 */
export function usePagePermissions(pageSlug: string) {
  const [currentUser, setCurrentUser] = useState<UserPermissions | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());

    const handleStorage = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const perms = getPagePermission(pageSlug, currentUser);
  const isAllowed = isRouteAllowed(pageSlug, currentUser);

  return {
    ...perms,
    canCreate: perms.create,
    canRead: perms.read,
    canUpdate: perms.update,
    canDelete: perms.delete,
    isAllowed,
    user: currentUser,
  };
}

/**
 * Normalizes any dashboard pathname into a canonical page slug.
 */
export function getSlugFromPathname(pathname: string): string {
  if (!pathname) return "dashboard";
  let clean = pathname.split("?")[0].replace(/\/+$/, "");
  if (clean.startsWith("/dashboard/")) {
    clean = clean.slice("/dashboard/".length);
  } else if (clean === "/dashboard" || clean === "") {
    return "dashboard";
  } else if (clean.startsWith("/")) {
    clean = clean.slice(1);
  }

  // Normalize sub-action routes to their parent resource IDs
  if (clean.startsWith("settings/manage-users")) {
    return "settings/manage-users";
  }
  if (clean.startsWith("settings/manage-product")) {
    return "settings/manage-product";
  }
  if (clean.startsWith("order-process/amazon/order-process")) {
    return "order-process/amazon/order-process";
  }
  if (clean.startsWith("order-process/amazon/awb-scan")) {
    return "order-process/amazon/awb-scan";
  }
  if (clean.startsWith("products/inventory")) {
    return "products/inventory";
  }
  if (clean.startsWith("vms/scans")) {
    return clean.includes("trackingid") ? "vms/scans/trackingid-scan" : "vms/scans";
  }
  if (clean.startsWith("vms/operator")) {
    return "vms/operator";
  }
  if (clean.startsWith("vms/admin")) {
    if (clean.includes("users")) return "vms/admin/users";
    if (clean.includes("account")) return "vms/admin/account";
    return "vms/admin";
  }

  return clean;
}

/**
 * React hook that automatically detects the current active route via Next.js usePathname()
 * and dynamically retrieves Create, Read, Update, Delete rights for the active page
 * with zero manual configuration required!
 */
export function useCurrentPagePermissions(overrideSlug?: string) {
  const pathname = usePathname();
  const slug = overrideSlug || getSlugFromPathname(pathname || "");
  const perms = usePagePermissions(slug);
  return {
    ...perms,
    slug,
  };
}
