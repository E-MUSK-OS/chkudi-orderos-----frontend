"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

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
} from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { operatorLogout } from "@/services/operatorAuth.service";
import { toast } from "sonner";

interface SidebarProps {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
  children?: NavItem[];
  external?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "VMS",
    href: "/dashboard/vms",
    icon: Video,
    children: [
      {
        label: "Dashboard",
        href: "/dashboard/vms",
      },
      {
        label: "Scans",
        href: "/dashboard/vms/scans",
        children: [
          {
            label: "VMS",
            href: "/dashboard/vms/scans/vms",
          },
          {
            label: "TrackingID Scan",
            href: "/dashboard/vms/scans/trackingid-scan",
          },
        ],
      },
      {
        label: "Operator",
        href: "/dashboard/vms/operator",
        children: [
          {
            label: "VMS",
            href: "/dashboard/vms/operator/vms",
          },
        ],
      },

      {
        label: "Admin",
        href: "/dashboard/vms/admin",
        children: [
          {
            label: "Users",
            href: "/dashboard/vms/admin/users",
          },
          {
            label: "Accounts Name",
            href: "/dashboard/vms/admin/account",
          },
        ],
      },
    ],
  },
  {
    label: "Products",
    href: "/dashboard/products/manage-products",
    icon: Package,
    children: [
      // {
      //   label: "Dashboard",
      //   href: "/dashboard/products",
      // },
      {
        label: "Products",
        href: "/dashboard/products/manage-products",
      },
      {
        label: "Inventory",
        href: "/dashboard/products/inventory",
      },
    ],
  },

  {
    label: "Order Process",
    href: "/dashboard/order-process",
    icon: ClipboardCheck,
    children: [
      {
        label: "Dashboard",
        href: "/dashboard/order-process",
      },
      {
        label: "Myntra",
        children: [
          {
            label: "Manage Tag Loop",
            href: "/dashboard/order-process/myntra/manage-tag-loop",
          },
          {
            label: "Myntra Order",
            href: "/dashboard/order-process/myntra/myntra-order",
          },
        ],
      },
    ],
  },
];

export default function Sidebar({
  sidebarOpen,
  sidebarCollapsed,
  setSidebarOpen,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // const handleOperatorLogout = () => {
  //   localStorage.removeItem("operator");
  //   localStorage.removeItem("operatorAccessToken");

  //   router.replace("/dashboard/vms/");
  // };

  // const handleOperatorLogout = async () => {
  //   try {
  //     const response = await operatorLogout();

  //     toast.success(response.message);
  //   } catch (error) {
  //     toast.error(error instanceof Error ? error.message : "Logout failed.");
  //   } finally {
  //     sessionStorage.removeItem("operatorAccessToken");
  //     sessionStorage.removeItem("operator");
  //     sessionStorage.removeItem("selectedAccount");

  //     setIsAuthenticated(false);

  //     router.replace("/dashboard/vms/operator");
  //   }
  // };

  const handleNavigation = async (href: string) => {
    const token = sessionStorage.getItem("operatorAccessToken");

    if (token) {
      try {
        await operatorLogout();
      } catch (error) {
        console.error(error);
      } finally {
        sessionStorage.removeItem("operatorAccessToken");
        sessionStorage.removeItem("operator");
        sessionStorage.removeItem("selectedAccount");
      }
    }

    setSidebarOpen(false);

    router.push(href);
  };

  const findActivePath = (
    items: NavItem[],
    path: string,
    trail: string[] = [],
  ): string[] | null => {
    for (const item of items) {
      const nextTrail = [...trail, item.label];

      if (item.href && path === item.href) {
        return trail;
      }

      if (item.children) {
        const found = findActivePath(item.children, path, nextTrail);
        if (found) return found;
        if (item.href && path.startsWith(item.href)) {
          return nextTrail;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const activeTrail = findActivePath(navItems, pathname);
    if (activeTrail && activeTrail.length > 0) {
      setOpenMenus((prev) => {
        const next = { ...prev };
        activeTrail.forEach((label) => {
          next[label] = true;
        });
        return next;
      });
    }
  }, [pathname]);

  const isMenuActive = (item: NavItem): boolean => {
    if (item.href && pathname === item.href) {
      return true;
    }

    if (item.children) {
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
    return items.map((item) => {
      const active = isMenuActive(item);
      const isOpen = isMenuOpen(item);
      const hasChildren = !!item.children?.length;
      if (hasChildren) {
        const isSelfActive = sidebarCollapsed
          ? isMenuActive(item)
          : !!item.href && pathname === item.href && !isOpen;

        return (
          <div key={item.label}>
            <button
              type="button"
              onClick={() => {
                // if (sidebarCollapsed && item.href) {
                //   router.push(item.href);
                //   setSidebarOpen(false);
                // }
                if (sidebarCollapsed && item.href) {
                  void handleNavigation(item.href);
                } else {
                  toggleMenu(item);
                }
              }}
              className={`group flex h-12 w-full items-center justify-between cursor-pointer
transition-all duration-300 ease-out
              ${
                isSelfActive
                  ? "bg-[#E8C16D] text-[#0A0E1A]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
              style={{
                paddingLeft: `${16 + level * 20}px`,
                paddingRight: "16px",
              }}
            >
              <div className="flex items-center gap-3">
                {item.icon && <item.icon size={20} />}

                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>

              {!sidebarCollapsed &&
                (isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
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
                  style={{
                    overflow: "hidden",
                  }}
                >
                  {renderMenu(item.children!, level + 1)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }
      // if (item.label === "Logout") {
      //   return (
      //     <button
      //       key={item.label}
      //       type="button"
      //       onClick={() => setLogoutOpen(true)}
      //       className={`
      //   flex w-full items-center gap-3 px-4 py-3
      //   transition hover:bg-[#1B2435]
      // `}
      //     >
      //       {item.icon && <item.icon size={20} />}

      //       {!sidebarCollapsed && <span>{item.label}</span>}
      //     </button>
      //   );
      // }
      return (
        // <Link
        //   key={item.label}
        //   href={item.href!}
        //   onClick={() => setSidebarOpen(false)}
        //   className={`flex h-12 items-center transition-colors
        //   ${
        //     active
        //       ? "bg-[#E8C16D] text-[#0A0E1A]"
        //       : "text-slate-300 hover:bg-white/10 hover:text-white"
        //   }`}
        //   style={{
        //     paddingLeft: `${16 + level * 20}px`,
        //     paddingRight: "16px",
        //   }}
        // >
        //   <div className="flex items-center gap-3">
        //     {item.icon && <item.icon size={20} />}

        //     {!sidebarCollapsed && (
        //       <span className="truncate">{item.label}</span>
        //     )}
        //   </div>
        // </Link>

        <button
          key={item.label}
          type="button"
          onClick={() => handleNavigation(item.href!)}
          className={`flex h-12 w-full items-center transition-colors
  ${
    active
      ? "bg-[#E8C16D] text-[#0A0E1A]"
      : "text-slate-300 hover:bg-white/10 hover:text-white"
  }`}
          style={{
            paddingLeft: `${16 + level * 20}px`,
            paddingRight: "16px",
          }}
        >
          <div className="flex items-center gap-3">
            {item.icon && <item.icon size={20} />}

            {!sidebarCollapsed && (
              <span className="truncate">{item.label}</span>
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
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 h-screen border-r border-[#E7E0D2] bg-[#0A0E1A] text-white transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
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
              <div className="grid h-10 w-10 shrink-0 place-items-center bg-[#E8C16D] font-bold text-xl text-[#0A0E1A]">
                OS
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

          <nav
            className="custom-scroll mt-10 flex-1 space-y-2 overflow-y-auto"
            style={{
              marginRight: "-19px",
              paddingRight: "10px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(232, 193, 109, 0.8) transparent",
            }}
          >
            {renderMenu(navItems)}
          </nav>

          <style jsx>{`
            .custom-scroll::-webkit-scrollbar {
              width: 4px;
            }
            .custom-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
              background: rgba(232, 193, 109, 0.8);
              border-radius: 9999px;
            }
            .custom-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(232, 193, 109, 0.8);
            }
          `}</style>

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
