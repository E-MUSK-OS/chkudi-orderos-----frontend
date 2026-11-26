import { API_BASE_URL } from "@/lib/config";

let isRedirecting = false;
let isExplicitLogout = false;
let rememberRestorePromise: Promise<string | null> | null = null;

export const STEP_UP_EVENT = "orderos:step-up-required";
export const SKIP_AUTO_LOGIN_KEY = "orderos_skip_auto_login";

const readCsrfFromDocument = (): string => {
  if (typeof document === "undefined") return "";
  const pairs = document.cookie.split(";").map((c) => c.trim());
  for (const pair of pairs) {
    if (pair.startsWith("__Host-csrf=")) {
      return decodeURIComponent(pair.slice("__Host-csrf=".length));
    }
    if (pair.startsWith("csrf_token=")) {
      return decodeURIComponent(pair.slice("csrf_token=".length));
    }
  }
  return "";
};

export const ensureCsrfToken = async (): Promise<string> => {
  const existing = readCsrfFromDocument();
  if (existing) return existing;
  if (typeof window === "undefined") return "";
  try {
    const res = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
      method: "GET",
      credentials: "include",
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    const json = await res.json().catch(() => null);
    return json?.data?.csrfToken || readCsrfFromDocument() || "";
  } catch {
    return "";
  }
};

/**
 * Attempts to restore a session once using the HttpOnly Remember Me cookie.
 * Uses an in-flight singleton mutex so parallel 401 requests never trigger duplicate rotations.
 */
export const tryRememberMeRestore = async (): Promise<string | null> => {
  if (typeof window === "undefined" || isExplicitLogout) return null;
  if (rememberRestorePromise) return rememberRestorePromise;

  rememberRestorePromise = (async () => {
    try {
      const csrfToken = await ensureCsrfToken();
      const res = await fetch(`${API_BASE_URL}/auth/remember-login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      const data = json?.data;
      if (!data?.accessToken) return null;

      setToken(data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      rememberRestorePromise = null;
    }
  })();

  return rememberRestorePromise;
};

/**
 * Prompts the user for password confirmation via StepUpAuthModal when a sensitive
 * action is attempted on a Remember Me session.
 */
export const requestStepUpAuth = (): Promise<string | null> => {
  if (typeof window === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent(STEP_UP_EVENT, {
        detail: { resolve },
      })
    );
  });
};

const PUBLIC_AUTH_PATHS = [
  "/",
  "/features",
  "/marketplaces",
  "/about",
  "/about-us",
  "/contact",
  "/contact-us",
  "/privacy",
  "/privacy-policy",
  "/terms",
  "/terms-and-conditions",
  "/terms-conditions",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/signup",
  "/verify-email",
  "/offline",
  "/printbridge",
];

const setAuthCookie = (token: string) => {
  if (typeof document === "undefined") return;
  // Expire in 7 days, SameSite=Lax
  document.cookie = `accessToken=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
};

const clearAuthCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
};

export const getToken = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const token = localStorage.getItem("accessToken") ?? "";
  if (token === "null" || token === "undefined") return "";
  return token;
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }

  isExplicitLogout = false;
  try {
    sessionStorage.removeItem(SKIP_AUTO_LOGIN_KEY);
  } catch {}
  localStorage.setItem("accessToken", token);
  setAuthCookie(token);
};

export const removeToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("accessToken");
  clearAuthCookie();
};

export const logout = async () => {
  if (typeof window === "undefined") {
    return;
  }

  isExplicitLogout = true;
  try {
    sessionStorage.setItem(SKIP_AUTO_LOGIN_KEY, "1");
  } catch {}

  try {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    const accessToken = localStorage.getItem("accessToken") || "";
    const csrfToken = await ensureCsrfToken();
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  } catch {}

  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    clearAuthCookie();
  } catch {}

  window.location.replace("/login");
};

export const isPublicRoute = (rawPath?: string): boolean => {
  const path = rawPath?.split("?")[0]?.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "") return true;
  return PUBLIC_AUTH_PATHS.some((p) => p !== "/" && (path === p || path.startsWith(p + "/")));
};

export const handleAuthFailure = () => {
  if (typeof window === "undefined" || isRedirecting) return;

  const rawPath = window.location.pathname;
  if (isPublicRoute(rawPath)) return;

  isRedirecting = true;

  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    clearAuthCookie();
  } catch {}

  const currentPath = window.location.pathname + window.location.search;
  const redirectTarget = currentPath && currentPath !== "/" ? `/login?redirect=${encodeURIComponent(currentPath)}` : "/login";

  window.location.replace(redirectTarget);

  setTimeout(() => {
    isRedirecting = false;
  }, 2000);
};

export const getCurrentUserName = (fallback = "TOPLOT CK"): string => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem("user");
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const name =
      parsed?.fullName?.trim() ||
      parsed?.username?.trim() ||
      parsed?.name?.trim() ||
      "";
    return name || fallback;
  } catch {
    return fallback;
  }
};
