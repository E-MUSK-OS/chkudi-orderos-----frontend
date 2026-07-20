"use client";

import { useEffect, useRef } from "react";

export function useNotificationSound(unreadCount: number) {
  const previousCount = useRef<number | null>(null);

  useEffect(() => {
    console.log("Previous:", previousCount.current);
    console.log("Current:", unreadCount);

    if (previousCount.current === null) {
      previousCount.current = unreadCount;
      return;
    }

    if (unreadCount > previousCount.current) {
      console.log("PLAY SOUND");

      const audio = new Audio("/sounds/notification.wav");

      audio.play().catch((err) => {
        console.error(err);
      });
    }

    previousCount.current = unreadCount;
  }, [unreadCount]);
}
