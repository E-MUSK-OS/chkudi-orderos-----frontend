import { api } from "./api";

interface LogoutResponse {
  success: boolean;
  message: string;
}

export const operatorLogout = async (explicitToken?: string): Promise<LogoutResponse> => {
  const token =
    explicitToken ||
    (typeof window !== "undefined" ? localStorage.getItem("operatorAccessToken") : null);

  if (!token) {
    return { success: true, message: "Operator logged out." };
  }

  try {
    return await api.post<LogoutResponse>(
      "/operator-auth/logout",
      undefined,
      token,
    );
  } catch (error) {
    console.warn("Operator backend logout warning:", error);
    return { success: true, message: "Operator logged out." };
  }
};
