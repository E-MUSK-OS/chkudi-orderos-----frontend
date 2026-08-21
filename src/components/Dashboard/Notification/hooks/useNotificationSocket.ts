"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { socket } from "@/lib/socket";
import { notificationKeys } from "./useNotifications";

export const useNotificationSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (!userData) {
      console.log("⚠️ No user found in localStorage");
      return;
    }

    let user;

    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error("❌ Failed to parse user:", error);
      return;
    }

    const userId = user?.id;

    if (!userId) {
      console.log("⚠️ User ID not found");
      return;
    }

    const handleConnect = () => {
      console.log(
        "🟢 Notification Socket Connected:",
        socket.id,
      );

      socket.emit("join:user", userId);

      console.log(
        `👤 Joined notification room: user:${userId}`,
      );
    };

    const handleNewNotification = (notification: unknown) => {
      console.log(
        "🔔 NEW NOTIFICATION RECEIVED:",
        notification,
      );

      // Refresh notification list
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });

      // Refresh unread count
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
    };

    socket.on("connect", handleConnect);

    socket.on(
      "notification:new",
      handleNewNotification,
    );

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);

      socket.off(
        "notification:new",
        handleNewNotification,
      );
    };
  }, [queryClient]);
};