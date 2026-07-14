"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { OperatorLoginPayload } from "../types/operatorAuth";
import { getAccounts } from "../../../Admin/Account/services/account.service";
import { Account } from "../../../Admin/Account/types/account";
import { Controller } from "react-hook-form";

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
        <label className="text-sm font-medium text-slate-700">
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
        // placeholder="EMP001"
        {...register("employeeCode")}
        error={errors.employeeCode?.message}
      />

      <Input
        type="password"
        label="Password"
        // placeholder="Enter Password"
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
