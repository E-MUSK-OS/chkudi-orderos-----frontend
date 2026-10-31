import axios from "axios";

import { API_BASE_URL } from "@/lib/config";
import { verifyClientActionPermission } from "./api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Bypass-Tunnel-Reminder": "true",
    "ngrok-skip-browser-warning": "true"
  }
});

axiosInstance.interceptors.request.use((config) => {
  const method = (config.method || "get").toUpperCase();
  const url = config.url || "";
  if (!verifyClientActionPermission(url, method)) {
    return Promise.reject(new Error(`Access denied. You do not have '${method}' permission for this module.`));
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    // If a request succeeds, the backend is up
    import("@/store/useConnectionStore").then(({ useConnectionStore }) => {
      if (useConnectionStore.getState().isBackendDown) {
        useConnectionStore.getState().setBackendDown(false);
      }
    });
    return response;
  },
  (error) => {
    if (
      !error.response || // Network Error / Timeout
      error.response.status >= 500 // 5xx Server Error
    ) {
      import("@/store/useConnectionStore").then(({ useConnectionStore }) => {
        useConnectionStore.getState().setBackendDown(true);
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
