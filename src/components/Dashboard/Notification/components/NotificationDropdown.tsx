"use client";

import { useNotifications } from "../hooks/useNotifications";
import { timeAgo } from "@/utils/timeAgo";
import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const { data, isLoading } = useNotifications();

  const notifications = data?.data ?? [];

  return (
    <div
      className="
        absolute
        right-0
        top-12
        z-50
        w-[calc(100vw-1.5rem)]
        sm:w-[420px]
        max-w-sm
        sm:max-w-md
        rounded-2xl
        overflow-hidden
        border
        border-[#E7E0D2]
        bg-white
        shadow-[0_15px_50px_rgba(0,0,0,0.12)]
        dark:border-white/[0.1]
        dark:bg-[#0F1626]
        dark:shadow-2xl
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E7E0D2] bg-[#0A0E1A] px-5 py-3.5 dark:border-white/[0.08] dark:bg-[#080B11]/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-[#C89B3C] dark:border dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-[#F5C451] dark:shadow-[0_0_12px_rgba(245,196,81,0.15)]">
            <Bell size={16} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#E8C16D] dark:text-white">Notifications</h3>
            <p className="text-[11px] text-white dark:text-slate-400">Latest Updates</p>
          </div>
        </div>

        <span className="rounded-full bg-[#E8C16D]/20 px-2.5 py-0.5 text-xs font-bold text-[#C89B3C] dark:border dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-[#F5C451]">
          {notifications.length}
        </span>
      </div>

      {/* Body */}
      <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <Bell size={30} className="text-gray-300 dark:text-slate-600" />
            <p className="text-xs text-gray-500 dark:text-slate-400">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification.id}
              href="/dashboard/notification"
              onClick={onClose}
              className="
                group
                flex
                cursor-pointer
                gap-3.5
                border-b
                border-gray-100
                px-4
                py-3.5
                transition-all
                hover:bg-gray-50
                dark:border-white/[0.04]
                dark:hover:bg-white/[0.04]
              "
            >
              {/* Icon */}
              <div className="relative mt-0.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-[#C89B3C] dark:border dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-[#F5C451]">
                  <Bell size={15} />
                </div>

                {notification.status === "UNREAD" && (
                  <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500 dark:bg-amber-400 dark:ring-2 dark:ring-[#0F1626]" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-xs font-bold text-gray-900 dark:text-white">
                  {notification.title}
                </h4>

                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-slate-400">
                  {notification.message}
                </p>

                <span className="mt-1 block text-[10px] text-gray-400 font-mono dark:text-slate-500">
                  {timeAgo(notification.createdAt)}
                </span>
              </div>

              <ChevronRight
                size={16}
                className="
                  mt-1.5
                  text-gray-300
                  transition-transform
                  group-hover:translate-x-1
                  group-hover:text-[#C89B3C]
                  dark:text-slate-500
                  dark:group-hover:text-[#F5C451]
                "
              />
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#E7E0D2] bg-gray-50 p-3 dark:border-white/[0.08] dark:bg-[#080B11]/80">
        <Link
          href="/dashboard/notification"
          onClick={onClose}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[#0A0E1A]
            px-4
            py-2.5
            text-xs
            font-bold
            text-white
            transition-all
            hover:bg-[#1B2435]
            dark:bg-gradient-to-r
            dark:from-[#F5C451]
            dark:to-[#E5A827]
            dark:text-[#080B11]
            dark:shadow-[0_0_15px_rgba(245,196,81,0.25)]
            dark:hover:brightness-105
          "
        >
          View All Notifications
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
