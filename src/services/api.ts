const BASE_URL = "https://chkudi-orderos-backend.vercel.app/api/v1";

interface ApiOptions extends RequestInit {
  token?: string;
}

async function request<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,

    headers: {
      "Content-Type": "application/json",

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

  post: <T>(
    url: string,
    body?: unknown,
    token?: string
  ) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),

  put: <T>(
    url: string,
    body?: unknown,
    token?: string
  ) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
      token,
    }),

  patch: <T>(
    url: string,
    body?: unknown,
    token?: string
  ) =>
    request<T>(url, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    }),

  delete: <T>(url: string, token?: string) =>
    request<T>(url, {
      method: "DELETE",
      token,
    }),
};