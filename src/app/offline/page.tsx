"use client";

import { useEffect, useState } from "react";

export default function OfflinePage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // 🔥 Net આવે કે તરત Home પર જાઓ
    const handleOnline = () => {
      window.location.href = "/"; // Home page
    };

    window.addEventListener("online", handleOnline);

    // Check connection every 2 seconds
    const interval = setInterval(() => {
      if (navigator.onLine) {
        window.location.href = "/"; // Home page
      }
    }, 2000);

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F7F5F0]">
      <div className="text-center p-8 max-w-md bg-[#0A0E1A] shadow-2xl">
        <div className="text-6xl mb-4">📡</div>
        
        <h1 className="text-3xl font-bold text-[#E8C16D] mb-3">
          No Internet Connection
        </h1>
        
        <p className="text-white mb-2">
          Please check your network connection
        </p>
        
        <p className="text-md text-white mb-6">
          {navigator.onLine ? (
            "✅ Connected! Redirecting to Home..."
          ) : (
            `⏳ Checking connection in ${countdown}s...`
          )}
        </p>

        <div className="flex justify-center space-x-2 mb-6">
          <div className="w-3 h-3 bg-[#E8C16D]/50 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-[#E8C16D]/80 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-[#E8C16D] rounded-full animate-bounce delay-200"></div>
        </div>

        <div className="space-x-4">
          <button
            onClick={() => {
              if (navigator.onLine) {
                window.location.href = "/";
              } else {
                alert("Still offline! Please check your connection.");
              }
            }}
            className="px-6 py-2.5 bg-[#E8C16D] text-white transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={() => {
              if (window.confirm("Close the application?")) {
                window.close();
              }
            }}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="mt-6 text-sm text-white">
          <p>💡 Check your WiFi or Mobile Data</p>
          <p>🔄 Turn Airplane Mode on/off</p>
          <p>📱 Restart your router</p>
        </div>
      </div>
    </div>
  );
}