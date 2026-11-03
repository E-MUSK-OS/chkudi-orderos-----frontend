"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Barcode } from "lucide-react";
import { ScanBarcode } from "lucide-react";
import Image from "next/image";

import {
  Home,
  Video,
  X,
  Folder,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Package,
  FileSpreadsheet,
  ShoppingBag,
  Settings,
  ArrowLeftRight,
  Users,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getCurrentUser, filterNavItemsForUser, type UserPermissions } from "@/utils/pagePermissions";
import { AnimatePresence, motion } from "framer-motion";
import { operatorLogout } from "@/services/operatorAuth.service";
import { toast } from "sonner";

interface SidebarProps {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

import { navItems, type NavItem } from "@/constants/navigation";

// Strips /dashboard prefix for uniform comparison with base URL routes
export const normalizeRoute = (p?: string): string => {
  if (!p) return "";
  const clean = p.split("?")[0].replace(/\/+$/, "") || "/";
  if (clean === "/dashboard" || clean === "/dashboard/") return "/dashboard";
  if (clean.startsWith("/dashboard/")) return clean.slice("/dashboard".length);
  return clean;
};

export default function Sidebar({
  sidebarOpen,
  sidebarCollapsed,
  setSidebarOpen,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<UserPermissions | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());

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

  const visibleNavItems = useMemo(() => {
    return filterNavItemsForUser(navItems, currentUser);
  }, [currentUser]);

  const handleNavigation = async (href: string) => {
    const token = localStorage.getItem("operatorAccessToken");

    if (token) {
      try {
        await operatorLogout();
      } catch (error) {
        console.error(error);
      } finally {
        localStorage.removeItem("operatorAccessToken");
        localStorage.removeItem("operator");
        localStorage.removeItem("selectedAccount");
        sessionStorage.removeItem("operatorTabActive");
      }
    }

    setSidebarOpen(false);

    router.push(normalizeRoute(href));
  };

  const findActivePath = (
    items: NavItem[],
    path: string,
    trail: string[] = [],
  ): string[] | null => {
    const currentNorm = normalizeRoute(path);

    for (const item of items) {
      const nextTrail = [...trail, item.label];
      const itemNorm = normalizeRoute(item.href);

      // 1. Traverse children first to locate deepest exact match
      if (item.children && item.children.length > 0) {
        const found = findActivePath(item.children, path, nextTrail);
        if (found) return found;
      }

      // 2. Exact match for this node
      if (itemNorm && itemNorm === currentNorm) {
        return trail;
      }

      // 3. Special aliases
      if (
        (itemNorm === "/setting/company-profile" || itemNorm === "/setting/manage-company/company-profile") &&
        (currentNorm === "/setting/company-profile" || currentNorm === "/setting/manage-company/company-profile")
      ) {
        return trail;
      }
      if (
        itemNorm === "/purchase/finish-goods/invoice" &&
        currentNorm === "/purchase-invoice"
      ) {
        return trail;
      }
      if (
        itemNorm === "/purchase/finish-goods/challan" &&
        currentNorm === "/purchase-challan"
      ) {
        return trail;
      }
      if (
        (itemNorm === "/settings/manage-product" || itemNorm === "/settings/manage-product/product-profile") &&
        currentNorm.startsWith("/settings/manage-product")
      ) {
        return trail;
      }
      if (
        (itemNorm === "/settings/manage-material" || itemNorm === "/settings/manage-material/material-profile") &&
        currentNorm.startsWith("/settings/manage-material")
      ) {
        return trail;
      }
      if (
        itemNorm === "/settings/labels/label-config" &&
        currentNorm.startsWith("/settings/labels/label-config")
      ) {
        return trail;
      }
      if (
        itemNorm === "/settings/labels/label-print" &&
        currentNorm === "/settings/labels/label-print"
      ) {
        return trail;
      }
      if (
        itemNorm &&
        itemNorm.startsWith("/settings/manage-users") &&
        currentNorm.startsWith("/settings/manage-users")
      ) {
        return trail;
      }

      // 4. Prefix match only if item has children and is not root dashboard
      if (
        itemNorm &&
        itemNorm !== "/dashboard" &&
        item.children &&
        item.children.length > 0 &&
        currentNorm.startsWith(itemNorm + "/")
      ) {
        return trail;
      }
    }
    return null;
  };

  useEffect(() => {
    const activeTrail = findActivePath(visibleNavItems, pathname);
    if (activeTrail && activeTrail.length > 0) {
      setOpenMenus((prev) => {
        const next = { ...prev };
        activeTrail.forEach((label) => {
          next[label] = true;
        });
        return next;
      });
    }
  }, [pathname, visibleNavItems]);

  const isMenuActive = (item: NavItem): boolean => {
    const currentNorm = normalizeRoute(pathname);

    if (item.href) {
      const itemNorm = normalizeRoute(item.href);

      // 1. Root Dashboard item: ONLY active if current path is /dashboard or root /
      if (itemNorm === "/dashboard") {
        return currentNorm === "/dashboard" || currentNorm === "/";
      }

      // 2. Exact match
      if (currentNorm === itemNorm) {
        return true;
      }

      // 3. Special aliases
      if (
        (itemNorm === "/setting/company-profile" || itemNorm === "/setting/manage-company/company-profile") &&
        (currentNorm === "/setting/company-profile" || currentNorm === "/setting/manage-company/company-profile")
      ) {
        return true;
      }
      if (
        itemNorm === "/purchase/finish-goods/invoice" &&
        currentNorm === "/purchase-invoice"
      ) {
        return true;
      }
      if (
        itemNorm === "/purchase/finish-goods/challan" &&
        currentNorm === "/purchase-challan"
      ) {
        return true;
      }
      if (
        (itemNorm === "/settings/manage-product" || itemNorm === "/settings/manage-product/product-profile") &&
        currentNorm.startsWith("/settings/manage-product")
      ) {
        return true;
      }
      if (
        (itemNorm === "/settings/manage-material" || itemNorm === "/settings/manage-material/material-profile") &&
        currentNorm.startsWith("/settings/manage-material")
      ) {
        return true;
      }
      if (
        itemNorm === "/settings/labels/label-config" &&
        currentNorm.startsWith("/settings/labels/label-config")
      ) {
        return true;
      }
      if (
        itemNorm === "/settings/labels/label-print" &&
        currentNorm === "/settings/labels/label-print"
      ) {
        return true;
      }
      if (
        itemNorm &&
        itemNorm.startsWith("/settings/manage-users") &&
        currentNorm.startsWith("/settings/manage-users")
      ) {
        return true;
      }

      // 4. Sub-path match: ONLY if item has children!
      // Leaf items (like "Order Process -> Dashboard") must NOT match sub-routes!
      if (item.children && item.children.length > 0 && currentNorm.startsWith(itemNorm + "/")) {
        return true;
      }
    }

    // 5. If item has children, check if any child is active
    if (item.children && item.children.length > 0) {
      return item.children.some(isMenuActive);
    }

    return false;
  };

  const isMenuOpen = (item: NavItem) => {
    return openMenus[item.label] ?? isMenuActive(item);
  };

  const toggleMenu = (item: NavItem) => {
    setOpenMenus((prev) => ({
      ...prev,
      [item.label]: !(prev[item.label] ?? isMenuActive(item)),
    }));
  };

  const renderMenu = (items: NavItem[], level = 0) => {
    const isLevel0 = level === 0;
    const itemHeight = "h-10";
    const itemFontSize = "text-[14px]";
    const iconSize = isLevel0 ? 18 : 16;

    return items.map((item) => {
      const active = isMenuActive(item);
      const isOpen = isMenuOpen(item);
      const hasChildren = !!item.children?.length;
      if (hasChildren) {
        const isSelfActive = sidebarCollapsed
          ? isMenuActive(item)
          : !!item.href && normalizeRoute(pathname) === normalizeRoute(item.href) && !isOpen;

        return (
          <div key={item.label}>
            <button
              type="button"
              onClick={() => {
                if (sidebarCollapsed && item.href) {
                  void handleNavigation(item.href);
                } else {
                  toggleMenu(item);
                }
              }}
              className={`group flex ${itemHeight} w-full items-center justify-between cursor-pointer transition-all duration-300 ease-out ${itemFontSize}
              ${
                isSelfActive
                  ? "bg-gradient-to-r from-[#F5C451]/20 via-[#F5C451]/5 to-transparent text-white border-l-2 border-[#F5C451] font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
                  : active
                  ? "text-white bg-white/[0.06] font-medium"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 font-normal"
              }`}
              style={{
                paddingLeft: `${sidebarCollapsed ? 16 : 14 + level * 16}px`,
                paddingRight: "14px",
              }}
            >
              <div className="flex items-center gap-2.5">
                {item.icon && (
                  <item.icon
                    size={iconSize}
                    className={`shrink-0 transition-colors ${
                      isSelfActive || active
                        ? "text-[#F5C451]"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                )}

                {!sidebarCollapsed && (
                  <span className={`truncate ${itemFontSize}`}>{item.label}</span>
                )}
              </div>

              {!sidebarCollapsed &&
                (isOpen ? (
                  <ChevronUp
                    size={15}
                    className={
                      isSelfActive || active
                        ? "text-[#F5C451]"
                        : "text-slate-400 group-hover:text-slate-200"
                    }
                  />
                ) : (
                  <ChevronDown
                    size={15}
                    className={
                      isSelfActive || active
                        ? "text-[#F5C451]"
                        : "text-slate-400 group-hover:text-slate-200"
                    }
                  />
                ))}
            </button>

            <AnimatePresence initial={false}>
              {!sidebarCollapsed && isOpen && (
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0,
                    y: -6,
                  }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    y: -6,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="overflow-hidden"
                >
                  {renderMenu(item.children!, level + 1)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }

      return (
        <button
          key={item.label}
          type="button"
          onClick={() => handleNavigation(item.href!)}
          className={`group flex ${itemHeight} w-full items-center cursor-pointer transition-all duration-300 ease-out ${itemFontSize}
  ${
    active
      ? "bg-gradient-to-r from-[#F5C451]/20 via-[#F5C451]/5 to-transparent text-white border-l-2 border-[#F5C451] font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 font-normal"
  }`}
          style={{
            paddingLeft: `${sidebarCollapsed ? 16 : 14 + level * 16}px`,
            paddingRight: "14px",
          }}
        >
          <div className="flex items-center gap-2.5">
            {item.icon && (
              <item.icon
                size={iconSize}
                className={`shrink-0 transition-colors ${
                  active
                    ? "text-[#F5C451]"
                    : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
            )}

            {!sidebarCollapsed && (
              <span className={`truncate ${itemFontSize}`}>{item.label}</span>
            )}
          </div>
        </button>
      );
    });
  };

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close Sidebar Overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 h-screen border-r border-white/[0.08] bg-[#080B11] text-white transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
  ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
  ${sidebarCollapsed ? "w-72 lg:w-[88px]" : "w-72"}`}
      >
        <div
          className={`relative flex h-full flex-col overflow-hidden py-6 transition-all duration-300
  ${sidebarCollapsed ? "px-5 lg:px-4" : "px-5"}`}
        >
          {/* Logo */}
          <div
            className={`flex items-center gap-3
          ${sidebarCollapsed ? "lg:justify-center" : "justify-between"}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#F5C451] via-[#E8B83D] to-[#D99A1E] font-black text-xl text-[#080B11] shadow-[0_0_16px_rgba(245,196,81,0.35)]">
                OS
              </div>

              <div
                className={`min-w-0 overflow-hidden transition-all duration-300
              ${
                sidebarCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"
              }`}
              >
                <p className="text-xs uppercase font-bold tracking-wider text-[#F5C451]">Chakudee</p>
                <h1 className="text-2xl font-bold tracking-tight text-white">OrderOS</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-white lg:hidden cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <nav
            className="custom-scroll mt-6 flex-1 space-y-1 overflow-y-auto"
            style={{
              marginRight: "-19px",
              paddingRight: "10px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(245, 196, 81, 0.35) transparent",
            }}
          >
            {visibleNavItems.length > 0 ? (
              renderMenu(visibleNavItems)
            ) : (
              <div className="py-6 px-3 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                No accessible pages assigned.
              </div>
            )}
          </nav>

          <style jsx>{`
            .custom-scroll::-webkit-scrollbar {
              width: 4px;
            }
            .custom-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
              background: rgba(245, 196, 81, 0.35);
              border-radius: 9999px;
            }
            .custom-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(245, 196, 81, 0.55);
            }
          `}</style>

          <div
            className={`mt-auto border-t border-white/[0.08] pt-5 text-sm text-slate-400
  ${sidebarCollapsed ? "lg:text-center lg:text-xs" : ""}`}
          >
            <span
              className={`block overflow-hidden whitespace-nowrap transition-all duration-300 text-[#F5C451]/80 hover:text-[#F5C451] uppercase font-semibold text-xs tracking-wider
    ${sidebarCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"}`}
            >
              Developed by : NetuTechno
            </span>

            {sidebarCollapsed && (
              <div className="hidden lg:flex h-10 w-10 mx-auto items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02]">
                <img
                  src="/image/netu-logo.jpeg"
                  alt="NetuTechno"
                  className="h-10 w-10 object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
