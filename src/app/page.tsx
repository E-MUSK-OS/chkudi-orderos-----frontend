"use client";

import React, { useState, useEffect } from "react";
import LandingHeader from "@/components/Landing/LandingHeader";
import LandingHero from "@/components/Landing/LandingHero";
import LandingMarquee from "@/components/Landing/LandingMarquee";
import LandingFeatures from "@/components/Landing/LandingFeatures";
import LandingAnalytics from "@/components/Landing/LandingAnalytics";
import LandingCTA from "@/components/Landing/LandingCTA";
import LandingFooter from "@/components/Landing/LandingFooter";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#080B11] text-slate-800 dark:text-slate-200 transition-colors duration-200 selection:bg-[#E8C170] selection:text-[#080B11] relative overflow-x-clip flex flex-col justify-between">
      {/* Background Grid Accent */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* 1. STICKY TOP HEADER */}
      <LandingHeader />

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1">
        {/* 1. HERO SECTION WITH PRODUCT DISPATCH TERMINAL */}
        <LandingHero />

        {/* 2. ONE TERMINAL FOR EVERY CHANNEL - MARQUEE TICKER */}
        <LandingMarquee />

        {/* 3. EVERYTHING YOUR WAREHOUSE NEEDS, IN ONE PLACE - 6 FEATURES */}
        <LandingFeatures />

        {/* 4. REAL-TIME ANALYTICS, DISPATCH PIPELINE & KEY STATS */}
        <LandingAnalytics />

        {/* 5. READY TO ELEVATE CALL TO ACTION BANNER */}
        <LandingCTA isLoggedIn={isLoggedIn} />
      </main>

      {/* 3. FOOTER */}
      <LandingFooter isLoggedIn={isLoggedIn} />
    </div>
  );
}
