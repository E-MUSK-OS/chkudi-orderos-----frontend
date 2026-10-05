"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import OperatorContent from "./OperatorContent";
import OperatorLoginModal from "../auth/components/OperatorLoginModal";
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

  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <OperatorLoginModal
        open
        onClose={() => {
          // Mark this tab as having an active operator session
          sessionStorage.setItem("operatorTabActive", "true");
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <DashboardLayout title="Operator VMS">
      <OperatorContent onLogout={handleLogout} />
    </DashboardLayout>
  );
};

export default OperatorVMS;
