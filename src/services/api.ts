import { API_BASE_URL } from "@/lib/config";
import { getCurrentUser, getPagePermission, getSlugFromPathname } from "@/utils/pagePermissions";
import { toast } from "sonner";

export function verifyClientActionPermission(endpoint: string, method: string): boolean {
  if (typeof window === "undefined") return true;

  const m = (method || "GET").toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(m)) return true;

  const cleanEndpoint = endpoint.toLowerCase();

  // Safe queries / auth allowlist
  const isSafeEndpoint =
    cleanEndpoint.startsWith("/auth/") ||
    cleanEndpoint.includes("/login") ||
    cleanEndpoint.includes("/refresh-token") ||
    cleanEndpoint.includes("/search") ||
    cleanEndpoint.includes("/filter") ||
    cleanEndpoint.includes("/query") ||
    cleanEndpoint.includes("/export") ||
    cleanEndpoint.includes("/summary") ||
    cleanEndpoint.includes("/stats") ||
    cleanEndpoint.includes("/me");

  if (isSafeEndpoint) return true;

  const user = getCurrentUser();
  if (!user || user.role === "SUPERADMIN") return true;

  const currentPath = window.location.pathname;
  const activeSlug = getSlugFromPathname(currentPath);
  const perms = getPagePermission(activeSlug, user);

  if (m === "POST" && !perms.create) {
    toast.error("Access denied. You do not have permission to create or upload in this module.");
    return false;
  }
  if ((m === "PUT" || m === "PATCH") && !perms.update) {
    toast.error("Access denied. You do not have permission to update data in this module.");
    return false;
  }
  if (m === "DELETE" && !perms.delete) {
    toast.error("Access denied. You do not have permission to delete items in this module.");
    return false;
  }

  return true;
}

// const BASE_URL = "https://chkudi-orderos-backend.vercel.app/api/v1";
// const BASE_URL = "http://localhost:5000/api/v1";
const BASE_URL = API_BASE_URL;

interface ApiOptions extends RequestInit {
  token?: string;
  signal?: AbortSignal;
}

async function request<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  if (!verifyClientActionPermission(endpoint, method)) {
    throw new Error(`Access denied. You do not have '${method}' permission for this module.`);
  }

  const { token, headers, body, ...rest } = options;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,

    body,

    headers: {
      ...(body instanceof FormData
        ? {
            "ngrok-skip-browser-warning": "true"
          }
        : {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          }),

      ...(token && {
        Authorization: `Bearer ${token}`,
      }),

      ...headers,
    },
  });

  const contentType = response.headers.get("content-type");
  let data: any;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
}

export const api = {
  get: <T>(url: string, token?: string) =>
    request<T>(url, {
      method: "GET",
      token,
    }),

  post: <T>(url: string, body?: unknown, token?: string) =>
    request<T>(url, {
      method: "POST",

      body: body instanceof FormData ? body : JSON.stringify(body),

      token,
    }),

  put: <T>(url: string, body?: unknown, token?: string) =>
    request<T>(url, {
      method: "PUT",

      body: body instanceof FormData ? body : JSON.stringify(body),

      token,
    }),

  patch: <T>(url: string, body?: unknown, token?: string) =>
    request<T>(url, {
      method: "PATCH",

      body: body instanceof FormData ? body : JSON.stringify(body),

      token,
    }),

  delete: <T>(url: string, token?: string) =>
    request<T>(url, {
      method: "DELETE",
      token,
    }),

  download: async (url: string, token?: string) => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "GET",

      headers: {
        "ngrok-skip-browser-warning": "true",
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
      },
    });

    if (!response.ok) {
      let errorDetail = `Failed to download file (${response.status} ${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson?.message) {
          errorDetail += `: ${errorJson.message}`;
        }
      } catch {
        // ignore non-json error responses
      }
      throw new Error(errorDetail);
    }

    return response.blob();
  },
};
