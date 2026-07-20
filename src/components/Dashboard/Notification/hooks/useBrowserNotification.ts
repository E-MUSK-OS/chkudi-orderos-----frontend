"use client";

import { useEffect, useRef } from "react";

interface Props {
  unreadCount: number;
  title?: string;
  message?: string;
}

export function useBrowserNotification({
  unreadCount,
  title = "New Notification",
  message = "You have received a new notification.",
}: Props) {
  const previousCount = useRef<number | null>(null);

  // Ask permission once
  useEffect(() => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!("Notification" in window)) return;

    if (previousCount.current === null) {
      previousCount.current = unreadCount;
      return;
    }

    if (
      unreadCount > previousCount.current &&
      Notification.permission === "granted"
    ) {
      new Notification(title, {
        body: message,
        icon: "/logo.png", // તમારી logo
        badge: "/logo.png",
      });
    }

    previousCount.current = unreadCount;
  }, [unreadCount, title, message]);
}