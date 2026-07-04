"use client";

import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@/services/auth/auth.types";

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

export default function AccountStatus() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <aside className="space-y-6">

      {/* Account Status */}

      <section className="border border-[#E7E0D2] bg-white p-5 shadow-sm">

        <h3 className="text-xl font-bold text-[#0A0E1A]">
          Account Status
        </h3>

        <div className="mt-5 space-y-4">

          {/* Email Verification */}

          <div className="flex items-center justify-between">

            <span className="text-sm font-medium text-slate-600">
              Email Verification
            </span>

            <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} />

              {user?.isEmailVerified
                ? "Verified"
                : "Pending"}
            </span>

          </div>

          {/* User ID */}

          <div className="flex items-center justify-between">

            <span className="text-sm font-medium text-slate-600">
              User ID
            </span>

            <span className="max-w-40 truncate text-xs font-semibold text-slate-500">
              {user?.id || "Not Available"}
            </span>

          </div>

          {/* Email */}

          <div className="flex items-center justify-between">

            <span className="text-sm font-medium text-slate-600">
              Email
            </span>

            <span className="max-w-40 truncate text-xs font-semibold text-slate-500">
              {user?.email || "--"}
            </span>

          </div>

        </div>

      </section>

      {/* Info Card */}

      <section className="bg-[#0A0E1A] p-6 text-white shadow-sm">

        <p className="text-sm font-semibold uppercase tracking-wide text-[#E8C16D]">
          Profile
        </p>

        <h3 className="mt-3 text-2xl font-bold">
          Keep your account details updated
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          Changes made here are stored in your current
          dashboard session. Keep your profile information
          accurate for a better experience.
        </p>

      </section>

    </aside>
  );
}