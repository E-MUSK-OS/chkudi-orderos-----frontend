"use client";

import React, { useState, useEffect } from "react";
import LandingHeader from "@/components/Landing/LandingHeader";
import LandingFeatures from "@/components/Landing/LandingFeatures";
import LandingCTA from "@/components/Landing/LandingCTA";
import LandingFooter from "@/components/Landing/LandingFooter";

export default function FeaturesPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#080B11] text-slate-800 dark:text-slate-200 transition-colors duration-200 selection:bg-[#E8C170] selection:text-[#080B11] relative overflow-x-clip flex flex-col justify-between">
      {/* Ambient Grid Background Accent */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] sm:w-[650px] h-[220px] sm:h-[300px] bg-[#E8C170]/10 dark:bg-[#E8C170]/05 rounded-full blur-[100px] pointer-events-none" />

      {/* Sticky Top Header */}
      <LandingHeader />

      {/* Page Content */}
      <main className="flex-1 pt-16 sm:pt-20">
        <LandingFeatures />
        <LandingCTA isLoggedIn={isLoggedIn} />
      </main>

      {/* Footer */}
      <LandingFooter isLoggedIn={isLoggedIn} />
    </div>
  );
}
