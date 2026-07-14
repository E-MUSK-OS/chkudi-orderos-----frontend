import { API_BASE_URL } from "@/lib/config";

// const BASE_URL = "https://chkudi-orderos-backend.vercel.app/api/v1";
// const BASE_URL = "http://localhost:5000/api/v1";
const BASE_URL = API_BASE_URL;

interface ApiOptions extends RequestInit {
  token?: string;
}

async function request<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, headers, body, ...rest } = options;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,

    body,

    headers: {
      ...(body instanceof FormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),

      ...(token && {
        Authorization: `Bearer ${token}`,
      }),

      ...headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const api = {
  get: <T>(url: string, token?: string) =>
    request<T>(url, {
      method: "GET",
      token,
    }),

  post: <T>(url: string, body?: unknown, token?: string) =>
    request<T>(url, {
      method: "POST",

      body: body instanceof FormData ? body : JSON.stringify(body),

      token,
    }),

  put: <T>(url: string, body?: unknown, token?: string) =>
    request<T>(url, {
      method: "PUT",

      body: body instanceof FormData ? body : JSON.stringify(body),

      token,
    }),

  patch: <T>(url: string, body?: unknown, token?: string) =>
    request<T>(url, {
      method: "PATCH",

      body: body instanceof FormData ? body : JSON.stringify(body),

      token,
    }),

  delete: <T>(url: string, token?: string) =>
    request<T>(url, {
      method: "DELETE",
      token,
    }),
};
