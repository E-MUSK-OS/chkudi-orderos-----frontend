"use client";

import React from "react";
import Link from "next/link";

interface LandingFooterProps {
  isLoggedIn?: boolean;
}

export default function LandingFooter({ isLoggedIn = false }: LandingFooterProps) {
  return (
    <footer className="border-t border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#06080D] py-8 transition-colors">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2">
          <span className="font-extrabold text-[#B88728] dark:text-[#E8C170]">Chakudee OrderOS</span>
          <span>— Enterprise Commerce Terminal.</span>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-5 lg:gap-6">
          <Link href="/features" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/marketplaces" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Marketplaces
          </Link>
          <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Contact Us
          </Link>
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Terms & Conditions
          </Link>
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="font-bold hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {isLoggedIn ? "Dashboard" : "Login"}
          </Link>
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            className="font-bold text-[#B88728] dark:text-[#E8C170] hover:underline"
          >
            {isLoggedIn ? "Access Terminal" : "Register"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
