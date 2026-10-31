"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import UserGeneralTab from "./UserGeneralTab";
import UserPhotoTab from "./UserPhotoTab";
import { useCreateUser, useUpdateUser } from "../hooks/useManageUsers";
import type { ManagedUser, UserFormValues } from "../types/userManagement.types";
import { toast } from "sonner";

interface Props {
  initialData?: ManagedUser | null;
  mode: "create" | "edit";
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UserProfileForm({ initialData, mode, onSuccess, onCancel }: Props) {
  const [activeTab, setActiveTab] = useState<"general" | "photo">("general");

  const [values, setValues] = useState<UserFormValues>({
    firstName: initialData?.firstName || "",
    middleName: initialData?.middleName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    password: "",
    dob: initialData?.dob ? initialData.dob.split("T")[0] : "",
    gender: initialData?.gender || "",
    departments: initialData?.departments || initialData?.userMapping?.departments || [],
    companies: initialData?.companies || initialData?.userMapping?.companies || [],
    role: initialData?.role || "USER",
    allowedPages:
      initialData?.allowedPages && initialData.allowedPages.length > 0
        ? initialData.allowedPages
        : initialData?.userMapping?.allowedPages || [],
    rights: initialData?.rights || "",
    avatar: initialData?.avatar || "",
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  React.useEffect(() => {
    if (initialData) {
      const allowed =
        initialData.allowedPages && initialData.allowedPages.length > 0
          ? initialData.allowedPages
          : initialData.userMapping?.allowedPages || [];

      setValues((prev) => ({
        ...prev,
        firstName: initialData.firstName || "",
        middleName: initialData.middleName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        dob: initialData.dob ? initialData.dob.split("T")[0] : "",
        gender: initialData.gender || "",
        departments: initialData.departments || initialData.userMapping?.departments || [],
        companies: initialData.companies || initialData.userMapping?.companies || [],
        role: initialData.role || "USER",
        allowedPages: allowed,
        rights: initialData.rights || "",
        avatar: initialData.avatar || "",
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      }));
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const loading = createUserMutation.isPending || updateUserMutation.isPending;

  const handleChange = (field: keyof UserFormValues, val: any) => {
    setValues((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof UserFormValues, string>> = {};

    if (!values.firstName.trim()) errs.firstName = "First name is required.";
    if (!values.lastName.trim()) errs.lastName = "Last name is required.";
    if (!values.email.trim() || !values.email.includes("@")) {
      errs.email = "Valid email is required.";
    }
    if (!values.phone || values.phone.length !== 10) {
      errs.phone = "10-digit mobile number is required.";
    }
    if (mode === "create" && (!values.password || values.password.length < 8)) {
      errs.password = "Password must be at least 8 characters.";
    }
    if (mode === "edit" && values.password && values.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    if (!values.departments || values.departments.length === 0) {
      errs.departments = "Please select at least one department.";
    }
    if (!values.companies || values.companies.length === 0) {
      errs.companies = "Please select at least one company.";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.firstName || errs.lastName || errs.email || errs.phone || errs.password || errs.departments || errs.companies) {
        setActiveTab("general");
      }
      toast.error("Please fill in all required fields correctly.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (mode === "create") {
        await createUserMutation.mutateAsync(values);
      } else if (initialData?.id) {
        const updatePayload: Partial<UserFormValues> = { ...values };
        if (!updatePayload.password) delete updatePayload.password;
        await updateUserMutation.mutateAsync({ id: initialData.id, data: updatePayload });
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
      {/* Hidden trap inputs to prevent browser autofill on user create/edit */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
        <input type="text" name="chrome_prevent_autofill_username" tabIndex={-1} autoComplete="off" defaultValue="" />
        <input type="password" name="chrome_prevent_autofill_password" tabIndex={-1} autoComplete="new-password" defaultValue="" />
      </div>

      {/* Tab Switcher Header matching Amazon OrderProcess & Analytics theme */}
      <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-[#141B2D] p-1.5 border border-slate-200 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "general"
              ? "bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          General
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("photo")}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "photo"
              ? "bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          Photo
        </button>
      </div>

      {/* Main Form Body */}
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-8 shadow-sm">
        {activeTab === "general" ? (
          <UserGeneralTab
            values={values}
            onChange={handleChange}
            errors={errors}
            mode={mode}
          />
        ) : (
          <UserPhotoTab
            avatar={values.avatar}
            onAvatarChange={(url) => handleChange("avatar", url)}
            allowedPages={values.allowedPages}
            onAllowedPagesChange={(pages) => handleChange("allowedPages", pages)}
            rights={values.rights}
            onRightsChange={(rights) => handleChange("rights", rights)}
            error={errors.allowedPages}
            firstName={values.firstName}
            middleName={values.middleName}
            lastName={values.lastName}
            email={values.email}
            role={values.role}
            phone={values.phone}
          />
        )}

        {/* Bottom Actions */}
        <div className="mt-8 pt-6 border-t border-[#E7E0D2] dark:border-white/[0.08] flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98] shadow-xs"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] h-11 px-7 rounded-2xl text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] active:scale-[0.98] shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Save size={16} />
                <span>Save</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
