import { authService } from "@/services/auth/auth.service";
import { verifyClientActionPermission } from "@/services/api";
import {
  handleAuthFailure,
  requestStepUpAuth,
  setToken,
  tryRememberMeRestore,
} from "@/utils/auth";

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
      const restored = await tryRememberMeRestore();
      if (restored) {
        return makeRequest(restored);
      }
      handleAuthFailure();
      throw new Error("Refresh token not found");
    }

    try {
      const refreshResponse = await authService.refreshToken({
        refreshToken,
      });

      const newAccessToken = refreshResponse.data.accessToken;

      setToken(newAccessToken);

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
      const restored = await tryRememberMeRestore();
      if (restored) {
        return makeRequest(restored);
      }
      handleAuthFailure();
      throw error;
    }
  }

  if (response.status === 403) {
    const cloned = response.clone();
    const errJson = await cloned.json().catch(() => null);
    if (errJson?.code === "STEP_UP_REQUIRED") {
      const freshToken = await requestStepUpAuth();
      if (freshToken) {
        return makeRequest(freshToken);
      }
    }
  }

  return response;
};
