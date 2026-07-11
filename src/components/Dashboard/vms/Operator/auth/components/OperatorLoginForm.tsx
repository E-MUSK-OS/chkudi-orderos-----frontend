"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { OperatorLoginPayload } from "../types/operatorAuth";
import { toast } from "sonner";

// ======================================================
// Validation
// ======================================================

const loginSchema = z.object({
  employeeCode: z.string().trim().min(1, "Employee code is required."),

  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface OperatorLoginFormProps {
  onSuccess?: () => void;
}

const OperatorLoginForm: React.FC<OperatorLoginFormProps> = ({ onSuccess }) => {
  const { login, loading } = useOperatorAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      employeeCode: "",
      password: "",
    },
  });

  const onSubmit = async (data: OperatorLoginPayload) => {
    try {
      const response = await login(data);
      toast.success(response.message);

      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
