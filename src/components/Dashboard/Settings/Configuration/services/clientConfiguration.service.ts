import { api } from "@/services/api";
import type { ClientConfigurationData } from "../types/clientConfiguration.types";

const BASE_URL = "/client-configuration";
export const CLIENT_CONFIG_STORAGE_KEY = "client_configuration";

export interface ClientConfigApiResponse {
  success: boolean;
  message: string;
  data: ClientConfigurationData;
}

export const DEFAULT_CLIENT_CONFIG: ClientConfigurationData = {
  clientName: "Enterprise Plus",
  subscriptionPlan: "Enterprise Plus",
  hasSeparateInventoryDept: false,
  dropdownManagementMode: "FORM_OTHER",
  enabledSections: [
    "dashboard",
    "vms",
    "products",
    "order-process",
    "products-analytics",
    "transaction",
    "offline-sales",
    "purchase",
    "settings",
    "account",
  ],
  enabledRoutes: [],
  configurationData: null,
  isDefault: true,
};

let inFlightPromise: Promise<ClientConfigurationData> | null = null;

export const clientConfigurationService = {
  async getClientConfig(): Promise<ClientConfigurationData> {
    if (inFlightPromise) {
      return inFlightPromise;
    }

    inFlightPromise = (async () => {
      try {
        const response = await api.get<ClientConfigApiResponse>(BASE_URL);
        if (response?.data) {
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(CLIENT_CONFIG_STORAGE_KEY, JSON.stringify(response.data));
              window.dispatchEvent(new Event("client_configuration_updated"));
            } catch {
              // ignore storage error
            }
          }
          return response.data;
        }
      } catch (err: any) {
        // Silently handle if offline or endpoint unavailable
        const errMsg = String(err?.message || "");
        if (!errMsg.includes("404")) {
          console.debug("Notice fetching client configuration:", err?.message || err);
        }
      }

      // Fallback to local storage cache if network is unavailable or endpoint is missing
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(CLIENT_CONFIG_STORAGE_KEY);
          if (cached) return JSON.parse(cached);
        } catch {
          // ignore parse error
        }

        // Cache default config so subsequent mounts don't repeatedly hit fallback
        try {
          localStorage.setItem(CLIENT_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_CLIENT_CONFIG));
        } catch {
          // ignore storage error
        }
      }

      return DEFAULT_CLIENT_CONFIG;
    })().finally(() => {
      inFlightPromise = null;
    });

    return inFlightPromise;
  },

  async updateClientConfig(data: Partial<ClientConfigurationData>): Promise<ClientConfigurationData> {
    try {
      const response = await api.put<ClientConfigApiResponse>(BASE_URL, data);
      if (response?.data) {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CLIENT_CONFIG_STORAGE_KEY, JSON.stringify(response.data));
            window.dispatchEvent(new Event("client_configuration_updated"));
          } catch {
            // ignore storage error
          }
        }
        return response.data;
      }
    } catch {
      // If remote update fails, still update localStorage so client features remain consistent
      if (typeof window !== "undefined") {
        const current = clientConfigurationService.getLocalCachedConfig() || DEFAULT_CLIENT_CONFIG;
        const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
        try {
          localStorage.setItem(CLIENT_CONFIG_STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event("client_configuration_updated"));
        } catch {
          // ignore storage error
        }
        return updated;
      }
    }

    const current = clientConfigurationService.getLocalCachedConfig() || DEFAULT_CLIENT_CONFIG;
    const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CLIENT_CONFIG_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("client_configuration_updated"));
      } catch {
        // ignore storage error
      }
    }
    return updated;
  },

  getLocalCachedConfig(): ClientConfigurationData | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(CLIENT_CONFIG_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

export function getLocalDropdownManagementMode(): "SETTING_MASTERS" | "FORM_OTHER" {
  const cached = clientConfigurationService.getLocalCachedConfig();
  if (cached?.dropdownManagementMode) return cached.dropdownManagementMode;
  if (cached?.configurationData && typeof cached.configurationData === "object") {
    if (cached.configurationData.dropdownManagementMode) {
      return cached.configurationData.dropdownManagementMode;
    }
  }
  return "FORM_OTHER";
}
