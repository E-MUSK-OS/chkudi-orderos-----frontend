"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

import { getToken, logout, handleAuthFailure } from "@/utils/auth";
import { authService } from "@/services/auth/auth.service";

const AUTH_PAGES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/signup",
  "/verify-email",
  "/offline",
  "/printbridge",
];

function isPublicAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function AccountLockChecker() {
  const pathname = usePathname();

  useEffect(() => {
    const checkTokensExist = () => {
      if (typeof window === "undefined") return;
      if (isPublicAuthPage(window.location.pathname)) return;

      const token = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!token && !refreshToken) {
        handleAuthFailure();
      }
    };

    const checkAccountServer = async () => {
      if (typeof window === "undefined") return;
      if (isPublicAuthPage(window.location.pathname)) return;

      const token = getToken();
      const refreshToken = localStorage.getItem("refreshToken");

      if (!token && !refreshToken) {
        handleAuthFailure();
        return;
      }

      try {
        const response = await authService.getMe(token || "");
        if (response?.data) {
          const currentRaw = localStorage.getItem("user");
          const newRaw = JSON.stringify(response.data);
          if (currentRaw !== newRaw) {
            localStorage.setItem("user", newRaw);
            window.dispatchEvent(new Event("storage"));
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Something went wrong";

        if (message === "Your account has been locked by administrator.") {
          toast.error(message);
          setTimeout(() => {
            logout();
          }, 1000);
        }
      }
    };

    // Check immediately on mount and route change
    checkTokensExist();

    // Fast check (every 500ms) for local storage changes
    const tokenInterval = setInterval(checkTokensExist, 500);

    // Periodic server-side check (every 30s)
    const serverInterval = setInterval(checkAccountServer, 30 * 1000);

    // Immediate check on tab focus or visibility change (e.g. clicking back from DevTools)
    const handleFocus = () => {
      checkTokensExist();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(serverInterval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [pathname]);

  return null;
}
