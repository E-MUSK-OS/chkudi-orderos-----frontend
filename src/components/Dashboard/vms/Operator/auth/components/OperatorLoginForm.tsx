"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { OperatorLoginPayload } from "../types/operatorAuth";
import { getAccounts } from "../../../Admin/Account/services/account.service";
import { Account } from "../../../Admin/Account/types/account";

import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import { toast } from "sonner";

// ======================================================
// Validation
// ======================================================

const loginSchema = z.object({
  accountId: z.string().min(1, "Account is required."),

  employeeCode: z.string().trim().min(1, "Employee code is required."),

  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface OperatorLoginFormProps {
  onSuccess?: (account: Account) => void;
}

const OperatorLoginForm: React.FC<OperatorLoginFormProps> = ({ onSuccess }) => {
  const { login, loading } = useOperatorAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await getAccounts();

        setAccounts(response.data);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load accounts.",
        );
      }
    };

    fetchAccounts();
  }, []);

  const accountOptions: SelectOption[] = accounts.map((account) => ({
    label: account.accountName,
    value: account.id,
  }));

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      accountId: "",
      employeeCode: "",
      password: "",
    },
  });

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Account Name
        </label>

        <Controller
          control={control}
          name="accountId"
          render={({ field }) => (
            <ReactSelect
              placeholder="Select Account"
              options={accountOptions}
              value={
                accountOptions.find((option) => option.value === field.value) ??
                null
              }
              onChange={(option) => {
                field.onChange(option?.value ?? "");
              }}
            />
          )}
        />

        {errors.accountId && (
          <p className="text-sm text-red-500">{errors.accountId.message}</p>
        )}
      </div>

      <Input
        label="Employee Code"
        className="!bg-[#FFFDF5] border-[#EFE5D5] hover:border-[#DEC38E] focus:border-[#C89B3C] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#FFFDF5] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] dark:!bg-[#0F1626] dark:border-white/[0.1] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#0F1626] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
        labelClassName="bg-white text-slate-600 dark:bg-[#0F1626] dark:text-slate-400"
        {...register("employeeCode")}
        error={errors.employeeCode?.message}
      />

      <Input
        type="password"
        label="Password"
        className="!bg-[#FFFDF5] border-[#EFE5D5] hover:border-[#DEC38E] focus:border-[#C89B3C] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#FFFDF5] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] dark:!bg-[#0F1626] dark:border-white/[0.1] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#0F1626] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
        labelClassName="bg-white text-slate-600 dark:bg-[#0F1626] dark:text-slate-400"
        {...register("password")}
        error={errors.password?.message}
      />

      <Button type="submit" loading={loading} fullWidth>
        Login
      </Button>
    </form>
  );
};

export default OperatorLoginForm;
