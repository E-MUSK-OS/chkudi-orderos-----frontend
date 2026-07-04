"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Home,
  ClipboardList,
  Package,
  Users,
  BarChart3,
  Settings,
  X,
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  //   {
  //     label: "Orders",
  //     href: "/dashboard/orders",
  //     icon: ClipboardList,
  //   },
  //   {
  //     label: "Settings",
  //     href: "/dashboard/settings",
  //     icon: Settings,
  //   },
];

export default function Sidebar({
  sidebarOpen,
  sidebarCollapsed,
  setSidebarOpen,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close Sidebar Overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 h-screen border-r border-[#E7E0D2] bg-[#0A0E1A] text-white transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
  ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
  ${sidebarCollapsed ? "w-72 lg:w-[88px]" : "w-72"}`}
      >
        <div
          className={`relative flex h-full min-h-screen flex-col py-6 transition-all duration-300
  ${sidebarCollapsed ? "px-5 lg:px-4" : "px-5"}`}
        >
          {/* Logo */}

          <div
            className={`flex items-center gap-3
          ${sidebarCollapsed ? "lg:justify-center" : "justify-between"}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center bg-[#E8C16D] font-bold text-xl text-[#0A0E1A]">
                O
              </div>

              <div
                className={`min-w-0 overflow-hidden transition-all duration-300
              ${
                sidebarCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
              }`}
              >
                <p className="text-xs uppercase text-[#E8C16D]">Chakudee</p>

                <h1 className="text-2xl font-bold">OrderOS</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="grid h-10 w-10 place-items-center text-slate-300 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <div key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    aria-label={item.label}
                    className={`relative flex h-12 w-full items-center gap-3 overflow-hidden px-4 text-left text-sm font-semibold transition-colors
          ${
            active
              ? "bg-[#E8C16D] text-[#0A0E1A]"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          }
          ${sidebarCollapsed ? "lg:justify-center lg:gap-0 lg:px-0" : ""}`}
                  >
                    {/* Left Active Border */}

                    <span
                      className={`absolute left-0 top-2 h-8 w-1 bg-[#E8C16D] transition-opacity
            ${active && !sidebarCollapsed ? "opacity-100" : "opacity-0"}`}
                    />

                    {/* Icon */}

                    <Icon size={20} className="shrink-0" />

                    {/* Label */}

                    <span
                      className={`overflow-hidden whitespace-nowrap transition-all duration-300
            ${sidebarCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"}`}
                    >
                      {item.label}
                    </span>
                  </Link>

                  {/* Tooltip */}

                  {sidebarCollapsed && (
                    <span
                      className="
              pointer-events-none
              absolute
              left-[calc(100%+12px)]
              top-1/2
              z-50
              hidden
              -translate-y-1/2
              whitespace-nowrap
              bg-[#111827]
              px-3
              py-2
              text-xs
              font-semibold
              text-white
              opacity-0
              shadow-lg
              transition-opacity
              group-hover:opacity-100
              lg:block
            "
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>

          <div
            className={`mt-auto border-t border-white/10 pt-5 text-sm text-slate-400
  ${sidebarCollapsed ? "lg:text-center lg:text-xs" : ""}`}
          >
            <span
              className={`block overflow-hidden whitespace-nowrap transition-all duration-300
    ${sidebarCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"}`}
            >
              Signed in workspace
            </span>

            <span
              className={
                sidebarCollapsed
                  ? "hidden h-9 w-9 place-items-center bg-white/10 text-[10px] font-bold uppercase text-[#E8C16D] lg:grid"
                  : "hidden"
              }
            >
              ON
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
