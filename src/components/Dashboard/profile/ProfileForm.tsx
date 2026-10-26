"use client";

import { FormEvent, useState } from "react";
import { Mail, Save, UserRound } from "lucide-react";
import { toast } from "sonner";

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

export default function ProfileForm() {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const [profileForm, setProfileForm] = useState(() => {
    const savedUser = getStoredUser();

    return {
      fullName: savedUser?.fullName ?? "",
      email: savedUser?.email ?? "",
    };
  });

  const handleSubmit = (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const fullName = profileForm.fullName.trim();
    const email = profileForm.email.trim();

    if (!fullName) {
      toast.error("Full name is required.");
      return;
    }

    if (!email || !email.includes("@")) {
      toast.error("Valid email is required.");
      return;
    }

    const updatedUser: User = {
      id: user?.id ?? "",
      fullName,
      email,
      isEmailVerified:
        user?.isEmailVerified ?? false,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);

    toast.success(
      "Profile updated successfully."
    );
  };

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="flex items-start gap-4 border-b border-[#E7E0D2] pb-5 dark:border-white/[0.08]">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#E8C16D] text-2xl font-bold uppercase text-[#0A0E1A] dark:bg-[#F5C451] dark:text-[#080B11] shadow-xs">
          {(user?.fullName ||
            user?.email ||
            "U").charAt(0)}
        </div>

        <div className="min-w-0">
          <h3 className="text-xl sm:text-2xl font-bold text-[#0A0E1A] dark:text-white">
            {user?.fullName || "User"}
          </h3>

          <p className="mt-1 truncate text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {user?.email ||
              "No email found"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Full Name
            </span>

            <div className="mt-2 flex h-11 sm:h-12 items-center gap-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-4 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451]">
              <UserRound
                size={18}
                className="text-slate-400 dark:text-slate-500 shrink-0"
              />

              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    fullName:
                      e.target.value,
                  }))
                }
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </label>

          <label>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email Address
            </span>

            <div className="mt-2 flex h-11 sm:h-12 items-center gap-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-4 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451]">
              <Mail
                size={18}
                className="text-slate-400 dark:text-slate-500 shrink-0"
              />

              <input
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    email:
                      e.target.value,
                  }))
                }
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl bg-[#0A0E1A] hover:bg-[#161D2E] px-6 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer dark:bg-gradient-to-r dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11] dark:shadow-[0_0_16px_rgba(245,196,81,0.25)]"
        >
          <Save size={18} />
          Update Profile
        </button>
      </form>
    </section>
  );
}