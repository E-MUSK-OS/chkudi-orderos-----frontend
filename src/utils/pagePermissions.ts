"use client";

export interface UserPermissions {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  allowedPages?: string[];
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

  const allowed = user.allowedPages || [];

  // "ALL" grants full access
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

  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "") || "/";

  // Dashboard root
  if (cleanPath === "/dashboard" || cleanPath === "") {
    return allowed.includes("dashboard") || allowed.includes("ALL");
  }

  // Extract relative subPath under /dashboard
  let subPath = cleanPath;
  if (cleanPath.startsWith("/dashboard/")) {
    subPath = cleanPath.slice("/dashboard/".length);
  } else if (cleanPath === "/dashboard") {
    subPath = "dashboard";
  } else if (cleanPath.startsWith("/")) {
    subPath = cleanPath.slice(1);
  }

  // Manage users protection (strictly Admin / SuperAdmin only)
  if (subPath.startsWith("settings/manage-users") && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return false;
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

  const allowed = user.allowedPages || [];
  if (allowed.includes("ALL")) return true;

  if (user.role === "ADMIN" && allowed.length === 0) {
    return true;
  }

  if (user.role === "USER" && allowed.length === 0) {
    return false;
  }

  // Check based on href if present
  if (item.href) {
    return isRouteAllowed(item.href, user);
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
  if (label.includes("settings")) return allowed.some((p) => p.startsWith("settings") || p.includes("labels") || p.includes("manage-users"));

  return false;
}

/**
 * Recursively filters navigation items based on user permissions.
 * If a parent node has children, it will only be included if at least one of its children is allowed.
 */
export function filterNavItemsForUser(
  items: NavItem[],
  user?: UserPermissions | null
): NavItem[] {
  if (!user) return items;
  if (user.role === "SUPERADMIN") return items;

  const allowed = user.allowedPages || [];
  if (allowed.includes("ALL")) return items;
  if (user.role === "ADMIN" && allowed.length === 0) return items;

  return items
    .map((item) => {
      // If item has children, recursively filter them
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterNavItemsForUser(item.children, user);
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

      // Leaf item
      if (isNavItemAllowed(item, user)) {
        return item;
      }

      return null;
    })
    .filter(Boolean) as NavItem[];
}

/**
 * Returns the first accessible route for this user.
 * Used for automatic redirect if user lands on an unauthorized route or root.
 */
export function getFirstAllowedRoute(user?: UserPermissions | null): string {
  if (!user || user.role === "SUPERADMIN") return "/dashboard";
  const allowed = user.allowedPages || [];
  if (allowed.includes("ALL")) return "/dashboard";
  if (user.role === "ADMIN" && allowed.length === 0) return "/dashboard";

  if (allowed.includes("dashboard")) return "/dashboard";
  if (allowed.includes("vms")) return "/dashboard/vms";
  if (allowed.includes("orderprocess")) return "/dashboard/order-process";
  if (allowed.includes("products") || allowed.includes("inventory")) return "/dashboard/products/inventory";
  if (allowed.includes("products-analytics")) return "/dashboard/products-analytics/amazon";
  if (allowed.includes("transaction")) return "/dashboard/transaction/sales/po-based/upload-requested-po";
  if (allowed.includes("offline-sales") || allowed.includes("challan")) return "/dashboard/offline-sales/sales-challan";
  if (allowed.includes("purchase") || allowed.includes("purchase-challan")) return "/dashboard/purchase/finish-goods/challan";
  if (allowed.includes("purchase-invoice")) return "/dashboard/purchase/finish-goods/invoice";
  if (allowed.includes("labels")) return "/dashboard/settings/labels/label-config";
  if (allowed.includes("manage-users") && (user.role === "ADMIN" || user.role === "SUPERADMIN")) return "/dashboard/settings/manage-users/user-profile";
  if (allowed.includes("settings")) return "/dashboard/settings/manage-product/product-profile";

  return "/dashboard";
}
