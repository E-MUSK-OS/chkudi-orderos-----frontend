"use client";

import React, { useState, useEffect } from "react";
import LandingHeader from "@/components/Landing/LandingHeader";
import LandingHero from "@/components/Landing/LandingHero";
import LandingFeatures from "@/components/Landing/LandingFeatures";
import LandingMarketplaces from "@/components/Landing/LandingMarketplaces";
import LandingAbout from "@/components/Landing/LandingAbout";
import LandingContact from "@/components/Landing/LandingContact";
import LandingPrivacy from "@/components/Landing/LandingPrivacy";
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
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#080B11] text-slate-800 dark:text-slate-200 transition-colors duration-200 selection:bg-[#E8C170] selection:text-[#080B11] relative overflow-x-hidden">
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

      {/* 2. HERO SECTION */}
      <LandingHero />

      {/* 3. CORE FEATURES SECTION */}
      <LandingFeatures />

      {/* 4. DEDICATED MARKETPLACES SECTION */}
      <LandingMarketplaces />

      {/* 5. ABOUT US SECTION */}
      <LandingAbout />

      {/* 6. CONTACT US SECTION */}
      <LandingContact />

      {/* 7. PRIVACY POLICY SECTION */}
      <LandingPrivacy />

      {/* 8. BOTTOM CALL TO ACTION BANNER */}
      <LandingCTA isLoggedIn={isLoggedIn} />

      {/* 9. FOOTER */}
      <LandingFooter isLoggedIn={isLoggedIn} />
    </div>
  );
}
