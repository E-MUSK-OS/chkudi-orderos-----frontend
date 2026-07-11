import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import {
  CreateOperatorPayload,
  Operator,
  UpdateOperatorPayload,
} from "../types/operator";

// ======================================================
// Validation
// ======================================================

const createSchema = z.object({
  operatorName: z
    .string()
    .trim()
    .min(2, "Operator name is required"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

const updateSchema = z.object({
  operatorName: z
    .string()
    .trim()
    .min(2, "Operator name is required"),

  isActive: z.boolean(),
});

type CreateFormValues = z.infer<typeof createSchema>;
type UpdateFormValues = z.infer<typeof updateSchema>;

interface OperatorFormProps {
  mode: "create" | "update";

  operator?: Operator | null;

  loading?: boolean;

  onSubmit: (
    data: CreateOperatorPayload | UpdateOperatorPayload
  ) => void;
}

const OperatorForm: React.FC<OperatorFormProps> = ({
  mode,
  operator,
  loading = false,
  onSubmit,
}) => {
  const form = useForm<CreateFormValues | UpdateFormValues>({
    resolver: zodResolver(
      mode === "create" ? createSchema : updateSchema
    ),

    defaultValues:
      mode === "create"
        ? {
            operatorName: "",
            password: "",
          }
        : {
            operatorName: "",
            isActive: true,
          },
  });

  useEffect(() => {
    if (mode === "update" && operator) {
      form.reset({
        operatorName: operator.operatorName,
        isActive: operator.isActive,
      });
    }
  }, [form, mode, operator]);

  return (
    <form
      onSubmit={form.handleSubmit((values) =>
        onSubmit(
          values as CreateOperatorPayload | UpdateOperatorPayload
        )
      )}
      className="space-y-5"
    >
      {/* Operator Name */}

      <Input
        label="Operator Name"
        // placeholder="Enter operator name"
        {...form.register("operatorName")}
        error={form.formState.errors.operatorName?.message}
      />

      {mode === "create" && (
        <Input
          type="password"
          label="Password"
        //   placeholder="Enter password"
          {...form.register("password")}
          error={
            "password" in form.formState.errors
              ? form.formState.errors.password?.message
              : undefined
          }
        />
      )}

      {/* Status */}

      {mode === "update" && (
        <div className="flex items-center justify-between border border-slate-200 p-4">
          <span className="text-sm font-medium text-slate-700">
            Active Operator
          </span>

          <input
            type="checkbox"
            className="h-5 w-5 cursor-pointer"
            checked={
              "isActive" in form.getValues()
                ? Boolean(form.watch("isActive"))
                : false
            }
            onChange={(e) =>
              form.setValue("isActive", e.target.checked)
            }
          />
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
      >
        {mode === "create"
          ? "Create Operator"
          : "Update Operator"}
      </Button>
    </form>
  );
};

export default OperatorForm;