"use client";

import { useState } from "react";
import Link from "next/link";

import { ChevronDown, LogOut, UserRound, Wallet } from "lucide-react";

import type { User } from "@/services/auth/auth.types";

interface Props {
  setLogoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const savedUser = localStorage.getItem("user");

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as User;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export default function ProfileDropdown({ setLogoutOpen }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);

  const [user] = useState<User | null>(getStoredUser);

  const openLogoutModal = () => {
    setProfileOpen(false);
    setLogoutOpen(true);
  };

  return (
    <div className="relative">
      <>
        <button
          type="button"
          onClick={() => setProfileOpen((prev) => !prev)}
          className="flex h-12 min-w-0 items-center gap-3 bg-white px-3 text-left shadow-sm transition-colors hover:bg-[#FBFAF7] sm:min-w-64"
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center bg-[#E8C16D] text-sm font-bold uppercase text-[#0A0E1A]">
            {(user?.fullName || user?.email || "U").charAt(0)}
          </div>

          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-sm font-bold">
              {user?.fullName || "User"}
            </p>

            <p className="truncate text-xs text-slate-500">
              {user?.email || "No email found"}
            </p>
          </div>

          <ChevronDown
            size={16}
            className={`ml-auto hidden transition-transform sm:block ${
              profileOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-14 z-30 w-72 border border-[#E7E0D2] bg-white p-3 shadow-lg">
            <div className="border-b border-[#E7E0D2] px-2 pb-3">
              <p className="truncate text-sm font-bold text-[#0A0E1A]">
                {user?.fullName || "User"}
              </p>

              <p className="mt-1 truncate text-xs text-slate-500">
                {user?.email || "No email found"}
              </p>
            </div>

            <Link
              href="/dashboard/profile"
              onClick={() => setProfileOpen(false)}
              className="mt-3 flex h-11 w-full items-center gap-3 px-3 text-sm font-semibold text-[#0A0E1A] transition-colors hover:bg-[#F7F5F0]"
            >
              <UserRound size={17} />
              Profile
            </Link>

            <Link
              href="/dashboard/wallet"
              onClick={() => setProfileOpen(false)}
              className="mt-1 flex h-11 w-full items-center gap-3 px-3 text-sm font-semibold text-[#0A0E1A] transition-colors hover:bg-[#F7F5F0]"
            >
              <Wallet size={17} />
              Wallet
            </Link>

            <div className="my-2 border-t border-[#E7E0D2]" />

            <button
              type="button"
              onClick={openLogoutModal}
              className="mt-1 flex h-11 w-full items-center gap-3 px-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        )}
      </>
    </div>
  );
}
