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
    href: "/dashboard/products/inventory",
    icon: Package,
    children: [
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
          {
            label: "Myntra Picklist",
            href: "/dashboard/order-process/myntra/myntra-picklist",
          },
          {
            label: "Stock Analysis",
            href: "/dashboard/order-process/myntra/stock-analysis",
          },
          {
            label: "Invoice Formatter",
            href: "/dashboard/order-process/myntra/invoice-formatter",
          },
        ],
      },
      {
        label: "Amazon",
        children: [
          {
            label: "Order Process",
            href: "/dashboard/order-process/amazon/order-process",
          },
          {
            label: "AWB Scan",
            href: "/dashboard/order-process/amazon/awb-scan",
          },
        ],
      },
    ],
  },
  {
    label: "Products Analytics",
    icon: Package,
    children: [
      {
        label: "Amazon",
        href: "/dashboard/products-analytics/amazon",
      },
    ],
  },
  {
    label: "Transaction",
    icon: ArrowLeftRight,
    children: [
      {
        label: "Sales",
        children: [
          {
            label: "PO Based",
            children: [
              {
                label: "Upload Requested PO",
                href: "/dashboard/transaction/sales/po-based/upload-requested-po",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Offline Sales",
    icon: FileSpreadsheet,
    children: [
      {
        label: "Sales Challan",
        href: "/dashboard/offline-sales/sales-challan",
      },
      {
        label: "Sales Invoice",
        href: "/dashboard/offline-sales/sales-invoice",
      },
    ],
  },
  {
    label: "Purchase",
    icon: ShoppingBag,
    children: [
      {
        label: "Finish Goods",
        children: [
          {
            label: "Purchase Challan",
            href: "/dashboard/purchase/finish-goods/challan",
          },
          {
            label: "Purchase Invoice",
            href: "/dashboard/purchase/finish-goods/invoice",
          },
        ],
      },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      {
        label: "Manage Product",
        href: "/dashboard/settings/manage-product/product-profile",
        children: [
          {
            label: "Product Profile",
            href: "/dashboard/settings/manage-product/product-profile",
          },
        ],
      },
      {
        label: "Manage Material",
        href: "/dashboard/settings/manage-material/material-profile",
        children: [
          {
            label: "Material Profile",
            href: "/dashboard/settings/manage-material/material-profile",
          },
        ],
      },
      {
        label: "Webstore",
        href: "/dashboard/settings/webstore",
      },
      {
        label: "Barcode/Labels",
        icon: ScanBarcode,
        children: [
          {
            label: "Label Config",
            href: "/dashboard/settings/labels/label-config",
          },
          {
            label: "Label Print",
            href: "/dashboard/settings/labels/label-print",
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

    router.push(href);
  };

  const findActivePath = (
    items: NavItem[],
    path: string,
    trail: string[] = [],
  ): string[] | null => {
    for (const item of items) {
      const nextTrail = [...trail, item.label];

      if (
        (item.href && path === item.href) ||
        (item.href === "/dashboard/purchase/finish-goods/invoice" && path === "/dashboard/purchase-invoice") ||
        (item.href === "/dashboard/purchase/finish-goods/challan" && path === "/dashboard/purchase-challan") ||
        ((item.href === "/dashboard/settings/manage-product" || item.href === "/dashboard/settings/manage-product/product-profile") &&
          path.startsWith("/dashboard/settings/manage-product")) ||
        ((item.href === "/dashboard/settings/manage-material" || item.href === "/dashboard/settings/manage-material/material-profile") &&
          path.startsWith("/dashboard/settings/manage-material")) ||
        (item.href === "/dashboard/settings/labels/label-config" &&
          (path === "/dashboard/settings/labels/label-config" || path.startsWith("/dashboard/settings/labels/label-config"))) ||
        (item.href === "/dashboard/settings/labels/label-print" &&
          path === "/dashboard/settings/labels/label-print")
      ) {
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
    if (
      item.href === "/dashboard/purchase/finish-goods/invoice" &&
      pathname === "/dashboard/purchase-invoice"
    ) {
      return true;
    }
    if (
      item.href === "/dashboard/purchase/finish-goods/challan" &&
      pathname === "/dashboard/purchase-challan"
    ) {
      return true;
    }
    if (
      (item.href === "/dashboard/settings/manage-product" || item.href === "/dashboard/settings/manage-product/product-profile") &&
      pathname.startsWith("/dashboard/settings/manage-product")
    ) {
      return true;
    }
    if (
      (item.href === "/dashboard/settings/manage-material" || item.href === "/dashboard/settings/manage-material/material-profile") &&
      pathname.startsWith("/dashboard/settings/manage-material")
    ) {
      return true;
    }
    if (
      item.href === "/dashboard/settings/labels/label-config" &&
      (pathname === "/dashboard/settings/labels/label-config" || pathname.startsWith("/dashboard/settings/labels/label-config"))
    ) {
      return true;
    }
    if (
      item.href === "/dashboard/settings/labels/label-print" &&
      pathname === "/dashboard/settings/labels/label-print"
    ) {
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
              className={`group flex h-12 w-full items-center justify-between cursor-pointer transition-all duration-300 ease-out
              ${
                isSelfActive
                  ? "bg-gradient-to-r from-[#F5C451]/20 via-[#F5C451]/5 to-transparent text-white border-l-2 border-[#F5C451] font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
                  : active
                  ? "text-white bg-white/[0.06]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
              style={{
                paddingLeft: `${16 + level * 20}px`,
                paddingRight: "16px",
              }}
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <item.icon
                    size={20}
                    className={`shrink-0 transition-colors ${
                      isSelfActive || active
                        ? "text-[#F5C451]"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                )}

                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>

              {!sidebarCollapsed &&
                (isOpen ? (
                  <ChevronUp
                    size={18}
                    className={
                      isSelfActive || active
                        ? "text-[#F5C451]"
                        : "text-slate-400 group-hover:text-slate-200"
                    }
                  />
                ) : (
                  <ChevronDown
                    size={18}
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
          className={`group flex h-12 w-full items-center cursor-pointer transition-all duration-300 ease-out
  ${
    active
      ? "bg-gradient-to-r from-[#F5C451]/20 via-[#F5C451]/5 to-transparent text-white border-l-2 border-[#F5C451] font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
  }`}
          style={{
            paddingLeft: `${16 + level * 20}px`,
            paddingRight: "16px",
          }}
        >
          <div className="flex items-center gap-3">
            {item.icon && (
              <item.icon
                size={20}
                className={`shrink-0 transition-colors ${
                  active
                    ? "text-[#F5C451]"
                    : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
            )}

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
            className="custom-scroll mt-10 flex-1 space-y-2 overflow-y-auto"
            style={{
              marginRight: "-19px",
              paddingRight: "10px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(245, 196, 81, 0.35) transparent",
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

