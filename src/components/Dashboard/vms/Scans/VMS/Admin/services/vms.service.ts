import { GetVMSResponse } from "../types";
import { API_ENDPOINTS } from "../../vms.service";

export const getUserVMS = async (userId: string): Promise<GetVMSResponse> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";

  const response = await fetch(API_ENDPOINTS.GET_USER_VMS, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },

    body: JSON.stringify({
      userId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch VMS records.");
  }

  return data;
};

export const deleteVMS = async (id: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";

  const response = await fetch(`${API_ENDPOINTS.DELETE_VMS}/${id}`, {
    method: "DELETE",
    headers: {
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete VMS.");
  }

  return data;
};
