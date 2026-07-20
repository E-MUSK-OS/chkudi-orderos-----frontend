"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  dismissNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service";

// =====================================
// Query Keys
// =====================================

export const notificationKeys = {
  all: ["notifications"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

// =====================================
// Get Notifications
// =====================================

export const useNotifications = () => {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: getNotifications,
  });
};

// =====================================
// Get Unread Count
// =====================================

// export const useUnreadNotificationCount = () => {
//   return useQuery({
//     queryKey: notificationKeys.unreadCount,
//     queryFn: getUnreadNotificationCount,
//   });
// };

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadNotificationCount,

    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
};

// =====================================
// Mark Notification Read
// =====================================

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
    },
  });
};

// =====================================
// Dismiss Notification
// =====================================

export const useDismissNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissNotification,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
    },
  });
};

// =====================================
// Mark All Read
// =====================================

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
    },
  });
};
