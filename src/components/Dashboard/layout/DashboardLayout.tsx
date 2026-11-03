"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import Sidebar from "./Sidebar";
import Header from "./Header";
import LogoutModal from "./LogoutModal";
import DynamicActionShield from "./DynamicActionShield";
import { authService } from "@/services/auth/auth.service";
import { clientConfigurationService } from "@/components/Dashboard/Settings/Configuration/services/clientConfiguration.service";
import { handleAuthFailure } from "@/utils/auth";
import {
  getCurrentUser,
  isRouteAllowed,
  getFirstAllowedRoute,
  type UserPermissions,
} from "@/utils/pagePermissions";

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
}

export default function DashboardLayout({
  title,
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserPermissions | null>(null);

  useEffect(() => {
    // Direct check: If neither accessToken nor refreshToken exists, redirect immediately to login
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

    if (!token && !refreshToken) {
      handleAuthFailure();
      return;
    }

    setCurrentUser(getCurrentUser());

    // Fetch fresh profile from server so permissions are always up-to-date
    authService
      .getMe(token || "")
      .then((res) => {
        if (res?.success && res?.data) {
          const existing = getCurrentUser() || {};
          const updated: UserPermissions = {
            ...existing,
            ...res.data,
            allowedPages: res.data.allowedPages || [],
          };
          localStorage.setItem("user", JSON.stringify(updated));
          setCurrentUser(updated);
          window.dispatchEvent(new Event("storage"));
        }
      })
      .catch((err) => {
        console.debug("Background user permissions refresh:", err);
      });

    // Silently refresh workspace client configuration
    clientConfigurationService.getClientConfig().catch(() => {});

    const handleStorage = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("client_configuration_updated", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("client_configuration_updated", handleStorage);
    };
  }, []);

  const allowed = isRouteAllowed(pathname, currentUser);

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#F7F5F0] text-[#0A0E1A] dark:bg-[#080B11] dark:text-slate-100 selection:bg-[#E8C16D]/30 selection:text-[#0A0E1A] dark:selection:bg-[#F5C451]/25 dark:selection:text-[#FCD34D] relative font-sans transition-colors duration-200">
      {/* Ambient top light mesh (dark theme only) */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[450px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,196,81,0.06),transparent_70%)] z-0 hidden dark:block" />

      <div className="relative z-10 flex h-screen w-full overflow-hidden">
        <Sidebar
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarOpen={setSidebarOpen}
        />

        <section className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
          <Header
            title={title}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
            setLogoutOpen={setLogoutModalOpen}
          />

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 md:px-8 py-4 sm:py-6 lg:py-8 custom-scrollbar">
            {!allowed ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4 shadow-sm">
                  <ShieldAlert size={32} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#0A0E1A] dark:text-white tracking-tight mb-2">
                  Access Restricted
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
                  You do not have permission to access this module. Please contact your Super Admin if you require access to this page.
                </p>
                <Link
                  href={getFirstAllowedRoute(currentUser)}
                  className="px-5 py-2.5 rounded-2xl bg-[#0A0E1A] dark:bg-[#F5C451] text-white dark:text-black font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-sm"
                >
                  Go to Accessible Module
                </Link>
              </div>
            ) : (
              <DynamicActionShield>
                {children}
              </DynamicActionShield>
            )}
          </div>
        </section>
      </div>

      <LogoutModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </main>
  );
}
