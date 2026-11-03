let isRedirecting = false;

export const getToken = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("accessToken") ?? "";
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("accessToken", token);
};

export const removeToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("accessToken");
};

export const logout = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  } catch {}

  window.location.replace("/login");
};

export const handleAuthFailure = () => {
  if (typeof window === "undefined" || isRedirecting) return;

  const path = window.location.pathname;
  const isAuthPage =
    path === "/login" ||
    path.startsWith("/login/") ||
    path === "/forgot-password" ||
    path === "/reset-password" ||
    path === "/signup" ||
    path === "/verify-email" ||
    path === "/offline" ||
    path === "/printbridge";

  if (isAuthPage) return;

  isRedirecting = true;

  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  } catch {}

  window.location.replace("/login");
};
