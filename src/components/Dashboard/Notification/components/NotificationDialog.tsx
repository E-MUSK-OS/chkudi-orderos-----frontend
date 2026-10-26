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
import { showDeleteConfirmation } from "@/utils/deleteConfirmation";
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
    badge: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30",
    icon: Info,
    gradient: "from-gray-400 to-gray-500",
  },
  MEDIUM: {
    badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    icon: Bell,
    gradient: "from-blue-500 to-cyan-500",
  },
  HIGH: {
    badge: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30",
    icon: TriangleAlert,
    gradient: "from-orange-500 to-amber-500",
  },
  CRITICAL: {
    badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
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
      <DialogContent className="max-w-2xl overflow-hidden rounded-3xl border border-[#E7E0D2] p-0 shadow-2xl dark:border-white/[0.1] dark:bg-[#0F1626]">
        <div
          className="
            relative
            overflow-hidden
            bg-[#0A0E1A]
            px-6 sm:px-8
            py-6 sm:py-8
            text-white
            dark:bg-[#080B11]
            dark:border-b
            dark:border-white/[0.08]
          "
        >
          {/* Background Blur */}

          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 backdrop-blur border border-white/20 shrink-0">
                <Icon className="h-7 w-7 text-[#E8C16D] dark:text-[#F5C451]" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#E8C16D] font-semibold">
                  Notification
                </p>

                <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold">
                  {notification.title}
                </h2>

                <div className="mt-3.5 flex flex-wrap gap-2">
                  <span
                    className={`
                      rounded-full
                      border
                      bg-white/15
                      px-3
                      py-0.5
                      text-xs
                      font-semibold
                      backdrop-blur
                    `}
                  >
                    {notification.priority}
                  </span>

                  {notification.status === "UNREAD" && (
                    <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold">
                      UNREAD
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}

        <div className="space-y-6 sm:space-y-8 bg-white p-6 sm:p-8 dark:bg-[#0F1626]">
          {/* Message */}

          <div className="rounded-2xl border border-[#E7E0D2] bg-slate-50/70 p-5 sm:p-6 dark:border-white/[0.08] dark:bg-white/[0.02]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Message
            </p>

            <p className="whitespace-pre-wrap text-sm sm:text-[15px] leading-7 text-slate-700 dark:text-slate-200">
              {notification.message}
            </p>
          </div>

          {/* Details */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E7E0D2] bg-white p-5 dark:border-white/[0.08] dark:bg-[#080B11]/50">
              <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Clock3 className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Created</span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                {timeAgo(notification.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E7E0D2] bg-white p-5 dark:border-white/[0.08] dark:bg-[#080B11]/50">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</p>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${style.badge}`}
                >
                  {notification.priority}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    notification.status === "UNREAD"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  }`}
                >
                  {notification.status}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}

          <div className="flex flex-col-reverse gap-3 border-t border-[#E7E0D2] pt-6 dark:border-white/[0.08] sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-2xl active:scale-[0.98]">
              Close
            </Button>

            <Button
              onClick={async (e) => {
                e.stopPropagation();
                const result = await showDeleteConfirmation({
                  title: "Delete Notification",
                  text: "Are you sure you want to delete this notification?",
                });

                if (result.isConfirmed) {
                  dismissNotification(notification.id);
                  onClose();
                }
              }}
              className="
                rounded-2xl
                bg-red-600
                text-white
                shadow-2xs
                transition-all
                hover:bg-red-700
                active:scale-[0.98]
                dark:bg-red-600
                dark:hover:bg-red-700
                cursor-pointer
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
