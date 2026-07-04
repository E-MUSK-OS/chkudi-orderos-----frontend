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
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Close Button */}

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-gray-100 hover:text-black"
        >
          <X size={20} />
        </button>

        {/* Icon */}

        <div className="flex justify-center pt-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <TriangleAlert
              size={40}
              className="text-red-600"
            />
          </div>
        </div>

        {/* Content */}

        <div className="px-8 pb-8 pt-6 text-center">

          <h2 className="text-2xl font-bold text-[#0A0E1A]">
            Logout Account
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Are you sure you want to logout from your account?
            <br />
            You will need to login again to continue.
          </p>

          {/* Buttons */}

          <div className="mt-8 grid grid-cols-2 gap-4">

            <button
              onClick={onClose}
              className="h-12 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              onClick={handleLogout}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-red-600 font-semibold text-white transition hover:bg-red-700"
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}