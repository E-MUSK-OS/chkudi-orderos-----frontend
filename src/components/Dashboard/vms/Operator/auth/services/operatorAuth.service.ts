import { API_BASE_URL } from "@/lib/config";
import {
  OperatorLoginPayload,
  OperatorLoginResponse,
  OperatorMeResponse,
  OperatorResponse,
} from "../types/operatorAuth";

// const BASE_URL = "https://chkudi-orderos-backend.vercel.app/api/v1/operator-auth";
// const BASE_URL = "http://localhost:5000/api/v1/operator-auth";
const BASE_URL = `${API_BASE_URL}/operator-auth`;

const getHeaders = (): HeadersInit => {
  const token = sessionStorage.getItem("operatorAccessToken");

  return {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    Authorization: `Bearer ${token}`,
  };
};

export const login = async (
  payload: OperatorLoginPayload,
): Promise<OperatorLoginResponse> => {
  const adminToken = localStorage.getItem("accessToken");

  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data: OperatorLoginResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};

export const getMe = async (): Promise<OperatorMeResponse> => {
  const response = await fetch(`${BASE_URL}/me`, {
    method: "GET",
    headers: getHeaders(),
  });

  const data: OperatorMeResponse = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch operator.");
  }

  return data;
};

// export const heartbeat = async (): Promise<OperatorResponse> => {
//   const response = await fetch(`${BASE_URL}/heartbeat`, {
//     method: "POST",
//     headers: getHeaders(),
//   });

//   const data: OperatorResponse = await response.json();

//   if (!response.ok) {
//     throw new Error(data.message);
//   }

//   return data;
// };

export const heartbeat = async (): Promise<OperatorResponse> => {
  const response = await fetch(`${BASE_URL}/heartbeat`, {
    method: "POST",
    headers: getHeaders(),
  });

  const data: OperatorResponse = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("SESSION_EXPIRED");
    }

    throw new Error(data.message);
  }

  return data;
};

export const logout = async (): Promise<OperatorResponse> => {
  const response = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: getHeaders(),
  });

  const data: OperatorResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
};
