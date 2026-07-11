import { api } from "./api";

interface LogoutResponse {
  success: boolean;
  message: string;
}

export const operatorLogout = async (): Promise<LogoutResponse> => {
  const token = sessionStorage.getItem("operatorAccessToken");

  if (!token) {
    throw new Error("Operator access token not found.");
  }

  return api.post<LogoutResponse>(
    "/operator-auth/logout",
    undefined,
    token,
  );
};