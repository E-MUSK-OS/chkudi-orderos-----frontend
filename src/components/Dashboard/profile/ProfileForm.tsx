"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Save,
  UserRound,
  Phone,
  Calendar,
  UserCheck,
  AtSign,
  Upload,
  Trash2,
  Camera,
  Loader2,
  Building2,
  Briefcase,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, isValid } from "date-fns";

import type { User } from "@/services/auth/auth.types";
import { profileService } from "@/services/profile.service";
import { userManagementService } from "@/components/Dashboard/Settings/ManageUsers/services/userManagement.service";
import { useUserDropdownOptions } from "@/components/Dashboard/Settings/ManageUsers/hooks/useManageUsers";
import { getAvatarUrl } from "@/components/Dashboard/Settings/ManageUsers/utils/avatarUrl";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { buildMergedOptions } from "@/utils/dropdownOptions.utils";

export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0].charAt(0).toUpperCase();
      const last = parts[parts.length - 1].charAt(0).toUpperCase();
      return `${first}${last}`;
    }
    if (parts.length === 1) {
      const word = parts[0].toUpperCase();
      return word.length >= 2 ? word.slice(0, 2) : word;
    }
  }
  if (email && email.trim()) {
    const clean = email.split("@")[0].trim().replace(/[^a-zA-Z0-9]/g, " ");
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
  }
  return "EM";
}

function formatDobForInput(rawDob: any): string {
  if (!rawDob) return "";
  if (typeof rawDob === "string") {
    const trimmed = rawDob.trim();
    if (!trimmed) return "";
    // If it starts with YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
    }
    // If DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, "0");
      const m = dmyMatch[2].padStart(2, "0");
      const y = dmyMatch[3];
      return `${y}-${m}-${d}`;
    }
  }
  try {
    const d = new Date(rawDob);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch {}
  return "";
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
    return null;
  }
}

export default function ProfileForm() {
  const queryClient = useQueryClient();
  const { data: dropdownData } = useUserDropdownOptions();
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    username: "",
    dob: "",
    gender: "",
    avatar: "",
  });

  const [dobInput, setDobInput] = useState("");

  useEffect(() => {
    setDobInput(profileForm.dob || "");
  }, [profileForm.dob]);

  const currentAvatar = profileForm.avatar || user?.avatar;

  useEffect(() => {
    setImageError(false);
  }, [currentAvatar]);

  const handleDobInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDobInput(val);

    if (!val.trim()) {
      setProfileForm((prev) => ({ ...prev, dob: "" }));
      return;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
      const parsed = parseISO(val.trim());
      if (isValid(parsed)) {
        setProfileForm((prev) => ({ ...prev, dob: val.trim() }));
      }
    }
  };

  const handleDobInputBlur = () => {
    const trimmed = dobInput.trim();
    if (!trimmed) {
      setProfileForm((prev) => ({ ...prev, dob: "" }));
      return;
    }

    const formatted = formatDobForInput(trimmed);
    if (formatted) {
      setDobInput(formatted);
      setProfileForm((prev) => ({ ...prev, dob: formatted }));
    } else {
      setDobInput(profileForm.dob || "");
    }
  };

  const parsedSelectedDate = useMemo(() => {
    if (!profileForm.dob) return undefined;
    try {
      const p = parseISO(profileForm.dob);
      return isValid(p) ? p : undefined;
    } catch {
      return undefined;
    }
  }, [profileForm.dob]);

  const genderOptions = useMemo(() => {
    const masterOptions = buildMergedOptions("gender", [], dropdownData?.savedOptions);
    if (masterOptions.length > 0) return masterOptions;
    if (dropdownData?.genders && dropdownData.genders.length > 0) {
      return dropdownData.genders.map((g: string) => ({ value: g, label: g }));
    }
    return [];
  }, [dropdownData?.savedOptions, dropdownData?.genders]);

  const initials = useMemo(
    () => getInitials(profileForm.fullName || user?.fullName, profileForm.email || user?.email),
    [profileForm.fullName, profileForm.email, user?.fullName, user?.email]
  );

  const populateUserData = (data: any) => {
    if (!data) return;
    setUser(data);
    setProfileForm({
      fullName: data.fullName || "",
      email: data.email || "",
      phone: data.phone || "",
      username: data.username || "",
      dob: formatDobForInput(data.dob),
      gender: data.gender ? String(data.gender).trim() : "",
      avatar: data.avatar || "",
    });
  };

  useEffect(() => {
    setIsMounted(true);
    let isMountedRef = true;

    // Load initial cached user data on client mount
    const cached = getStoredUser();
    if (cached) {
      populateUserData(cached);
    }

    // Fetch fresh profile from server
    (async () => {
      try {
        const data = await profileService.getProfile();
        if (isMountedRef && data) {
          populateUserData(data);
        }
      } catch (err) {
        console.warn("Could not fetch fresh profile:", err);
      }
    })();

    const handleSync = () => {
      const fresh = getStoredUser();
      if (fresh) populateUserData(fresh);
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("user_profile_updated", handleSync);

    return () => {
      isMountedRef = false;
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("user_profile_updated", handleSync);
    };
  }, []);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const res = await userManagementService.uploadPhoto(file);
      const uploadedUrl = res.secure_url || (res as any).nas_url || (res as any).url;

      if (!uploadedUrl) {
        throw new Error("Failed to get uploaded photo URL");
      }

      setProfileForm((prev) => ({ ...prev, avatar: uploadedUrl }));

      const updated = await profileService.updateProfile({
        avatar: uploadedUrl,
      });

      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      queryClient.invalidateQueries({ queryKey: ["managed-user", updated.id] });
      toast.success("Profile photo updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload profile photo.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      setProfileForm((prev) => ({ ...prev, avatar: "" }));

      const updated = await profileService.updateProfile({
        avatar: null,
      });

      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      queryClient.invalidateQueries({ queryKey: ["managed-user", updated.id] });
      toast.success("Profile photo removed.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fullName = profileForm.fullName.trim();
    if (!fullName) {
      toast.error("Full name is required.");
      return;
    }

    const email = profileForm.email.trim();
    if (!email) {
      toast.error("Email address is required.");
      return;
    }

    try {
      setIsSaving(true);
      const updated = await profileService.updateProfile({
        fullName,
        email,
        phone: profileForm.phone.trim() || null,
        dob: profileForm.dob ? profileForm.dob : null,
        gender: profileForm.gender.trim() || null,
        avatar: profileForm.avatar || null,
      });

      populateUserData(updated);
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      queryClient.invalidateQueries({ queryKey: ["managed-user", updated.id] });
      toast.success("Profile updated successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Safe SSR placeholder to completely prevent hydration mismatch
  if (!isMounted) {
    return (
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626] animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#E7E0D2] pb-6 dark:border-white/[0.08]">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-3xl bg-slate-200 dark:bg-white/[0.06]" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-44 rounded-xl bg-slate-200 dark:bg-white/[0.06]" />
              <div className="h-4 w-28 rounded-lg bg-slate-200 dark:bg-white/[0.06]" />
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-11 sm:h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04]" />
          ))}
        </div>
      </section>
    );
  }

  const roleBadgeStyle = {
    SUPERADMIN: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    ADMIN: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    USER: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
  }[(user?.role as "SUPERADMIN" | "ADMIN" | "USER") || "USER"] || "bg-slate-500/15 text-slate-400 border-slate-500/30";

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-7 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      {/* Top Banner / Avatar Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#E7E0D2] pb-6 dark:border-white/[0.08]">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          {/* Avatar Picture with Loading Overlay */}
          <div className="relative group shrink-0">
            {currentAvatar && !imageError ? (
              <div className="relative h-20 w-20 sm:h-22 sm:w-22 rounded-3xl overflow-hidden border-2 border-[#E8C16D] dark:border-[#F5C451] shadow-md bg-slate-100 dark:bg-white/[0.05]">
                <Image
                  src={getAvatarUrl(currentAvatar)}
                  alt={user?.fullName || "Profile Avatar"}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="grid h-20 w-20 sm:h-22 sm:w-22 place-items-center rounded-3xl border-2 border-[#E8C16D] dark:border-[#F5C451] bg-gradient-to-br from-[#E8C16D] via-[#DBA742] to-[#B88728] text-2xl sm:text-3xl font-black tracking-wider uppercase text-[#0A0E1A] shadow-md select-none">
                {initials}
              </div>
            )}

            {/* Hover Camera Trigger Overlay */}
            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer disabled:cursor-not-allowed"
              title="Change Profile Photo"
            >
              {isUploadingPhoto ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#E8C16D]" />
              ) : (
                <>
                  <Camera className="w-5 h-5 text-white" />
                  <span className="text-[10px] font-bold mt-1">Change</span>
                </>
              )}
            </button>
          </div>

          {/* User Name & Metadata */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A0E1A] dark:text-white truncate">
                {profileForm.fullName || user?.fullName || "User"}
              </h2>
              {user?.role && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider border ${roleBadgeStyle}`}>
                  <Shield size={11} />
                  {user.role}
                </span>
              )}
            </div>

            <p className="truncate text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              @{profileForm.username || user?.username || "user"}
            </p>

            <div className="flex items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Account
              </span>
            </div>
          </div>
        </div>

        {/* Photo Upload & Removal Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoSelect}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            disabled={isUploadingPhoto}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {isUploadingPhoto ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B88728] dark:text-[#E8C16D]" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
            )}
            <span>{isUploadingPhoto ? "Uploading..." : "Upload Photo"}</span>
          </button>

          {currentAvatar && (
            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={handleRemovePhoto}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Remove Profile Photo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Full Name */}
          <label className="block">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Full Name *
            </span>
            <div className="mt-2 flex h-11 sm:h-12 items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-4 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451]">
              <UserRound size={17} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                required
                value={profileForm.fullName}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter your full name"
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </label>

          {/* Username */}
          <label className="block">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Username
            </span>
            <div className="mt-2 flex h-11 sm:h-12 items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11]/60 px-4 shadow-xs">
              <AtSign size={17} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="text"
                disabled
                value={profileForm.username}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
              />
            </div>
          </label>

          {/* Email Address */}
          <label className="block">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email Address *
            </span>
            <div className="mt-2 flex h-11 sm:h-12 items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-4 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451]">
              <Mail size={17} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email address"
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </label>

          {/* Phone Number */}
          <label className="block">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Mobile Number
            </span>
            <div className="mt-2 flex h-11 sm:h-12 items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-4 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451]">
              <Phone size={17} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter 10-digit mobile number"
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </label>

          {/* Date of Birth */}
          <div className="block">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Date of Birth
            </span>
            <div className="relative mt-2">
              <div className="flex h-11 sm:h-12 items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-4 shadow-xs transition-all hover:border-[#E8C16D] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 dark:hover:border-[#F5C451]/50 dark:focus-within:border-[#F5C451]">
                <Calendar size={17} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={dobInput}
                  onChange={handleDobInputChange}
                  onBlur={handleDobInputBlur}
                  placeholder="YYYY-MM-DD (e.g. 1995-12-25)"
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] outline-none dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-2"
                />

                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                  <PopoverTrigger
                    type="button"
                    className="p-1.5 rounded-xl text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
                    title="Open calendar picker"
                  >
                    <Calendar size={16} />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-xl rounded-2xl z-50"
                    align="end"
                  >
                    <CalendarPicker
                      mode="single"
                      selected={parsedSelectedDate}
                      onSelect={(date) => {
                        if (date) {
                          const formatted = format(date, "yyyy-MM-dd");
                          setDobInput(formatted);
                          setProfileForm((prev) => ({ ...prev, dob: formatted }));
                          setIsDatePopoverOpen(false);
                        }
                      }}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Gender */}
          <div className="block">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Gender
            </span>
            <div className="mt-2">
              <ThemeSelectDropdown
                value={profileForm.gender}
                onChange={(val) => setProfileForm((prev) => ({ ...prev, gender: val }))}
                options={genderOptions}
                placeholder="Select Gender"
                icon={<UserCheck size={16} />}
                className="w-full block"
                buttonClassName="w-full h-11 sm:h-12 justify-between bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-2xl px-4 shadow-xs"
                menuClassName="w-full max-w-none"
              />
            </div>
          </div>
        </div>

        {/* Assigned Departments & Companies Badges */}
        {(user?.departments?.length || user?.companies?.length) ? (
          <div className="pt-2 grid gap-4 sm:grid-cols-2">
            {user?.departments && user.departments.length > 0 && (
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02]">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                  <Building2 size={14} className="text-[#B88728] dark:text-[#E8C16D]" /> Assigned Departments
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {user.departments.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-[#080B11] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] shadow-2xs"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user?.companies && user.companies.length > 0 && (
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02]">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                  <Briefcase size={14} className="text-[#B88728] dark:text-[#E8C16D]" /> Assigned Companies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {user.companies.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-[#080B11] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] shadow-2xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-2xl border border-[#E8C16D]/60 bg-[#FEFAEE] px-7 text-xs sm:text-sm font-bold text-[#6A4D1D] shadow-xs transition-all hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98] cursor-pointer dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11] dark:shadow-[0_0_16px_rgba(245,196,81,0.25)] disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
