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
    <section className="border border-[#E7E0D2] bg-white p-5 shadow-sm">

      <div className="flex items-start gap-4 border-b border-[#E7E0D2] pb-5">

        <div className="grid h-14 w-14 shrink-0 place-items-center bg-[#E8C16D] text-2xl font-bold uppercase text-[#0A0E1A]">
          {(user?.fullName ||
            user?.email ||
            "U").charAt(0)}
        </div>

        <div className="min-w-0">

          <h3 className="text-2xl font-bold">
            {user?.fullName || "User"}
          </h3>

          <p className="mt-1 truncate text-sm text-slate-500">
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

            <span className="text-sm font-semibold text-slate-700">
              Full Name
            </span>

            <div className="mt-2 flex h-12 items-center gap-3 border border-[#E2E5EA] px-4 focus-within:border-[#C89B3C]">

              <UserRound
                size={18}
                className="text-slate-400"
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
                className="w-full bg-transparent outline-none"
              />

            </div>

          </label>

          <label>

            <span className="text-sm font-semibold text-slate-700">
              Email Address
            </span>

            <div className="mt-2 flex h-12 items-center gap-3 border border-[#E2E5EA] px-4 focus-within:border-[#C89B3C]">

              <Mail
                size={18}
                className="text-slate-400"
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
                className="w-full bg-transparent outline-none"
              />

            </div>

          </label>

        </div>

        <button
          type="submit"
          className="flex h-12 items-center gap-2 bg-[#0A0E1A] px-5 font-semibold text-white hover:bg-[#161D2E]"
        >
          <Save size={18} />

          Update Profile
        </button>

      </form>

    </section>
  );
}