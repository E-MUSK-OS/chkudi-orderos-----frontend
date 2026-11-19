let isRedirecting = false;

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

export const logout = () => {
  if (typeof window === "undefined") {
    return;
  }

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
