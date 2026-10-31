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
