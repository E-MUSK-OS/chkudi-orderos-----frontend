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

import ThemeToggle from "./ThemeToggle";
import GlobalSearchModal from "./GlobalSearchModal";
import {
  getCurrentUser,
  isRouteAllowed,
  type UserPermissions,
} from "@/utils/pagePermissions";

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
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserPermissions | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const handleStorage = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("client_configuration_updated", handleStorage);
    window.addEventListener("user_profile_updated", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("client_configuration_updated", handleStorage);
      window.removeEventListener("user_profile_updated", handleStorage);
    };
  }, []);

  const isWarehouseAllowed = isRouteAllowed("/dashboard/warehouse", currentUser);
  const isNotificationAllowed = isRouteAllowed("/dashboard/notification", currentUser);
  const notificationRef = useRef<HTMLDivElement>(null);

  useNotificationSocket();

  // Keyboard shortcut listener: Ctrl + K or Cmd + K opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    <>
      <header className="sticky top-0 z-20 border-b border-[#E7E0D2] bg-[#F7F5F0]/95 px-3 sm:px-4 md:px-8 py-3 backdrop-blur-xl transition-colors shrink-0 dark:border-white/[0.08] dark:bg-[#080B11]/80">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            type="button"
            aria-label="Open Sidebar"
            onClick={() => setSidebarOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#E7E0D2] bg-white text-[#0A0E1A] shadow-xs hover:border-[#E8C16D] hover:text-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-200 dark:hover:border-[#F5C451]/50 dark:hover:text-[#F5C451] lg:hidden transition-all cursor-pointer shrink-0"
          >
            <Menu size={20} />
          </button>

          <button
            type="button"
            aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="hidden h-11 w-11 place-items-center rounded-xl border border-[#E7E0D2] bg-white text-slate-600 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-[#FFF8E7] hover:text-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-300 dark:hover:border-[#F5C451]/50 dark:hover:bg-[#131B2E] dark:hover:text-[#F5C451] lg:grid cursor-pointer shrink-0"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

          {/* Desktop Search Bar Trigger */}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="hidden h-11 max-w-md flex-1 items-center justify-between gap-2.5 rounded-xl border border-[#E7E0D2] bg-white px-3.5 shadow-xs transition-all hover:border-[#E8C16D] dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50 md:flex shrink-0 cursor-pointer text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search
                size={16}
                className="shrink-0 text-slate-400 group-hover:text-[#0A0E1A] dark:group-hover:text-white transition"
              />
              <span className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 truncate select-none">
                Search pages...
              </span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 rounded-md border border-[#E7E0D2] bg-[#F7F5F0] px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400">
              Ctrl K
            </kbd>
          </button>

          {/* Mobile Search Button Trigger */}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchModalOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#E7E0D2] bg-white text-slate-600 shadow-xs hover:border-[#E8C16D] hover:text-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-300 dark:hover:border-[#F5C451]/50 dark:hover:text-[#F5C451] md:hidden transition-all cursor-pointer shrink-0"
          >
            <Search size={18} />
          </button>

          <div className="hidden xl:flex h-11 items-center gap-3 rounded-xl border border-[#E7E0D2] bg-white px-3.5 shadow-xs dark:border-white/[0.08] dark:bg-[#0F1626] shrink-0">
            <span className="text-xs font-semibold text-[#0A0E1A] dark:text-slate-200">
              {formattedDate}
            </span>
            <span className="h-3 w-px bg-slate-200 dark:bg-white/[0.1]" />
            <span className="font-mono text-xs font-semibold text-[#B88728] dark:text-[#F5C451] flex items-center gap-1.5">
              {formattedTime}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
            <div className="relative">
              <div className="flex items-center gap-2">
                <ThemeToggle />

                {isWarehouseAllowed && (
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/warehouse")}
                    className="group relative grid h-11 w-11 place-items-center rounded-xl border border-[#E7E0D2] bg-white text-slate-600 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-[#FFF8E7] hover:text-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-300 dark:hover:border-[#F5C451]/50 dark:hover:bg-[#131B2E] dark:hover:text-[#F5C451] cursor-pointer shrink-0"
                  >
                    <Warehouse size={18} />

                    <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#E7E0D2] bg-[#0A0E1A] dark:border-white/[0.1] dark:bg-[#0F1626] px-2.5 py-1 text-xs font-medium text-white dark:text-slate-200 shadow-xl opacity-0 transition-all duration-150 group-hover:opacity-100 z-50">
                      Warehouse
                    </span>
                  </button>
                )}

                {isNotificationAllowed && (
                  <button
                    type="button"
                    onClick={() => setNotificationOpen((prev) => !prev)}
                    className="group relative grid h-11 w-11 place-items-center rounded-xl border border-[#E7E0D2] bg-white text-slate-600 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-[#FFF8E7] hover:text-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-300 dark:hover:border-[#F5C451]/50 dark:hover:bg-[#131B2E] dark:hover:text-[#F5C451] cursor-pointer shrink-0"
                  >
                    <Bell size={18} />

                    {unreadCount > 0 && (
                      <span className="absolute right-2 top-2 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B88728] dark:bg-[#F5C451]" />
                      </span>
                    )}
                    <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#E7E0D2] bg-[#0A0E1A] dark:border-white/[0.1] dark:bg-[#0F1626] px-2.5 py-1 text-xs font-medium text-white dark:text-slate-200 shadow-xl opacity-0 transition-all duration-150 group-hover:opacity-100 z-50">
                      Notification
                    </span>
                  </button>
                )}
              </div>

              {isNotificationAllowed && notificationOpen && (
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

      {/* Global Command Palette Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}
