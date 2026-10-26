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
import { showDeleteConfirmation } from "@/utils/deleteConfirmation";

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
      <DialogContent className="max-w-xl rounded-3xl border border-[#E7E0D2] p-8 shadow-2xl dark:border-white/[0.1] dark:bg-[#0F1626]">

        <DialogHeader>

          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            {notification.title}
          </DialogTitle>

        </DialogHeader>

        <div className="space-y-6">

          <div>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-7">
              {notification.message}
            </p>

          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500">

            Created :

            {" "}

            {new Date(
              notification.createdAt,
            ).toLocaleString()}

          </div>

          <div className="flex justify-end gap-3 border-t border-[#E7E0D2] pt-4 dark:border-white/[0.08]">

            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-2xl active:scale-[0.98]"
            >
              Close
            </Button>

            <Button
              onClick={async () => {
                const result = await showDeleteConfirmation({
                  title: "Delete Notification",
                  text: "Are you sure you want to delete this notification?",
                });

                if (result.isConfirmed) {
                  dismiss(notification.id);
                  onClose();
                }
              }}
              className="rounded-2xl active:scale-[0.98]"
            >
              Dismiss
            </Button>

          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}