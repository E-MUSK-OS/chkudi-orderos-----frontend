import { authService } from "@/services/auth/auth.service";
import { verifyClientActionPermission } from "@/services/api";
import { handleAuthFailure } from "@/utils/auth";

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const method = (options.method || "GET").toUpperCase();
  if (!verifyClientActionPermission(url, method)) {
    throw new Error(`Access denied. You do not have '${method}' permission for this module.`);
  }

  let accessToken = localStorage.getItem("accessToken");

  const makeRequest = (token: string | null) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let response = await makeRequest(accessToken);

  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      handleAuthFailure();
      throw new Error("Refresh token not found");
    }

    try {
      const refreshResponse = await authService.refreshToken({
        refreshToken,
      });

      const newAccessToken = refreshResponse.data.accessToken;

      localStorage.setItem("accessToken", newAccessToken);

      if (refreshResponse.data.refreshToken) {
        localStorage.setItem(
          "refreshToken",
          refreshResponse.data.refreshToken
        );
      }

      response = await makeRequest(newAccessToken);
      if (response.status === 401) {
        handleAuthFailure();
      }
    } catch (error) {
      handleAuthFailure();
      throw error;
    }
  }

  return response;
};
