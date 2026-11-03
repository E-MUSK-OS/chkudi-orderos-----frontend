"use client";

import { useState, useEffect } from "react";
import {
  clientConfigurationService,
  getLocalDropdownManagementMode,
} from "../services/clientConfiguration.service";
import type { DropdownManagementMode } from "../types/clientConfiguration.types";

export function useDropdownManagementMode(): {
  mode: DropdownManagementMode;
  isSettingMastersOnly: boolean;
  isFormOtherAllowed: boolean;
  isLoading: boolean;
} {
  const [mode, setMode] = useState<DropdownManagementMode>(() =>
    getLocalDropdownManagementMode()
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Listen for storage / custom event updates
    const handleUpdate = () => {
      setMode(getLocalDropdownManagementMode());
    };

    window.addEventListener("client_configuration_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // 2. Fetch fresh config in background if not already cached
    const cached = clientConfigurationService.getLocalCachedConfig();
    if (!cached) {
      setIsLoading(true);
      clientConfigurationService
        .getClientConfig()
        .then((data) => {
          if (data?.dropdownManagementMode) {
            setMode(data.dropdownManagementMode);
          } else if (data?.configurationData?.dropdownManagementMode) {
            setMode(data.configurationData.dropdownManagementMode);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }

    return () => {
      window.removeEventListener("client_configuration_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return {
    mode,
    isSettingMastersOnly: mode === "SETTING_MASTERS",
    isFormOtherAllowed: mode === "FORM_OTHER",
    isLoading,
  };
}

