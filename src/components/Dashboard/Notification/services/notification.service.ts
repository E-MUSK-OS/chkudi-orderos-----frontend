import {
  DismissNotificationResponse,
  GetNotificationsResponse,
  MarkNotificationReadResponse,
  UnreadNotificationCountResponse,
} from "../types/notification";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// =====================================
// Headers
// =====================================

const getHeaders = () => {
  const token = localStorage.getItem("accessToken");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// =====================================
// Get Notifications
// =====================================

export const getNotifications = async (): Promise<GetNotificationsResponse> => {
  const response = await fetch(`${BASE_URL}/notifications`, {
    headers: getHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch notifications.");
  }

  return data;
};

// =====================================
// Get Unread Count
// =====================================

export const getUnreadNotificationCount =
  async (): Promise<UnreadNotificationCountResponse> => {
    const response = await fetch(
      `${BASE_URL}/notifications/unread-count`,
      {
        headers: getHeaders(),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch unread count.",
      );
    }

    return data;
  };

// =====================================
// Mark Read
// =====================================

export const markNotificationRead = async (
  notificationId: string,
): Promise<MarkNotificationReadResponse> => {
  const response = await fetch(
    `${BASE_URL}/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: getHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to mark notification as read.",
    );
  }

  return data;
};

// =====================================
// Dismiss Notification
// =====================================

export const dismissNotification = async (
  notificationId: string,
): Promise<DismissNotificationResponse> => {
  const response = await fetch(
    `${BASE_URL}/notifications/${notificationId}/dismiss`,
    {
      method: "PATCH",
      headers: getHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to dismiss notification.",
    );
  }

  return data;
};

// =====================================
// Mark All Read
// =====================================

export const markAllNotificationsRead = async (): Promise<void> => {
  const response = await fetch(
    `${BASE_URL}/notifications/read-all`,
    {
      method: "PATCH",
      headers: getHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to mark all notifications as read.",
    );
  }
};