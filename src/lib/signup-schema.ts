import { z } from "zod";

export const signupSchema = z
  .object({
    firstName: z.string().min(2, "Full name is required"),

    email: z.string().email("Invalid email"),

    password: z.string().min(8, "Password must be at least 8 characters"),

    confirmPassword: z.string(),

    terms: z.boolean().refine((value) => value === true, {
      message: "Please accept Terms & Conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignupFormData = z.infer<typeof signupSchema>;
