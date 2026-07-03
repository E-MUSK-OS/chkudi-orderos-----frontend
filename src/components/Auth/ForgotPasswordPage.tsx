"use client";

import { useState } from "react";

import ForgotPasswordForm from "@/components/Auth/ForgotPasswordForm";
import ForgotPasswordOtpForm from "@/components/Auth/ForgotPasswordOtpForm";
import ResetPasswordForm from "@/components/Auth/ResetPasswordForm";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");

  const [resetToken, setResetToken] = useState("");

  return (
    <>
      {step === 1 && (
        <ForgotPasswordForm onNext={() => setStep(2)} setEmail={setEmail} />
      )}

      {step === 2 && (
        <ForgotPasswordOtpForm
          email={email}
          onNext={(token) => {
            setResetToken(token);
            setStep(3);
          }}
        />
      )}

      {step === 3 && <ResetPasswordForm resetToken={resetToken} />}
    </>
  );
}
