"use client";

import {
  Bell,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import ProfileDropdown from "./ProfileDropdown";

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
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = currentDateTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return (
    <header className="sticky top-0 z-20 border-b border-[#E7E0D2] bg-[#F7F5F0]/95 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile Menu */}

        <button
          type="button"
          aria-label="Open Sidebar"
          onClick={() => setSidebarOpen(true)}
          className="grid h-11 w-11 place-items-center bg-white text-[#0A0E1A] shadow-sm lg:hidden"
        >
          <Menu size={21} />
        </button>

        {/* Collapse */}

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

        {/* Search */}

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

        {/* Right */}

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="grid h-11 w-11 place-items-center bg-white text-slate-600 shadow-sm hover:text-[#C89B3C]"
          >
            <Bell size={19} />
          </button>

          <ProfileDropdown setLogoutOpen={setLogoutOpen} />
        </div>
      </div>
    </header>
  );
}
