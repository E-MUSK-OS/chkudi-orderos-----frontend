"use client";

import { showDeleteConfirmation } from "@/utils/deleteConfirmation";
import Button from "@/components/ui/Button";
import { useDismissNotification } from "../hooks/useNotifications";
import { Notification } from "../types/notification";
import { timeAgo } from "@/utils/timeAgo";
import { Bell, ChevronRight, Clock3, Trash2 } from "lucide-react";

interface Props {
  notification: Notification;
  variant?: "page" | "dropdown";
  onClick?: () => void;
}

const priorityStyles = {
  LOW: {
    bar: "bg-gray-400 dark:bg-slate-500",
    badge: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    glow: "bg-gray-300/30 dark:bg-slate-500/10",
  },
  MEDIUM: {
    bar: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    glow: "bg-blue-400/30 dark:bg-blue-500/10",
  },
  HIGH: {
    bar: "bg-orange-500 dark:bg-[#F5C451]",
    badge: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30",
    glow: "bg-orange-400/30 dark:bg-[#F5C451]/10",
  },
  CRITICAL: {
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
    glow: "bg-red-400/30 dark:bg-red-500/10",
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await showDeleteConfirmation({
      title: "Delete Notification",
      text: "Are you sure you want to delete this notification?",
    });

    if (result.isConfirmed) {
      dismissNotification(notification.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        sm:rounded-3xl
        border
        border-zinc-200
        bg-white
        shadow-sm
        duration-300
        hover:-translate-y-1
        hover:border-[#C89B3C]/50
        dark:border-white/[0.08]
        dark:bg-[#0F1626]
        dark:hover:border-[#F5C451]/50
        dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]
        cursor-pointer
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
                <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white dark:border-[#0F1626] bg-blue-500" />
              </span>
            </>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
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
                onClick={handleDelete}
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
                  dark:text-slate-400
                  dark:hover:bg-red-500/10
                  dark:hover:text-red-400
                  cursor-pointer
                "
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Message */}
          <p className="mt-5 line-clamp-2 text-[15px] leading-7 text-zinc-600 dark:text-slate-300">
            {notification.message}
          </p>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 dark:border-white/[0.06] pt-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-slate-400">
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
                  dark:text-[#F5C451]
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
                  dark:text-slate-500
                  dark:group-hover:text-[#F5C451]
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
