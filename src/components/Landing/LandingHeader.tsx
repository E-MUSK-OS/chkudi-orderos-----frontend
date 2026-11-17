"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Sun, Moon, Lock, ArrowRight, Menu, X } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export default function LandingHeader() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#F7F5F0]/95 dark:bg-[#080B11]/90 border-b border-[#E7E0D2] dark:border-white/[0.08] transition-colors shadow-xs">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4 xl:gap-6">
        
        {/* Brand Logo (Left) */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0">
          <div className="h-8 w-8 sm:h-10 sm:w-10 xl:h-11 xl:w-11 rounded-lg sm:rounded-xl border border-[#C89B3C]/40 bg-[#FFF9EC] dark:bg-[#C89B3C]/10 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs shrink-0">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#B88728] dark:text-[#E8C170]" />
          </div>
          <div className="flex flex-col whitespace-nowrap">
            <span className="text-sm sm:text-lg xl:text-xl font-black tracking-[1px] sm:tracking-[1.5px] xl:tracking-[2px] uppercase text-[#B88728] dark:text-[#E8C170] leading-tight">
              Chakudee <span className="text-slate-900 dark:text-white">OrderOS</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase -mt-0.5 hidden xs:block sm:block">
              Enterprise Commerce
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Always single line, no wrapping) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-8 text-xs xl:text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
          <a href="#features" className="whitespace-nowrap hover:text-[#B88728] dark:hover:text-[#E8C170] transition-colors">
            Features
          </a>
          <a href="#marketplaces" className="whitespace-nowrap hover:text-[#B88728] dark:hover:text-[#E8C170] transition-colors">
            Marketplaces
          </a>
          <a href="#about" className="whitespace-nowrap hover:text-[#B88728] dark:hover:text-[#E8C170] transition-colors">
            About Us
          </a>
          <a href="#contact" className="whitespace-nowrap hover:text-[#B88728] dark:hover:text-[#E8C170] transition-colors">
            Contact
          </a>
          <a href="#privacy" className="whitespace-nowrap hover:text-[#B88728] dark:hover:text-[#E8C170] transition-colors">
            Privacy Policy
          </a>
        </nav>

        {/* Right Side Corner Actions: Theme Switcher, Login & Register */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 whitespace-nowrap">
          
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 sm:p-2.5 rounded-full border border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs shadow-xs cursor-pointer shrink-0"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E8C170]" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
              )}
            </button>
          )}

          {/* Authenticated Dashboard Quick-Link if logged in */}
          {isLoggedIn && (
            <Link
              href="/dashboard"
              className="hidden xl:inline-flex items-center justify-center rounded-full border border-[#C89B3C]/50 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C170] px-3.5 py-2 text-xs font-bold transition-all hover:scale-105 whitespace-nowrap"
            >
              Dashboard
            </Link>
          )}

          {/* LOGIN BUTTON (Visible on sm screens and up) */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 hover:border-[#B88728] dark:hover:border-[#E8C170] bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white px-3 sm:px-4 xl:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5 text-slate-500 dark:text-slate-400" />
            Login
          </Link>

          {/* REGISTER BUTTON */}
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-[#E8C170] hover:bg-[#d8b05c] active:bg-[#c9a14d] text-[#080B11] px-3 sm:px-5 xl:px-6 py-1.5 sm:py-2.5 text-xs sm:text-sm font-extrabold transition-all shadow-md active:scale-95 glow-gold whitespace-nowrap"
          >
            Register
            <ArrowRight className="w-3.5 h-3.5 ml-1 sm:ml-1.5 -mr-0.5 text-[#080B11]" />
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 cursor-pointer"
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#F7F5F0] dark:bg-[#080B11] px-4 py-4 space-y-3 shadow-lg">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1"
          >
            Features
          </a>
          <a
            href="#marketplaces"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1"
          >
            Marketplaces
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1"
          >
            About Us
          </a>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1"
          >
            Contact Us
          </a>
          <a
            href="#privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 py-1"
          >
            Privacy Policy
          </a>
          
          {/* Mobile Auth Buttons inside menu */}
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-bold rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-white"
            >
              Login to Terminal
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-extrabold rounded-xl bg-[#E8C170] text-[#080B11] shadow-xs"
            >
              Register Account Free
            </Link>
          </div>

          {isLoggedIn && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-[#B88728] dark:text-[#E8C170] py-1 pt-2"
            >
              Go to Dashboard →
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
