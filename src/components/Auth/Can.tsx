"use client";

import React from "react";
import { useCurrentPagePermissions } from "@/utils/pagePermissions";

export interface CanProps {
  /**
   * The CRUD action required to render children
   */
  action: "create" | "read" | "update" | "delete";

  /**
   * Optional slug override. If omitted, it automatically detects the current active page route.
   */
  pageSlug?: string;

  /**
   * Optional fallback node to render when permission is denied (e.g. disabled button, locked tooltip).
   */
  fallback?: React.ReactNode;

  /**
   * Protected child elements
   */
  children: React.ReactNode;
}

/**
 * Universal declarative authorization guard component.
 * Automatically inspects the current page route and user rights matrix.
 *
 * Usage on any page:
 * ```tsx
 * <Can action="create">
 *   <button>+ Add New</button>
 * </Can>
 *
 * <Can action="delete">
 *   <button>Delete</button>
 * </Can>
 * ```
 */
export function Can({ action, pageSlug, fallback = null, children }: CanProps) {
  const perms = useCurrentPagePermissions(pageSlug);

  if (!perms[action]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default Can;

