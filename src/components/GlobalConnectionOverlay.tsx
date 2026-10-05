"use client";

import React, { useEffect } from "react";
import { useConnectionStore } from "@/store/useConnectionStore";
import { WifiOff, ServerCrash } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

export default function GlobalConnectionOverlay() {
  const { isOffline, isBackendDown, setOffline } = useConnectionStore();

  useEffect(() => {
    // Sync initial state on mount in case the store's initial value was incorrect
    if (typeof navigator !== 'undefined') {
      setOffline(!navigator.onLine);
    }

    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [setOffline]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBackendDown && !isOffline) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/health`, {
            headers: {
              "Bypass-Tunnel-Reminder": "true",
              "ngrok-skip-browser-warning": "true"
            }
          });
          if (res.ok) {
            useConnectionStore.getState().setBackendDown(false);
          }
        } catch (error) {
          // Still down
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBackendDown, isOffline]);

  if (!isOffline && !isBackendDown) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F7F5F0]/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
      <div className="bg-[#0A0E1A] shadow-2xl p-8 max-w-md w-full mx-4 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
        <div className="text-6xl mb-4">
          {isOffline ? "📡" : "🖥️"}
        </div>
        
        <h1 className="text-3xl font-bold text-[#E8C16D] mb-3">
          {isOffline ? "No Internet Connection" : "Server Unreachable"}
        </h1>
        
        <p className="text-white mb-6 leading-relaxed text-sm">
          {isOffline 
            ? "Something went wrong with your network connection. Please check your internet and wait a moment. Your progress is paused and safe." 
            : "We are having trouble connecting to the backend or NAS server. Please wait for a moment while it reconnects. Your current progress is safe."}
        </p>

        <div className="flex justify-center space-x-2 mb-2">
          <div className="w-3 h-3 bg-[#E8C16D]/50 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-[#E8C16D]/80 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-[#E8C16D] rounded-full animate-bounce delay-200"></div>
        </div>
        
        <p className="text-xs text-[#E8C16D]/70 mt-4">
          Waiting for connection to restore...
        </p>
      </div>
    </div>
  );
}
