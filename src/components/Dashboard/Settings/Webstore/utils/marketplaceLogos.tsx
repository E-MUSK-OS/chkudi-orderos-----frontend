import React, { useState, useEffect } from "react";
import Image from "next/image";

export function MarketplaceLogo({
  name,
  logoUrl,
  className = "w-16 h-16",
}: {
  name?: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const [customError, setCustomError] = useState(false);

  useEffect(() => {
    setCustomError(false);
  }, [logoUrl]);

  // If a custom logoUrl is provided and valid, display it
  if (logoUrl && !customError) {
    return (
      <div
        className={`${className} relative rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700/60 flex items-center justify-center p-1.5 shadow-sm overflow-hidden`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={name || "Store logo"}
          className="w-full h-full object-contain rounded-full"
          onError={() => setCustomError(true)}
        />
      </div>
    );
  }

  const channel = (name || "").toLowerCase().trim();

  // Amazon
  if (channel.includes("amazon") || channel.includes("amz")) {
    if (!imageError) {
      return (
        <div className={`${className} relative rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700/60 flex items-center justify-center p-2 shadow-sm overflow-hidden`}>
          <Image
            src="/image/marketplaces/amazon.png"
            alt="Amazon"
            width={64}
            height={64}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }
    return (
      <div className={`${className} rounded-full bg-slate-900 border-2 border-slate-700/60 flex flex-col items-center justify-center text-white shadow-sm overflow-hidden`}>
        <span className="font-extrabold text-lg leading-none tracking-tight text-white font-sans">
          a
        </span>
        <div className="w-5 h-1 bg-[#FF9900] rounded-full mt-0.5" />
      </div>
    );
  }

  // Flipkart
  if (channel.includes("flipkart")) {
    if (!imageError) {
      return (
        <div className={`${className} relative rounded-full bg-white dark:bg-slate-900 border-2 border-blue-400/50 flex items-center justify-center p-2 shadow-sm overflow-hidden`}>
          <Image
            src="/image/marketplaces/flipkart.png"
            alt="Flipkart"
            width={64}
            height={64}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }
    return (
      <div className={`${className} rounded-full bg-[#2874F0] border-2 border-blue-400 flex flex-col items-center justify-center text-white shadow-sm p-1`}>
        <span className="font-black text-base italic leading-none text-[#FFE500]">
          f
        </span>
        <span className="text-[7.5px] font-bold tracking-tight mt-0.5">
          Flipkart
        </span>
      </div>
    );
  }

  // Myntra
  if (channel.includes("myntra")) {
    if (!imageError) {
      return (
        <div className={`${className} relative rounded-full bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-500/30 flex items-center justify-center p-2 shadow-sm overflow-hidden`}>
          <Image
            src="/image/marketplaces/myntra.png"
            alt="Myntra"
            width={64}
            height={64}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }
    return (
      <div className={`${className} rounded-full bg-white dark:bg-slate-800 border-2 border-rose-300 dark:border-rose-500/30 flex flex-col items-center justify-center shadow-sm p-1`}>
        <span className="font-black text-base leading-none bg-gradient-to-r from-orange-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
          M
        </span>
        <span className="text-[8px] font-bold text-slate-800 dark:text-slate-200 tracking-tight mt-0.5">
          Myntra
        </span>
      </div>
    );
  }

  // AJIO
  if (channel.includes("ajio")) {
    return (
      <div className={`${className} rounded-full bg-white dark:bg-slate-800 border-2 border-[#1E293B]/20 dark:border-white/[0.15] flex flex-col items-center justify-center shadow-sm overflow-hidden p-1`}>
        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-serif">
          A
        </div>
        <span className="text-[8px] font-bold tracking-tight text-slate-800 dark:text-slate-200 uppercase mt-0.5">
          AJIO
        </span>
      </div>
    );
  }

  // CloudTail / CB / Cocoblu
  if (channel.includes("cloudtail") || channel.includes("cb") || channel.includes("cocoblu")) {
    return (
      <div className={`${className} rounded-full bg-white dark:bg-slate-800 border-2 border-[#38BDF8]/40 dark:border-[#38BDF8]/30 flex flex-col items-center justify-center shadow-sm p-1`}>
        <div className="flex items-center text-lg font-black tracking-tighter leading-none">
          <span className="text-[#0284C7] dark:text-[#38BDF8]">c</span>
          <span className="text-[#EC4899]">b</span>
        </div>
        <span className="text-[7.5px] font-bold text-slate-700 dark:text-slate-300 tracking-tight leading-tight mt-0.5">
          CloudTail
        </span>
      </div>
    );
  }

  // Meesho
  if (channel.includes("meesho")) {
    return (
      <div className={`${className} rounded-full bg-white dark:bg-slate-800 border-2 border-[#800080]/30 flex flex-col items-center justify-center shadow-sm p-1`}>
        <div className="w-7 h-7 rounded-full bg-[#34073D] text-[#E7A6DB] flex items-center justify-center font-black text-xs">
          m
        </div>
        <span className="text-[7.5px] font-bold text-slate-800 dark:text-slate-200 tracking-tight mt-0.5">
          Meesho
        </span>
      </div>
    );
  }

  // JioMart
  if (channel.includes("jio")) {
    return (
      <div className={`${className} rounded-full bg-[#008ECC] border-2 border-sky-400 flex flex-col items-center justify-center text-white shadow-sm p-1`}>
        <span className="font-black text-xs tracking-tight">Jio</span>
        <span className="text-[7px] font-semibold tracking-tight uppercase">Mart</span>
      </div>
    );
  }

  // Nykaa
  if (channel.includes("nykaa")) {
    return (
      <div className={`${className} rounded-full bg-[#FC2779] border-2 border-pink-400 flex flex-col items-center justify-center text-white shadow-sm p-1`}>
        <span className="font-extrabold text-[10px] tracking-tight italic">NYKAA</span>
      </div>
    );
  }

  // Tata Cliq
  if (channel.includes("tata") || channel.includes("cliq")) {
    return (
      <div className={`${className} rounded-full bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center text-white shadow-sm p-1`}>
        <span className="font-bold text-[8px] text-[#E8C16D]">CLiQ</span>
      </div>
    );
  }

  // Default / Other Channel
  const initial = (name || "W").charAt(0).toUpperCase();
  return (
    <div className={`${className} rounded-full bg-[#FFF9EC] text-[#B88728] border-2 border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] dark:border-[#E8C16D]/30 flex flex-col items-center justify-center shadow-sm p-1`}>
      <span className="font-bold text-base leading-none">
        {initial}
      </span>
      <span className="text-[7.5px] font-bold uppercase tracking-tight truncate max-w-[48px] text-center mt-0.5">
        {name?.slice(0, 8) || "Store"}
      </span>
    </div>
  );
}

