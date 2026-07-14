"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import {
  Account,
  CreateAccountPayload,
  UpdateAccountPayload,
} from "../types/account";

// ======================================================
// Validation
// ======================================================

const schema = z.object({
  accountName: z
    .string()
    .trim()
    .min(2, "Account name is required"),
});

type FormValues = z.infer<typeof schema>;

type AccountFormProps =
  | {
      mode: "create";
      account?: never;
      loading?: boolean;
      onSubmit: (
        data: Pick<CreateAccountPayload, "accountName">
      ) => void | Promise<void>;
    }
  | {
      mode: "update";
      account: Account | null;
      loading?: boolean;
      onSubmit: (
        data: UpdateAccountPayload
      ) => void | Promise<void>;
    };

const AccountForm: React.FC<AccountFormProps> = ({
  mode,
  account,
  loading = false,
  onSubmit,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),

    defaultValues: {
      accountName: "",
    },
  });

  // ======================================================
  // Reset Form
  // ======================================================

  useEffect(() => {
    if (mode === "update" && account) {
      form.reset({
        accountName: account.accountName,
      });
    }

    if (mode === "create") {
      form.reset({
        accountName: "",
      });
    }
  }, [mode, account, form]);

  // ======================================================
  // Submit
  // ======================================================

  const handleSubmit = async (values: FormValues) => {
    if (mode === "create") {
      await onSubmit({
        accountName: values.accountName,
      });
    } else {
      await onSubmit({
        accountName: values.accountName,
      });
    }

    if (mode === "create") {
      form.reset();
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
    >
      <Input
        label="Account Name"
        placeholder="Enter account name"
        {...form.register("accountName")}
        error={
          typeof form.formState.errors.accountName?.message ===
          "string"
            ? form.formState.errors.accountName.message
            : undefined
        }
      />

      <Button type="submit" loading={loading}>
        {mode === "create"
          ? "Add Account"
          : "Update Account"}
      </Button>
    </form>
  );
};

export default AccountForm;