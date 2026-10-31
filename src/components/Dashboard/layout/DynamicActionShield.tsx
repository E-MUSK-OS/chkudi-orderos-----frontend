"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useCurrentPagePermissions } from "@/utils/pagePermissions";

interface DynamicActionShieldProps {
  children: React.ReactNode;
}

type CrudAction = "create" | "read" | "update" | "delete";

// Keywords to detect element action intent
const CREATE_KEYWORDS = [
  "create",
  "add",
  "upload",
  "generate",
  "import",
  "new",
  "save new",
  "submit batch",
  "process order",
  "process batch",
];

const UPDATE_KEYWORDS = [
  "update",
  "edit",
  "modify",
  "adjust",
  "save rights",
  "save changes",
  "reorder",
  "change status",
  "sync",
];

const DELETE_KEYWORDS = [
  "delete",
  "remove",
  "clear",
  "clear all",
  "clear-all",
  "trash",
  "destroy",
  "purge",
];

/**
 * Inspects a DOM element to infer whether it represents Create, Update, or Delete.
 */
function detectElementAction(el: HTMLElement): CrudAction | null {
  // 1. Explicit data-action attribute
  const explicit = el.getAttribute("data-action") as CrudAction | null;
  if (explicit && ["create", "read", "update", "delete"].includes(explicit)) {
    return explicit;
  }

  // 2. File inputs always represent Create / Upload
  if (el.tagName === "INPUT" && (el as HTMLInputElement).type === "file") {
    return "create";
  }

  // 3. Inspect text, title, aria-label, and name
  const text = (el.textContent || "").toLowerCase().trim();
  const title = (el.getAttribute("title") || "").toLowerCase().trim();
  const aria = (el.getAttribute("aria-label") || "").toLowerCase().trim();
  const name = (el.getAttribute("name") || "").toLowerCase().trim();
  const fullText = `${text} ${title} ${aria} ${name}`;

  // 4. Inspect Lucide SVG classes
  const svgs = Array.from(el.querySelectorAll("svg"));
  const svgClasses = svgs
    .map(
      (svg) =>
        `${svg.getAttribute("class") || ""} ${svg.getAttribute("data-icon") || ""}`
    )
    .join(" ")
    .toLowerCase();

  // --- DELETE CHECKS ---
  if (
    svgClasses.includes("lucide-trash") ||
    svgClasses.includes("lucide-trash-2") ||
    DELETE_KEYWORDS.some((kw) => fullText.includes(kw))
  ) {
    return "delete";
  }

  // --- CREATE CHECKS ---
  if (
    svgClasses.includes("lucide-plus") ||
    svgClasses.includes("lucide-upload") ||
    svgClasses.includes("lucide-file-plus") ||
    svgClasses.includes("lucide-plus-circle") ||
    CREATE_KEYWORDS.some((kw) => fullText.includes(kw))
  ) {
    return "create";
  }

  // --- UPDATE CHECKS ---
  if (
    svgClasses.includes("lucide-pencil") ||
    svgClasses.includes("lucide-edit") ||
    svgClasses.includes("lucide-edit-2") ||
    svgClasses.includes("lucide-edit-3") ||
    UPDATE_KEYWORDS.some((kw) => fullText.includes(kw))
  ) {
    return "update";
  }

  return null;
}

/**
 * DynamicActionShield: Global automatic frontend CRUD shield.
 * Wraps page contents in DashboardLayout and intercepts / disables actions
 * that the active user does not have permission to execute on the current route.
 */
export function DynamicActionShield({ children }: DynamicActionShieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { canCreate, canUpdate, canDelete, user } = useCurrentPagePermissions();

  const isSuperAdmin = user?.role === "SUPERADMIN";

  // Capture-phase click interceptor
  const handleCaptureClick = useCallback(
    (e: React.MouseEvent) => {
      if (isSuperAdmin) return;

      const target = (e.target as HTMLElement)?.closest(
        "button, a, [role='button'], input[type='submit'], input[type='file'], [data-action]"
      ) as HTMLElement | null;

      if (!target) return;

      const action = detectElementAction(target);
      if (!action) return;

      if (action === "delete" && !canDelete) {
        e.preventDefault();
        e.stopPropagation();
        toast.error("Access denied. You do not have permission to delete in this module.");
        return;
      }

      if (action === "create" && !canCreate) {
        e.preventDefault();
        e.stopPropagation();
        toast.error("Access denied. You do not have permission to create or upload in this module.");
        return;
      }

      if (action === "update" && !canUpdate) {
        e.preventDefault();
        e.stopPropagation();
        toast.error("Access denied. You do not have permission to update data in this module.");
        return;
      }
    },
    [isSuperAdmin, canCreate, canUpdate, canDelete]
  );

  // Apply visual styling and native disabled attributes to restricted elements
  useEffect(() => {
    if (isSuperAdmin || !containerRef.current) return;

    const scanAndShield = () => {
      if (!containerRef.current) return;

      const interactives = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          "button, a, [role='button'], input, [data-action]"
        )
      );

      interactives.forEach((el) => {
        const action = detectElementAction(el);
        if (!action) return;

        let isBlocked = false;
        let actionLabel = "";

        if (action === "delete" && !canDelete) {
          isBlocked = true;
          actionLabel = "delete";
        } else if (action === "create" && !canCreate) {
          isBlocked = true;
          actionLabel = "create / upload";
        } else if (action === "update" && !canUpdate) {
          isBlocked = true;
          actionLabel = "update";
        }

        if (isBlocked) {
          el.setAttribute("data-shielded", action);
          el.setAttribute("title", `Action restricted: No ${actionLabel} permission for this module`);
          
          if ("disabled" in el) {
            (el as HTMLButtonElement | HTMLInputElement).disabled = true;
          }

          el.classList.add("opacity-40", "cursor-not-allowed", "select-none");
        } else if (el.hasAttribute("data-shielded")) {
          // Un-shield if permissions changed reactively
          el.removeAttribute("data-shielded");
          if ("disabled" in el && !el.hasAttribute("data-manually-disabled")) {
            (el as HTMLButtonElement | HTMLInputElement).disabled = false;
          }
          el.classList.remove("opacity-40", "cursor-not-allowed", "select-none");
        }
      });
    };

    scanAndShield();

    const observer = new MutationObserver(() => {
      scanAndShield();
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-action"],
    });

    return () => observer.disconnect();
  }, [isSuperAdmin, canCreate, canUpdate, canDelete]);

  return (
    <div
      ref={containerRef}
      onClickCapture={handleCaptureClick}
      className="w-full h-full contents"
    >
      {children}
    </div>
  );
}

export default DynamicActionShield;

