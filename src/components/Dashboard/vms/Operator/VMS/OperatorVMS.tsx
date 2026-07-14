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

  useEffect(() => {
    const token = sessionStorage.getItem("operatorAccessToken");

    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await operatorLogout();

      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logout failed.");
    } finally {
      sessionStorage.removeItem("operatorAccessToken");
      sessionStorage.removeItem("operator");
      sessionStorage.removeItem("selectedAccount");

      setIsAuthenticated(false);
    }
  };

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
