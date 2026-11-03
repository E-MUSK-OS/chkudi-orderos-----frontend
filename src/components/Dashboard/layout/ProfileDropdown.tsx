"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound, Wallet, Warehouse } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
}

interface Props {
  setLogoutOpen: (open: boolean) => void;
}

export default function ProfileDropdown({ setLogoutOpen }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const openLogoutModal = () => {
    setProfileOpen(false);
    setLogoutOpen(true);
  };

  return (
    <div className="relative" ref={profileRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((prev) => !prev)}
          className="flex h-11 w-11 sm:w-auto sm:min-w-56 items-center justify-center sm:justify-start gap-2.5 rounded-xl border border-[#E7E0D2] bg-white px-0 sm:px-3 text-left shadow-xs transition-all hover:border-[#E8C16D] hover:bg-[#FFF8E7] cursor-pointer dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/40 dark:hover:bg-[#131B2E] shrink-0"
        >
          <div className="relative shrink-0">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#E8C16D] text-xs font-black uppercase text-[#0A0E1A] dark:bg-gradient-to-br dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11] dark:shadow-[0_0_12px_rgba(245,196,81,0.25)]">
              {(user?.fullName || user?.email || "U").charAt(0)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0F1626]" />
          </div>

          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-xs font-bold text-[#0A0E1A] dark:text-slate-100">
              {user?.fullName || "User"}
            </p>

            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {user?.email || "No email found"}
            </p>
          </div>

          <motion.div
            animate={{ rotate: profileOpen ? 180 : 0 }}
            transition={{
              duration: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="ml-auto hidden text-slate-500 dark:text-slate-400 sm:block"
          >
            <ChevronDown size={15} />
          </motion.div>
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -8,
                scale: 0.96,
              }}
              transition={{
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute right-0 top-12 z-30 w-[calc(100vw-2rem)] sm:w-72 max-w-xs sm:max-w-sm rounded-2xl origin-top-right border border-[#E7E0D2] bg-white p-2.5 shadow-xl dark:border-white/[0.1] dark:bg-[#0F1626] dark:shadow-2xl"
            >
              <div className="border-b border-[#E7E0D2] dark:border-white/[0.08] px-3 py-2.5">
                <p className="truncate text-xs font-bold text-[#0A0E1A] dark:text-white">
                  {user?.fullName || "User"}
                </p>

                <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {user?.email || "No email found"}
                </p>
              </div>

              <div className="mt-1.5 space-y-0.5">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-xs font-semibold text-[#0A0E1A] transition-colors hover:bg-[#F7F5F0] dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-[#F5C451]"
                >
                  <UserRound size={16} />
                  Profile
                </Link>

                <Link
                  href="/warehouse"
                  onClick={() => setProfileOpen(false)}
                  className="flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-xs font-semibold text-[#0A0E1A] transition-colors hover:bg-[#F7F5F0] dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-[#F5C451]"
                >
                  <Warehouse size={16} />
                  Warehouse
                </Link>

                <Link
                  href="/wallet"
                  onClick={() => setProfileOpen(false)}
                  className="flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-xs font-semibold text-[#0A0E1A] transition-colors hover:bg-[#F7F5F0] dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-[#F5C451]"
                >
                  <Wallet size={16} />
                  Wallet
                </Link>
              </div>

              <div className="my-1.5 border-t border-[#E7E0D2] dark:border-white/[0.06]" />

              <button
                type="button"
                onClick={openLogoutModal}
                className="flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 cursor-pointer"
              >
                <LogOut size={16} />
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
