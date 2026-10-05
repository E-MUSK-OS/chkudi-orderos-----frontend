import axios from "axios";

import { API_BASE_URL } from "@/lib/config";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Bypass-Tunnel-Reminder": "true",
    "ngrok-skip-browser-warning": "true"
  }
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
