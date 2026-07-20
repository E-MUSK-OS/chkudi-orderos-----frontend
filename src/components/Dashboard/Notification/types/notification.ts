export type NotificationType =
  | "TAG_LOOP"
  | "ORDER"
  | "WALLET"
  | "VMS"
  | "SYSTEM";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NotificationStatus = "UNREAD" | "READ" | "DISMISSED";

export interface Notification {
  id: string;

  title: string;

  message: string;

  type: NotificationType;

  priority: NotificationPriority;

  status: NotificationStatus;

  entityId: string | null;

  entityType: string | null;

  readAt: string | null;

  dismissedAt: string | null;

  createdAt: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  message: string;
  data: Notification[];
}

export interface UnreadNotificationCountResponse {
  success: boolean;
  message: string;
  data: {
    unreadCount: number;
  };
}

export interface MarkNotificationReadResponse {
  success: boolean;
  message: string;
  data: Notification;
}

export interface DismissNotificationResponse {
  success: boolean;
  message: string;
  data: Notification;
}
