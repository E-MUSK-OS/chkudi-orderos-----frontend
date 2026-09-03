import axios from "axios";

import { API_BASE_URL } from "@/lib/config";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Bypass-Tunnel-Reminder": "true",
    "ngrok-skip-browser-warning": "true"
  }
});

export default axiosInstance;
