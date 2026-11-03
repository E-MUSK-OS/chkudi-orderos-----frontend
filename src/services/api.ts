import { API_BASE_URL } from "@/lib/config";
import { getCurrentUser, getPagePermission, getSlugFromPathname } from "@/utils/pagePermissions";
import { handleAuthFailure } from "@/utils/auth";
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
    cleanEndpoint.startsWith("/setting-masters") ||
    cleanEndpoint.startsWith("/client-configuration") ||
    cleanEndpoint.includes("/dropdown-options") ||
    cleanEndpoint.includes("/me") ||
    cleanEndpoint.startsWith("/profile") ||
    cleanEndpoint.includes("/upload-photo");

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

const BASE_URL = API_BASE_URL;

interface ApiOptions extends RequestInit {
  token?: string;
  signal?: AbortSignal;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    handleAuthFailure();
    return null;
  }

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        throw new Error("Refresh token expired or invalid");
      }

      const json = await res.json();
      const newAccessToken = json?.data?.accessToken;
      if (newAccessToken) {
        localStorage.setItem("accessToken", newAccessToken);
        if (json?.data?.refreshToken) {
          localStorage.setItem("refreshToken", json.data.refreshToken);
        }
        return newAccessToken;
      }
      throw new Error("No access token returned from refresh");
    } catch (err) {
      console.warn("Session expired. Please log in again:", err);
      handleAuthFailure();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: ApiOptions = {},
  isRetry = false
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  if (!verifyClientActionPermission(endpoint, method)) {
    throw new Error(`Access denied. You do not have '${method}' permission for this module.`);
  }

  let effectiveToken = options.token;
  if (!effectiveToken && typeof window !== "undefined") {
    effectiveToken = localStorage.getItem("accessToken") || undefined;
  }

  const { token, headers, body, ...rest } = options;

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    body,
    headers: {
      ...(body instanceof FormData
        ? {
            "ngrok-skip-browser-warning": "true",
          }
        : {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          }),
      ...(effectiveToken && {
        Authorization: `Bearer ${effectiveToken}`,
      }),
      ...headers,
    },
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // 1. If login endpoint itself gave 401, user typed incorrect credentials: do NOT redirect, let form handle error
    if (endpoint === "/auth/login" || endpoint.startsWith("/auth/login")) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.message || "Invalid credentials");
    }

    // 2. If refresh-token endpoint itself gave 401, refresh token is expired/invalid: direct redirect to /login
    if (endpoint.includes("/auth/refresh-token")) {
      handleAuthFailure();
      throw new Error("Session expired. Please log in again.");
    }

    // 3. For any other protected endpoint: try refresh if not already retrying
    if (!isRetry) {
      const freshToken = await refreshAccessToken();
      if (freshToken) {
        return request<T>(endpoint, { ...options, token: freshToken }, true);
      }
    }

    // 4. Refresh token not found, refresh failed, or retrying with new token still gave 401:
    handleAuthFailure();
    throw new Error("Session expired. Please log in again.");
  }

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

  download: async (url: string, token?: string): Promise<Blob> => {
    let effectiveToken = token;
    if (!effectiveToken && typeof window !== "undefined") {
      effectiveToken = localStorage.getItem("accessToken") || undefined;
    }

    let response = await fetch(`${BASE_URL}${url}`, {
      method: "GET",
      headers: {
        "ngrok-skip-browser-warning": "true",
        ...(effectiveToken && {
          Authorization: `Bearer ${effectiveToken}`,
        }),
      },
    });

    if (response.status === 401) {
      const freshToken = await refreshAccessToken();
      if (freshToken) {
        return api.download(url, freshToken);
      }
      handleAuthFailure();
      throw new Error("Session expired. Please log in again.");
    }

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
