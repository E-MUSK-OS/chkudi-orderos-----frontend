"use client";

import { useEffect, useRef } from "react";
import type { Notification } from "../types/notification";

interface Props {
  unreadCount: number;
  notification: Notification | null;
}

export function useBrowserNotification({ unreadCount, notification }: Props) {
  const previousCount = useRef<number | null>(null);
  const lastNotificationId = useRef<string | null>(null);

  // Request permission once
  useEffect(() => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (previousCount.current === null) {
      previousCount.current = unreadCount;
      return;
    }

    if (!notification) {
      previousCount.current = unreadCount;
      return;
    }

    // Count વધ્યો નથી એટલે નવી notification નથી
    if (unreadCount <= previousCount.current) {
      previousCount.current = unreadCount;
      return;
    }

    // એ જ notification ફરી બતાવવી નહીં
    if (lastNotificationId.current === notification.id) {
      previousCount.current = unreadCount;
      return;
    }

    if (Notification.permission !== "granted") {
      previousCount.current = unreadCount;
      return;
    }

    lastNotificationId.current = notification.id;

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: notification.id,
      requireInteraction: true,
    });

    browserNotification.onclick = () => {
      window.focus();

      browserNotification.close();

      window.location.href = "/dashboard/notification";
    };

    previousCount.current = unreadCount;
  }, [unreadCount, notification]);
}
