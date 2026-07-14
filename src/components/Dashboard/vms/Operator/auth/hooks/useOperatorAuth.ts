import { useState } from "react";

import { Operator, OperatorLoginPayload } from "../types/operatorAuth";

import {
  login as loginApi,
  getMe as getMeApi,
  heartbeat as heartbeatApi,
  logout as logoutApi,
} from "../services/operatorAuth.service";

export const useOperatorAuth = () => {
  const [loading, setLoading] = useState(false);

  const [operator, setOperator] = useState<Operator | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedOperator = sessionStorage.getItem("operator");

    return storedOperator ? (JSON.parse(storedOperator) as Operator) : null;
  });

  const login = async (payload: OperatorLoginPayload) => {
    setLoading(true);

    try {
      const response = await loginApi(payload);

      sessionStorage.setItem("operatorAccessToken", response.data.accessToken);

      sessionStorage.setItem(
        "operator",
        JSON.stringify(response.data.operator),
      );

      // sessionStorage.setItem(
      //   "selectedAccount",
      //   JSON.stringify(selectedAccount),
      // );

      setOperator(response.data.operator);

      return response;
    } finally {
      setLoading(false);
    }
  };

  const getMe = async () => {
    setLoading(true);

    try {
      const response = await getMeApi();

      sessionStorage.setItem("operator", JSON.stringify(response.data));

      setOperator(response.data);

      return response;
    } finally {
      setLoading(false);
    }
  };

  const heartbeat = async () => {
    try {
      await heartbeatApi();
    } catch (error) {
      console.error("Heartbeat failed", error);

      if (error instanceof Error && error.message === "SESSION_EXPIRED") {
        await logout();
      }
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore API errors during logout
    } finally {
      sessionStorage.removeItem("operatorAccessToken");
      sessionStorage.removeItem("operator");
      sessionStorage.removeItem("selectedAccount");

      setOperator(null);
    }
  };

  // const isAuthenticated = !!sessionStorage.getItem("operatorAccessToken");
  const isAuthenticated = !!operator;

  return {
    loading,

    operator,

    isAuthenticated,

    login,

    getMe,

    heartbeat,

    logout,
  };
};
