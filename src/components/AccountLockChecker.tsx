"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { getToken, logout } from "@/utils/auth";
import { authService } from "@/services/auth/auth.service";

export default function AccountLockChecker() {
  useEffect(() => {
    const checkAccount = async () => {
      const token = getToken();

      if (!token) {
        return;
      }

      try {
        await authService.getMe(token);
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

    // First check
    checkAccount();

    // Every 5 minutes
    const interval = setInterval(checkAccount, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
