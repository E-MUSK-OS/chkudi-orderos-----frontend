"use client";

import Button from "@/components/ui/Button";
import { useDismissNotification } from "../hooks/useNotifications";
import { Notification } from "../types/notification";
import { timeAgo } from "@/utils/timeAgo";
import NotificationDialog  from "./NotificationDialog";

import { Bell, ChevronRight, Clock3, Trash2 } from "lucide-react";

interface Props {
  notification: Notification;
  variant?: "page" | "dropdown";
  onClick?: () => void;
}

const priorityStyles = {
  LOW: {
    bar: "bg-gray-400",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    glow: "bg-gray-300/30",
  },
  MEDIUM: {
    bar: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    glow: "bg-blue-400/30",
  },
  HIGH: {
    bar: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    glow: "bg-orange-400/30",
  },
  CRITICAL: {
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
    glow: "bg-red-400/30",
  },
};

export default function NotificationCard({
  notification,
  variant = "page",
  onClick,
}: Props) {
  const { mutate: dismissNotification, isPending } = useDismissNotification();

  const createdAt = timeAgo(notification.createdAt);

  const style = priorityStyles[notification.priority];

  return (
    <div
      onClick={onClick}
      className="
        group
        relative
        overflow-hidden
        border
        border-zinc-200
        duration-300
        hover:-translate-y-1
        hover:border-[#C89B3C]/50
      "
    >
      {/* Priority Bar */}

      <div className={`absolute left-0 top-0 h-full w-1 ${style.bar}`} />

      {/* Glow */}

      <div
        className={`absolute -left-10 top-0 h-full w-20 blur-3xl ${style.glow}`}
      />

      <div className="relative flex gap-5 p-6">
        {/* Notification Icon */}

        <div className="relative shrink-0">
          <div
            className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-[#E6BE67]
              to-[#C89B3C]
              shadow-lg
              shadow-[#C89B3C]/30
            "
          >
            <Bell size={22} className="text-white" />
          </div>

          {notification.status === "UNREAD" && (
            <>
              <span className="absolute -right-1 -top-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />

                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-blue-500" />
              </span>
            </>
          )}
        </div>

        {/* Content */}

        <div className="min-w-0 flex-1">
          {/* Header */}

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight text-zinc-900">
                {notification.title}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`
                    rounded-full
                    border
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    ${style.badge}
                  `}
                >
                  {notification.priority}
                </span>

                {notification.status === "UNREAD" && (
                  <span
                    className="
                      rounded-full
                      bg-blue-600
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-white
                    "
                  >
                    Unread
                  </span>
                )}
              </div>
            </div>
            {/* Actions */}

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                disabled={isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                className="
  h-9
  w-9
  rounded-xl
  text-zinc-400
  transition-all
  duration-300
  hover:bg-red-50
  hover:text-red-600
  hover:scale-105
"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Message */}

          <p className="mt-5 line-clamp-2 text-[15px] leading-7 text-zinc-600">
            {notification.message}
          </p>

          {/* Footer */}

          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Clock3 className="h-4 w-4" />

              <span>{createdAt}</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="
                  text-sm
                  font-medium
                  text-[#C89B3C]
                  opacity-0
                  transition-all
                  duration-300
                  group-hover:opacity-100
                "
              >
                View
              </span>

              <ChevronRight
                className="
                  h-5
                  w-5
                  text-zinc-300
                  transition-all
                  duration-300
                  group-hover:translate-x-1
                  group-hover:text-[#C89B3C]
                "
              />
            </div>
          </div>
        </div>
      </div>

      {/* Premium Hover Glow */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-3xl
          opacity-0
          transition-opacity
          duration-300
          group-hover:opacity-100
          bg-gradient-to-r
          from-[#C89B3C]/5
          via-transparent
          to-transparent
        "
      />
    </div>
  );
}
