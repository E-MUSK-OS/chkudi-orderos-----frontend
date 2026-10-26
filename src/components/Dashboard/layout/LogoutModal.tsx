"use client";

import { useRouter } from "next/navigation";
import { LogOut, TriangleAlert, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LogoutModal({
  open,
  onClose,
}: Props) {
  const router = useRouter();

  if (!open) return null;

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E7E0D2] bg-white shadow-2xl dark:border-white/[0.1] dark:bg-[#0F1626]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 transition hover:bg-gray-100 hover:text-black dark:hover:bg-white/[0.08] dark:hover:text-white cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="flex justify-center pt-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:border dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 dark:shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <TriangleAlert size={32} />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-6 text-center">
          <h2 className="text-xl font-bold text-[#0A0E1A] dark:text-white">
            Logout Account
          </h2>

          <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-500 dark:text-slate-400">
            Are you sure you want to logout from your account?
            <br />
            You will need to login again to continue.
          </p>

          {/* Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="h-11 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleLogout}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 text-xs sm:text-sm font-semibold text-white transition hover:bg-red-700 dark:bg-gradient-to-r dark:from-rose-600 dark:to-rose-700 dark:shadow-[0_0_20px_rgba(244,63,94,0.3)] dark:hover:brightness-110 cursor-pointer"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}