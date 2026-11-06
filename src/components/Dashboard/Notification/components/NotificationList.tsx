"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "../hooks/useNotifications";
import { Notification } from "../types/notification";

import NotificationCard from "./NotificationCard";
import EmptyNotification from "./EmptyNotification";
import NotificationModal from "./NotificationModal";
import NotificationDialog from "./NotificationDialog";

export default function NotificationList() {
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const { data, isLoading } = useNotifications();

  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];

  if (isLoading) {
    return <div className="py-20 text-center text-slate-500 dark:text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
        <div className="space-y-1.5 min-w-0 max-w-2xl">
          <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
            Notifications
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Stay updated with all activities.
          </p>
        </div>
      </section>

      {notifications.length === 0 ? (
        <EmptyNotification />
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={() => setSelectedNotification(notification)}
            />
          ))}
        </div>
      )}
      <NotificationDialog
        notification={selectedNotification}
        open={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
}
