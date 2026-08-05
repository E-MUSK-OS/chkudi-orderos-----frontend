"use client";

import { Toaster } from "sonner";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AccountLockChecker from "./AccountLockChecker";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentUrl =
      pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

    // Offline page save નહીં કરવી
    if (pathname !== "/offline") {
      sessionStorage.setItem("lastVisitedPage", currentUrl);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // 🔥 Check initial status
    if (!navigator.onLine) {
      router.push("/offline");
    }

    const handleOffline = () => {
      router.push("/offline");
    };

    const handleOnline = () => {
      const lastPage = sessionStorage.getItem("lastVisitedPage");

      if (lastPage) {
        window.location.href = lastPage;
      } else {
        window.location.href = "/";
      }
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
