import { API_BASE_URL } from "@/lib/config";

export const API_ENDPOINTS = {
  GET_USER_VMS: `${API_BASE_URL}/vms/user`,
  DELETE_VMS: `${API_BASE_URL}/vms`,
  UPDATE_PACKING_SCAN: `${API_BASE_URL}/vms/packing-scan`,
};

export const updatePackingScan = async ({
  trackingId,
  userId,
}: {
  trackingId: string;
  userId: string;
}) => {
  const response = await fetch(
    API_ENDPOINTS.UPDATE_PACKING_SCAN,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },

      body: JSON.stringify({
        trackingId,
        userId,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update packing scan.",
    );
  }

  return data;
};