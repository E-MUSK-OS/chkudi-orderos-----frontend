"use client";

import { Bell } from "lucide-react";

import { useState } from "react";

import NotificationDropdown from "./NotificationDropdown";

import { useUnreadNotificationCount } from "../hooks/useNotifications";
import { useNotificationSound } from "../hooks/useNotificationSound";

export default function NotificationBell() {
    console.log("NotificationBell Rendered");
  const [open, setOpen] = useState(false);

  const { data } = useUnreadNotificationCount();

  const unreadCount = data?.data.unreadCount ?? 0;

  // 👇 અહીં add કરો
  console.log("Unread Count:", unreadCount);

  useNotificationSound(unreadCount);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 transition hover:bg-muted"
      >
        <Bell className="h-6 w-6" />

        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
        )}
      </button>

      {open && <NotificationDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
