// "use client";

// import { Toaster } from "sonner";
// import ReactQueryProvider from "@/providers/ReactQueryProvider";
// import { useEffect } from "react";
// import { useRouter, usePathname, useSearchParams } from "next/navigation";
// import AccountLockChecker from "./AccountLockChecker";

// export default function ClientLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const router = useRouter();

//   const pathname = usePathname();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     const currentUrl =
//       pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
//     if (pathname !== "/offline") {
//       sessionStorage.setItem("lastVisitedPage", currentUrl);
//     }
//   }, [pathname, searchParams]);

//   useEffect(() => {
//     // 🔥 Check initial status
//     if (!navigator.onLine) {
//       router.push("/offline");
//     }

//     const handleOffline = () => {
//       router.push("/offline");
//     };

//     const handleOnline = () => {
//       const lastPage = sessionStorage.getItem("lastVisitedPage");

//       if (lastPage) {
//         window.location.href = lastPage;
//       } else {
//         window.location.href = "/";
//       }
//     };

//     window.addEventListener("offline", handleOffline);
//     window.addEventListener("online", handleOnline);

//     return () => {
//       window.removeEventListener("offline", handleOffline);
//       window.removeEventListener("online", handleOnline);
//     };
//   }, [router]);

//   return (
//     <>
//       <ReactQueryProvider>
//         <AccountLockChecker />

//         {children}

//         <Toaster position="top-right" richColors closeButton duration={3000} />
//       </ReactQueryProvider>
//     </>
//   );
// }

"use client";

import { Toaster } from "sonner";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AccountLockChecker from "./AccountLockChecker";
import GlobalConnectionOverlay from "./GlobalConnectionOverlay";
import DropdownRealtimeSync from "./DropdownRealtimeSync";
import StepUpAuthModal from "./Auth/StepUpAuthModal";
import { pruneExpiredIndexedDB } from "@/utils/indexedDbPruner";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Silently run 7-day auto-cleanup across entire app (even if not on dashboard)
    pruneExpiredIndexedDB().catch((err) => {
      console.debug("IndexedDB 7-day auto-prune notice:", err);
    });

    if (pathname !== "/offline") {
      const currentUrl = window.location.pathname + window.location.search;

      sessionStorage.setItem("lastVisitedPage", currentUrl);
    }
  }, [pathname]);

  return (
    <ThemeProvider>
      <ReactQueryProvider>
        <GlobalConnectionOverlay />
        <DropdownRealtimeSync />
        <StepUpAuthModal />
        <AccountLockChecker />

        {children}

        <Toaster position="top-right" richColors closeButton duration={3000} />
      </ReactQueryProvider>
    </ThemeProvider>
  );
}
