"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import OperatorContent from "./OperatorContent";
import OperatorLoginForm from "../auth/components/OperatorLoginForm";
import { Account } from "@/components/Dashboard/vms/Admin/Account/types/account";
import { operatorLogout } from "@/services/operatorAuth.service";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

const OperatorVMS = () => {
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
      sessionStorage.removeItem("operatorTabActive");

      setIsAuthenticated(false);
    }
  };

  // Route change cleanup: if operator navigates away from VMS, auto-logout
  useEffect(() => {
    if (isAuthenticated && pathname !== "/dashboard/vms/operator/vms") {
      void handleLogout();
    }
  }, [pathname]);

  return (
    <DashboardLayout title="Operator VMS">
      {isAuthenticated === null ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
        </div>
      ) : !isAuthenticated ? (
        <div className="flex min-h-[70vh] items-center justify-center py-6 sm:py-10">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#E7E0D2] bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#0F1626]">
            <div className="border-b border-[#E7E0D2] bg-[#0A0E1A] px-6 py-5 text-center dark:border-white/[0.08] dark:bg-[#080B11]">
              <h2 className="text-xl font-bold text-[#E8C16D] sm:text-2xl">
                Operator Login
              </h2>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                Login to start barcode scanning and video recording.
              </p>
            </div>
            <div className="p-6 sm:p-7">
              <OperatorLoginForm
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
