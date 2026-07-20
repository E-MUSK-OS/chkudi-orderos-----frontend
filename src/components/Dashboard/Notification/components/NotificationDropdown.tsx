"use client";

import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";

import { useNotifications } from "../hooks/useNotifications";
import { timeAgo } from "@/utils/timeAgo";

interface Props {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const { data, isLoading } = useNotifications();

  const notifications = data?.data.slice(0, 5) ?? [];

  return (
    <div
      className="
        absolute
        right-0
        top-14
        z-50
        w-[420px]
        overflow-hidden
        border
        border-gray-200
        bg-white
        shadow-[0_15px_50px_rgba(0,0,0,0.12)]
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-[#0A0E1A] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <Bell size={18} className="text-[#C89B3C]" />
          </div>

          <div>
            <h3 className="font-semibold text-[#E8C16D]">Notifications</h3>

            <p className="text-xs text-white">Latest Updates</p>
          </div>
        </div>

        <span className="rounded-full bg-[#E8C16D]/20 px-3 py-1 text-xs font-semibold text-[#C89B3C]">
          {notifications.length}
        </span>
      </div>

      {/* Body */}
      <div className="max-h-[430px] overflow-y-auto">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <Bell size={34} className="text-gray-300" />

            <p className="text-sm text-gray-500">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Link
              href="/dashboard/notification"
              key={notification.id}
              className="
                group
                flex
                cursor-pointer
                gap-4
                border-b
                border-gray-100
                px-5
                py-4
                transition-all
                hover:bg-gray-50
              "
            >
              {/* Icon */}
              <div className="relative mt-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Bell size={18} className="text-[#C89B3C]" />
                </div>

                {notification.status === "UNREAD" && (
                  <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-red-500" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-gray-900">
                  {notification.title}
                </h4>

                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {notification.message}
                </p>

                <span className="mt-2 block text-xs text-gray-400">
                  {timeAgo(notification.createdAt)}
                </span>
              </div>

              <ChevronRight
                size={18}
                className="
                  mt-2
                  text-gray-300
                  transition-transform
                  group-hover:translate-x-1
                "
              />
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 p-4">
        <Link
          href="/dashboard/notification"
          onClick={onClose}
          className="
            flex
            items-center
            justify-center
            gap-2
            bg-[#0A0E1A]
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            transition
          "
        >
          View All Notifications
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
