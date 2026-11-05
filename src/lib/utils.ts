import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves a media path or URL to an absolute URL when needed.
 * Supports:
 * - Full URLs (http://, https://)
 * - Base64 Data URIs (data:image/...)
 * - Blob URLs (blob:...)
 * - Root-relative server paths (/uploads/...) -> prepends NEXT_PUBLIC_SOCKET_URL or fallback
 */
export function getMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }
  const backend = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
  return `${backend.replace(/\/$/, "")}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

/**
 * Calculates available vertical space above and below an element, taking into account
 * the window/viewport AND any scrollable or clipping parent containers (e.g. overflow-y-auto, overflow-hidden).
 */
export function getAvailableVerticalSpace(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  let spaceBelow = viewportHeight - rect.bottom;
  let spaceAbove = rect.top;

  let parent = el.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    const overflow = style.overflow;
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "hidden" ||
      overflow === "auto" ||
      overflow === "scroll" ||
      overflow === "hidden"
    ) {
      const parentRect = parent.getBoundingClientRect();
      const parentSpaceBelow = parentRect.bottom - rect.bottom;
      const parentSpaceAbove = rect.top - parentRect.top;
      spaceBelow = Math.min(spaceBelow, parentSpaceBelow);
      spaceAbove = Math.min(spaceAbove, parentSpaceAbove);
    }
    parent = parent.parentElement;
  }

  return { rect, viewportHeight, viewportWidth, spaceBelow, spaceAbove };
}


/**
 * Returns the first 2 letters of a company name (e.g. "BluePeak" -> "BL", "JAY BHAVANI" -> "JA").
 */
export function getCompanyInitials(name?: string | null): string {
  if (!name || !name.trim()) return "CO";
  const clean = name.trim().replace(/^[^a-zA-Z0-9]+/, "");
  if (clean.length >= 2) {
    return clean.substring(0, 2).toUpperCase();
  }
  return (clean || "CO").padEnd(2, "O").toUpperCase();
}
