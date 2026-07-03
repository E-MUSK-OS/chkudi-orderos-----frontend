import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        8,
        "Password must be at least 8 characters"
      ),

    confirmPassword: z.string(),
  })
  .refine(
    (data) =>
      data.password === data.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Passwords do not match",
    }
  );

export type ResetPasswordFormData =
  z.infer<typeof resetPasswordSchema>;