"use client";

import { useEffect } from "react";

import Button from "@/components/ui/Button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  useDismissNotification,
  useMarkNotificationRead,
} from "../hooks/useNotifications";

import { Notification } from "../types/notification";

interface Props {
  open: boolean;
  onClose: () => void;
  notification: Notification | null;
}

export default function NotificationModal({
  open,
  onClose,
  notification,
}: Props) {
  const { mutate: markRead } =
    useMarkNotificationRead();

  const { mutate: dismiss } =
    useDismissNotification();

  useEffect(() => {
    if (
      open &&
      notification &&
      notification.status === "UNREAD"
    ) {
      markRead(notification.id);
    }
  }, [open, notification, markRead]);

  if (!notification) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >
      <DialogContent className="max-w-xl p-10">

        <DialogHeader>

          <DialogTitle>
            {notification.title}
          </DialogTitle>

        </DialogHeader>

        <div className="space-y-6">

          <div>

            <p className="text-muted-foreground leading-7">
              {notification.message}
            </p>

          </div>

          <div className="text-sm text-gray-500">

            Created :

            {" "}

            {new Date(
              notification.createdAt,
            ).toLocaleString()}

          </div>

          <div className="flex justify-end gap-3">

            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>

            <Button
            //   variant="destructive"
              onClick={() => {
                dismiss(notification.id);

                onClose();
              }}
            >
              Dismiss
            </Button>

          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}