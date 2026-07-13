import { GetVMSResponse } from "../types";
import { API_ENDPOINTS } from "../../vms.service";

export const getUserVMS = async (userId: string): Promise<GetVMSResponse> => {
  const response = await fetch(API_ENDPOINTS.GET_USER_VMS, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
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
  const response = await fetch(`${API_ENDPOINTS.DELETE_VMS}/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete VMS.");
  }

  return data;
};
