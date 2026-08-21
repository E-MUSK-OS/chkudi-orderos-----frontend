"use client";

import {
  Bell,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Warehouse,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProfileDropdown from "./ProfileDropdown";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useNotifications,
  useUnreadNotificationCount,
} from "@/components/Dashboard/Notification/hooks/useNotifications";
import NotificationDropdown from "../Notification/components/NotificationDropdown";
import { useNotificationSound } from "@/components/Dashboard/Notification/hooks/useNotificationSound";
import { useBrowserNotification } from "@/components/Dashboard/Notification/hooks/useBrowserNotification";
import { useNotificationSocket } from "@/components/Dashboard/Notification/hooks/useNotificationSocket";

interface HeaderProps {
  title: string;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLogoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Header({
  title,
  sidebarCollapsed,
  setSidebarCollapsed,
  setSidebarOpen,
  setLogoutOpen,
}: HeaderProps) {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useNotificationSocket();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    }

    if (notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      <Bell size={19} />;
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationOpen]);

  useEffect(() => {
    const updateTime = () => {
      setCurrentDateTime(new Date());
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentDateTime
    ? currentDateTime.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const formattedTime = currentDateTime
    ? currentDateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  const { data } = useUnreadNotificationCount();

  const unreadCount = data?.data.unreadCount ?? 0;

  const { data: notificationsData } = useNotifications();

  const latestNotification =
    notificationsData?.data
      ?.filter((item) => item.status === "UNREAD")
      ?.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0] ?? null;

  useNotificationSound(unreadCount);

  useBrowserNotification({
    unreadCount,
    notification: latestNotification,
  });

  const hasAutoOpened = useRef(false);

  useEffect(() => {
    if (hasAutoOpened.current) return;

    if (unreadCount > 0) {
      setNotificationOpen(true);

      hasAutoOpened.current = true;
    }
  }, [unreadCount]);

  return (
    <header className="sticky top-0 z-20 border-b border-[#E7E0D2] bg-[#F7F5F0]/95 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Open Sidebar"
          onClick={() => setSidebarOpen(true)}
          className="grid h-11 w-11 place-items-center bg-white text-[#0A0E1A] shadow-sm lg:hidden"
        >
          <Menu size={21} />
        </button>

        <button
          type="button"
          aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          className="hidden h-11 w-11 place-items-center border border-[#E7E0D2] bg-white text-slate-600 shadow-sm transition-colors hover:border-[#E8C16D] hover:bg-[#FFF8E7] hover:text-[#0A0E1A] lg:grid"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
        </button>

        <div className="hidden h-11 max-w-md flex-1 items-center gap-3 bg-white px-4 shadow-sm md:flex">
          <Search size={18} className="text-slate-400" />

          <input
            type="search"
            placeholder="Search orders, products..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="hidden xl:flex flex-col leading-tight">
          <span className="text-md font-semibold text-[#0A0E1A]">
            {formattedDate}
          </span>

          <span className="text-sm text-slate-500">{formattedTime}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/warehouse")}
                className="group relative grid h-11 w-11 place-items-center bg-white text-slate-600 shadow-sm transition-colors hover:text-[#C89B3C] cursor-pointer"
              >
                <Warehouse size={19} />

                {/* {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
                )} */}

                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap bg-[#0A0E1A] px-2 py-1 text-xs font-medium text-white opacity-0 transition-all duration-200 group-hover:opacity-100">
                  Warehouse
                </span>
              </button>

              <button
                type="button"
                onClick={() => setNotificationOpen((prev) => !prev)}
                className="group relative grid h-11 w-11 place-items-center bg-white text-slate-600 shadow-sm transition-colors hover:text-[#C89B3C] cursor-pointer"
              >
                <Bell size={19} />

                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
                )}
                <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0A0E1A] px-2 py-1 text-xs font-medium text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                  Notification
                </span>
              </button>
            </div>

            {notificationOpen && (
              <div ref={notificationRef}>
                <NotificationDropdown
                  onClose={() => setNotificationOpen(false)}
                />
              </div>
            )}
          </div>

          <ProfileDropdown setLogoutOpen={setLogoutOpen} />
        </div>
      </div>
    </header>
  );
}
