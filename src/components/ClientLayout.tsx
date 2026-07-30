"use client";

import { Toaster } from "sonner";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AccountLockChecker from "./AccountLockChecker";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // 🔥 Check initial status
    if (!navigator.onLine) {
      router.push("/offline");
    }

    const handleOffline = () => {
      router.push("/offline");
    };

    const handleOnline = () => {
      // ✅ Net આવે તરત જ Home Page પર જાઓ
      window.location.href = "/"; // Home page પર Redirect
      // window.location.reload(); // આના lieu માં આ પણ use કરી શકો
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [router]);

  return (
    <>
      {/* <ReactQueryProvider>
        {children}
        <Toaster position="top-right" richColors closeButton duration={3000} />
      </ReactQueryProvider> */}
      <ReactQueryProvider>
        <AccountLockChecker />

        {children}

        <Toaster position="top-right" richColors closeButton duration={3000} />
      </ReactQueryProvider>
    </>
  );
}
