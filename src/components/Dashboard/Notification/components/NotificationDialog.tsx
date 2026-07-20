"use client";

import Button from "@/components/ui/Button";

import { Dialog, DialogContent } from "@/components/ui/dialog";

import { Notification } from "../types/notification";
import { timeAgo } from "@/utils/timeAgo";

import {
  Bell,
  Clock3,
  ShieldAlert,
  TriangleAlert,
  Info,
  CircleAlert,
  X,
} from "lucide-react";
import { dismissNotification } from "../services/notification.service";
import {
  useDismissNotification,
  useMarkNotificationRead,
} from "../hooks/useNotifications";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  notification: Notification | null;
}

const priorityStyles = {
  LOW: {
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Info,
    gradient: "from-gray-400 to-gray-500",
  },
  MEDIUM: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Bell,
    gradient: "from-blue-500 to-cyan-500",
  },
  HIGH: {
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    icon: TriangleAlert,
    gradient: "from-orange-500 to-amber-500",
  },
  CRITICAL: {
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: ShieldAlert,
    gradient: "from-red-500 to-rose-600",
  },
};

export default function NotificationDialog({
  open,
  onClose,
  notification,
}: Props) {
  const { mutate: markRead } = useMarkNotificationRead();

  const { mutate: dismissNotification } = useDismissNotification();

  useEffect(() => {
    if (open && notification && notification.status === "UNREAD") {
      markRead(notification.id);
    }
  }, [open, notification, markRead]);

  if (!notification) {
    return null;
  }

  const style = priorityStyles[notification.priority];
  const Icon = style.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden border-0 p-0 shadow-2xl">
        <div
          className={`
            relative
            overflow-hidden
            bg-[#0A0E1A]
            px-8
            py-8
            text-white
          `}
        >
          {/* Background Blur */}

          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center bg-white/15 backdrop-blur">
                <Icon className="h-8 w-8 text-white" />
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                  Notification
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  {notification.title}
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`
                      rounded-full
                      border
                      bg-white/15
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      backdrop-blur
                    `}
                  >
                    {notification.priority}
                  </span>

                  {notification.status === "UNREAD" && (
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold">
                      UNREAD
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button> */}
          </div>
        </div>

        {/* Body */}

        <div className="space-y-8 p-8">
          {/* Message */}

          <div className="border border-zinc-200 bg-zinc-50 p-6">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Message
            </p>

            <p className="whitespace-pre-wrap text-[15px] leading-8 text-zinc-700">
              {notification.message}
            </p>
          </div>

          {/* Details */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="border border-zinc-200 bg-white p-5">
              <div className="mb-2 flex items-center gap-2 text-zinc-500">
                <Clock3 className="h-4 w-4" />
                <span className="text-sm font-medium">Created</span>
              </div>

              <p className="text-base font-semibold text-zinc-900">
                {timeAgo(notification.createdAt)}
              </p>
            </div>

            <div className="border border-zinc-200 bg-white p-5">
              <p className="mb-2 text-sm font-medium text-zinc-500">Status</p>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${style.badge}`}
                >
                  {notification.priority}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    notification.status === "UNREAD"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {notification.status}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}

          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="">
              Close
            </Button>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification(notification.id);
              }}
              className="
                bg-red-600
                text-white
                hover:bg-red-700
              "
            >
              Delete Notification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
