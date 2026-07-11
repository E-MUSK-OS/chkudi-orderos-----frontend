"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import OperatorContent from "./OperatorContent";
import OperatorLoginModal from "../auth/components/OperatorLoginModal";
import { operatorLogout } from "@/services/operatorAuth.service";
import { toast } from "sonner";

const OperatorVMS = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("operatorAccessToken");

    setIsAuthenticated(!!token);
  }, []);

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

  const handleLogout = async () => {
    try {
      const response = await operatorLogout();

      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Logout failed.");
    } finally {
      sessionStorage.removeItem("operatorAccessToken");
      sessionStorage.removeItem("operator");

      setIsAuthenticated(false);
    }
  };

  return (
    <DashboardLayout title="Operator VMS">
      <OperatorContent onLogout={handleLogout} />
    </DashboardLayout>
  );
};

export default OperatorVMS;
