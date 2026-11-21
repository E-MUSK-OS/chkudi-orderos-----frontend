"use client";

import { useEffect, useState, useMemo } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import OperatorContent from "./OperatorContent";
import OperatorLoginForm from "../auth/components/OperatorLoginForm";
import { Account } from "@/components/Dashboard/vms/Admin/Account/types/account";
import { operatorLogout } from "@/services/operatorAuth.service";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OperatorVMS = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();

  // On mount: detect new tab vs refresh using sessionStorage "tab marker"
  useEffect(() => {
    const isExistingTab = sessionStorage.getItem("operatorTabActive");

    if (!isExistingTab) {
      // New tab opened — wipe operator session from localStorage
      localStorage.removeItem("operatorAccessToken");
      localStorage.removeItem("operator");
      localStorage.removeItem("selectedAccount");
      setIsAuthenticated(false);
    } else {
      // Same tab (refresh) — check if token still exists
      const token = localStorage.getItem("operatorAccessToken");
      setIsAuthenticated(!!token);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const response = await operatorLogout();

      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logout failed.");
    } finally {
      localStorage.removeItem("operatorAccessToken");
      localStorage.removeItem("operator");
      localStorage.removeItem("selectedAccount");
      localStorage.removeItem("vms_source");
      localStorage.removeItem("vms_from_order_process");
      sessionStorage.removeItem("operatorTabActive");
      sessionStorage.removeItem("vms_source");
      sessionStorage.removeItem("vms_from_order_process");

      // Strip query parameters (?source=flipkart, ?from=order_process) from URL so account name is not locked on next login
      if (typeof window !== "undefined") {
        const cleanPath = window.location.pathname;
        window.history.replaceState({}, "", cleanPath);
      }
      router.replace(pathname || "/vms/operator/vms");

      setIsAuthenticated(false);
    }
  };

  // Route change cleanup: if operator navigates away from VMS, auto-logout
  useEffect(() => {
    if (
      isAuthenticated &&
      pathname !== "/dashboard/vms/operator/vms" &&
      pathname !== "/vms/operator/vms"
    ) {
      void handleLogout();
    }
  }, [pathname, isAuthenticated]);

  // Unmount cleanup: if operator leaves page without explicit logout, release session
  useEffect(() => {
    return () => {
      const token = localStorage.getItem("operatorAccessToken");
      if (token) {
        void operatorLogout().catch(() => {});
        localStorage.removeItem("operatorAccessToken");
        localStorage.removeItem("operator");
        localStorage.removeItem("selectedAccount");
        sessionStorage.removeItem("operatorTabActive");
      }
    };
  }, []);

  const isFlipkartSource = useMemo(() => {
    const fromSearch =
      /(flip|filp)[kc]art/i.test(searchParams?.get("source") || "") ||
      searchParams?.get("from") === "order_process";

    const fromWindowSearch =
      typeof window !== "undefined" &&
      (/(flip|filp)[kc]art/i.test(new URLSearchParams(window.location.search).get("source") || "") ||
        new URLSearchParams(window.location.search).get("from") === "order_process");

    const fromSession =
      typeof window !== "undefined" &&
      (/(flip|filp)[kc]art/i.test(sessionStorage.getItem("vms_source") || "") ||
        sessionStorage.getItem("vms_from_order_process") === "true");

    const fromLocal =
      typeof window !== "undefined" &&
      (/(flip|filp)[kc]art/i.test(localStorage.getItem("vms_source") || "") ||
        localStorage.getItem("vms_from_order_process") === "true");

    return Boolean(fromSearch || fromWindowSearch || fromSession || fromLocal);
  }, [searchParams]);

  return (
    <DashboardLayout title="Operator VMS">
      {isAuthenticated === null ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
        </div>
      ) : !isAuthenticated ? (
        <div className="flex min-h-[70vh] items-center justify-center py-6 sm:py-10">
          <div className="w-full max-w-md overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#0F1626]">
            <div className="border-b border-[#EFE5D5] bg-gradient-to-b from-[#FDE8B5]/60 via-[#FFF4DD]/40 to-white px-5 sm:px-6 py-4 sm:py-5 text-center dark:border-white/[0.08] dark:bg-none dark:bg-[#080B11]">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#111827] dark:text-[#E8C16D]">
                Operator Login
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-300">
                Login to start barcode scanning and video recording.
              </p>
            </div>
            <div className="p-5 sm:p-7">
              <OperatorLoginForm
                isFlipkartSource={isFlipkartSource}
                onSuccess={(account: Account) => {
                  localStorage.setItem("selectedAccount", JSON.stringify(account));
                  sessionStorage.setItem("operatorTabActive", "true");
                  setIsAuthenticated(true);
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <OperatorContent onLogout={handleLogout} />
      )}
    </DashboardLayout>
  );
};

export default OperatorVMS;
