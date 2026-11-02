import { api } from "@/services/api";
import type { ClientConfigurationData } from "../types/clientConfiguration.types";

const BASE_URL = "/client-configuration";
export const CLIENT_CONFIG_STORAGE_KEY = "client_configuration";

export interface ClientConfigApiResponse {
  success: boolean;
  message: string;
  data: ClientConfigurationData;
}

export const clientConfigurationService = {
  async getClientConfig(): Promise<ClientConfigurationData> {
    try {
      const response = await api.get<ClientConfigApiResponse>(BASE_URL);
      if (response?.data) {
        if (typeof window !== "undefined") {
          localStorage.setItem(CLIENT_CONFIG_STORAGE_KEY, JSON.stringify(response.data));
          window.dispatchEvent(new Event("client_configuration_updated"));
        }
        return response.data;
      }
    } catch (err) {
      console.warn("Failed to fetch fresh client config from server:", err);
    }

    // Fallback to local storage cache if network is unavailable
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(CLIENT_CONFIG_STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        // ignore parse error
      }
    }

    return {
      clientName: "Enterprise Plus",
      subscriptionPlan: "Enterprise Plus",
      hasSeparateInventoryDept: false,
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
      ],
      enabledRoutes: [],
      configurationData: null,
      isDefault: true,
    };
  },

  async updateClientConfig(data: Partial<ClientConfigurationData>): Promise<ClientConfigurationData> {
    const response = await api.put<ClientConfigApiResponse>(BASE_URL, data);
    if (response?.data) {
      if (typeof window !== "undefined") {
        localStorage.setItem(CLIENT_CONFIG_STORAGE_KEY, JSON.stringify(response.data));
        window.dispatchEvent(new Event("client_configuration_updated"));
      }
      return response.data;
    }
    throw new Error(response?.message || "Failed to update client configuration");
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

