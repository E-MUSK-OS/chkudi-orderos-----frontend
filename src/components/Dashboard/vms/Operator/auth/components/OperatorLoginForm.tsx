"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { OperatorLoginPayload } from "../types/operatorAuth";
import { getAccounts } from "../../../Admin/Account/services/account.service";
import { Account } from "../../../Admin/Account/types/account";

import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import { toast } from "sonner";

// ======================================================
// Validation & Helpers
// ======================================================

export const isFlipkartAccountName = (name?: string): boolean => {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return (
    /(flip|filp)[kc]art/i.test(n) ||
    n.startsWith("fk") ||
    n.includes("fk ") ||
    n.includes("fk-") ||
    n.includes("fk_")
  );
};

const loginSchema = z.object({
  accountId: z.string().min(1, "Account is required."),

  employeeCode: z.string().trim().min(1, "Employee code is required."),

  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface OperatorLoginFormProps {
  onSuccess?: (account: Account) => void;
  isFlipkartSource?: boolean;
}

const OperatorLoginForm: React.FC<OperatorLoginFormProps> = ({
  onSuccess,
  isFlipkartSource: propIsFlipkartSource,
}) => {
  const { login, loading } = useOperatorAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);

  const isFkCheck = React.useMemo(() => {
    if (propIsFlipkartSource) return true;
    if (typeof window === "undefined") return false;
    const fromSession =
      /(flip|filp)[kc]art/i.test(sessionStorage.getItem("vms_source") || "") ||
      sessionStorage.getItem("vms_from_order_process") === "true";
    const fromLocal =
      /(flip|filp)[kc]art/i.test(localStorage.getItem("vms_source") || "") ||
      localStorage.getItem("vms_from_order_process") === "true";
    const searchStr = window.location.search || "";
    const params = new URLSearchParams(searchStr);
    const fromSearch =
      /(flip|filp)[kc]art/i.test(params.get("source") || "") ||
      params.get("from") === "order_process";

    return Boolean(fromSession || fromLocal || fromSearch);
  }, [propIsFlipkartSource]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      accountId: "",
      employeeCode: "",
      password: "",
    },
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await getAccounts();
        const accList: Account[] = response.data || [];
        setAccounts(accList);

        if (isFkCheck && accList.length > 0) {
          const flipkartAccount =
            accList.find((acc: Account) => isFlipkartAccountName(acc.accountName)) ||
            (accList.length === 1 ? accList[0] : null);

          if (flipkartAccount) {
            setValue("accountId", flipkartAccount.id, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true,
            });
          }
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load accounts.",
        );
      }
    };

    fetchAccounts();
  }, [isFkCheck, setValue]);

  // Dedicated effect to auto-select Flipkart account as soon as accounts or isFkCheck updates
  useEffect(() => {
    if (!isFkCheck || accounts.length === 0) return;

    const flipkartAccount =
      accounts.find((acc: Account) => isFlipkartAccountName(acc.accountName)) ||
      (accounts.length === 1 ? accounts[0] : null);

    if (flipkartAccount) {
      setValue("accountId", flipkartAccount.id, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [accounts, isFkCheck, setValue]);

  // When session is NOT Flipkart (e.g. after logout), reset account selection so user can pick any account
  useEffect(() => {
    if (!isFkCheck) {
      setValue("accountId", "");
    }
  }, [isFkCheck, setValue]);

  const accountOptions: SelectOption[] = accounts.map((account) => ({
    label: account.accountName,
    value: account.id,
  }));

  const onSubmit = async (data: OperatorLoginPayload) => {
    try {
      const response = await login(data);

      const selectedAccount = accounts.find(
        (account) => account.id === data.accountId,
      );

      if (!selectedAccount) {
        toast.error("Selected account not found.");
        return;
      }

      toast.success(response.message);

      onSuccess?.(selectedAccount);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
      <div className="space-y-2">
        <Controller
          control={control}
          name="accountId"
          render={({ field }) => {
            const matchedFk =
              isFkCheck && accounts.length > 0
                ? accounts.find((acc: Account) => isFlipkartAccountName(acc.accountName)) ||
                  (accounts.length === 1 ? accounts[0] : null)
                : null;

            let selectedOption =
              accountOptions.find((option) => option.value === (field.value || matchedFk?.id)) ??
              (matchedFk ? { label: matchedFk.accountName, value: matchedFk.id } : null);

            // Direct selection fallback if navigating from Flipkart
            if (matchedFk && field.value !== matchedFk.id) {
              setTimeout(() => {
                setValue("accountId", matchedFk.id, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }, 0);
            }

            return (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Account Name
                  </label>
                  {isFkCheck && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                      <Lock className="h-3 w-3" />
                      Locked to Flipkart
                    </span>
                  )}
                </div>

                <ReactSelect
                  placeholder="Select Account"
                  options={accountOptions}
                  value={selectedOption}
                  isDisabled={isFkCheck}
                  onChange={(option) => {
                    if (!isFkCheck) {
                      field.onChange(option?.value ?? "");
                    }
                  }}
                />
              </>
            );
          }}
        />

        {errors.accountId && (
          <p className="text-xs sm:text-sm text-red-500">{errors.accountId.message}</p>
        )}
      </div>

      <Input
        label="Employee Code"
        className="!bg-[#FFFDF5] border-[#EFE5D5] hover:border-[#DEC38E] focus:border-[#C89B3C] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#FFFDF5] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] dark:!bg-[#0F1626] dark:border-white/[0.1] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#0F1626] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
        labelClassName="bg-white text-slate-600 dark:bg-[#0F1626] dark:text-slate-400"
        inputClassName="h-12 sm:h-14 text-sm sm:text-[15px]"
        {...register("employeeCode")}
        error={errors.employeeCode?.message}
      />

      <Input
        type="password"
        label="Password"
        className="!bg-[#FFFDF5] border-[#EFE5D5] hover:border-[#DEC38E] focus:border-[#C89B3C] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#FFFDF5] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] dark:!bg-[#0F1626] dark:border-white/[0.1] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#0F1626] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
        labelClassName="bg-white text-slate-600 dark:bg-[#0F1626] dark:text-slate-400"
        inputClassName="h-12 sm:h-14 text-sm sm:text-[15px]"
        {...register("password")}
        error={errors.password?.message}
      />

      <Button
        type="submit"
        loading={loading}
        fullWidth
        className="h-12 sm:h-14 text-sm sm:text-[15px] font-bold"
      >
        Login
      </Button>
    </form>
  );
};

export default OperatorLoginForm;
