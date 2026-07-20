"use client";

import { useEffect, useRef } from "react";

export function useNotificationSound(unreadCount: number) {
  const previousCount = useRef<number | null>(null);

  useEffect(() => {
    if (previousCount.current === null) {
      previousCount.current = unreadCount;
      return;
    }

    if (unreadCount > previousCount.current) {
      const audio = new Audio("/sounds/notification.wav");

      audio.volume = 1;

      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    }

    previousCount.current = unreadCount;
  }, [unreadCount]);
}