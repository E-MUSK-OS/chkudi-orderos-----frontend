"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

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
    return <div className="py-20 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <Bell className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>

            <p className="text-sm text-muted-foreground">
              Stay updated with all activities.
            </p>
          </div>
        </div>

        {/* {notifications.length > 0 && (
          <Button variant="outline" onClick={() => markAllRead()}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        )} */}
      </div>

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
