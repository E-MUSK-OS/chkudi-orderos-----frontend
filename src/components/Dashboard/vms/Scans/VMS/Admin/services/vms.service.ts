import { GetVMSResponse } from "../types";
import { API_ENDPOINTS } from "../../vms.service";

export const getUserVMS = async (
  userId: string,
): Promise<GetVMSResponse> => {
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