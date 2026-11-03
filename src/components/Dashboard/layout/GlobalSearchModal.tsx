"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Star } from "lucide-react";
import {
  getDynamicSearchablePages,
  type SearchPageItem,
} from "@/constants/navigation";
import { getCurrentUser } from "@/utils/pagePermissions";
import { normalizeRoute } from "./Sidebar";

export type { SearchPageItem };
export const getAllSearchablePages = getDynamicSearchablePages;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function formatTimeAgo(
  timestamp: number | string | undefined,
  defaultFallback: string
): string {
  if (!timestamp) return defaultFallback;

  let tsMs: number;
  if (typeof timestamp === "number") {
    tsMs = timestamp;
  } else {
    const parsed = Number(timestamp);
    if (!isNaN(parsed) && parsed > 1000000000) {
      tsMs = parsed;
    } else {
      return defaultFallback;
    }
  }

  const diffMs = Date.now() - tsMs;
  if (diffMs < 0) return "Just now";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return "Just now";
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }

  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 30) {
    return `${diffDays}d ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export default function GlobalSearchModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setTick] = useState(0);

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("orderos_search_favorites");
        return saved ? JSON.parse(saved) : ["user-profile"];
      } catch {
        return ["user-profile"];
      }
    }
    return ["user-profile"];
  });

  // Recent access numeric timestamps persisted in localStorage
  const [recentTimestamps, setRecentTimestamps] = useState<Record<string, number | string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("orderos_search_timestamps");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  // Re-calculate relative time while modal is open every 15s
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Dynamically retrieve all searchable pages (automatically derived from navItems + permissions)
  const allPages = useMemo(() => {
    const user = getCurrentUser();
    return getDynamicSearchablePages(user);
  }, [isOpen]);

  // Filtered pages based on user query — favorites prioritized first, strictly capped at 7 items
  const displayedPages = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Helper to partition: favorites come first, followed by others, preserving relative order
    const prioritizeFavorites = (items: SearchPageItem[]) => {
      const favList: SearchPageItem[] = [];
      const nonFavList: SearchPageItem[] = [];

      for (const item of items) {
        if (favorites.includes(item.id)) {
          favList.push(item);
        } else {
          nonFavList.push(item);
        }
      }

      return [...favList, ...nonFavList];
    };

    if (!q) {
      // Default view: favorites first, then other core pages, capped at 7
      return prioritizeFavorites(allPages).slice(0, 7);
    }

    const matched = allPages.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchPath = p.path.toLowerCase().includes(q);
      const matchKeywords = (p.keywords || []).some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchPath || matchKeywords;
    });

    return prioritizeFavorites(matched).slice(0, 7);
  }, [query, favorites, allPages]);

  // Keep selected index in bounds when list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Autofocus input and reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("orderos_search_favorites", JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  // Navigate to page
  const handleSelectPage = (item: SearchPageItem) => {
    const nowMs = Date.now();
    setRecentTimestamps((prev) => {
      const next = { ...prev, [item.id]: nowMs };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("orderos_search_timestamps", JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });

    onClose();
    router.push(normalizeRoute(item.href));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < displayedPages.length ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : displayedPages.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (displayedPages[selectedIndex]) {
          handleSelectPage(displayedPages[selectedIndex]);
        }
      } else if ((e.key === "f" && e.altKey) || (e.key === "d" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        if (displayedPages[selectedIndex]) {
          toggleFavorite(displayedPages[selectedIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, displayedPages]);

  // Scroll active item into view smoothly
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4">
      {/* Frosted backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Command Palette Modal Card with Light & Dark Theme */}
      <div
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-[#14171F] border border-[#E7E0D2] dark:border-white/10 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 text-[#0A0E1A] dark:text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#14171F]">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-sm sm:text-base text-[#0A0E1A] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none min-w-0"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-[#0A0E1A] hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Section Header */}
        <div className="px-4 pt-3 pb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
          {query.trim() ? "Search results" : "Frequently used"}
        </div>

        {/* Results List (strictly top 7 items) */}
        <div
          ref={listRef}
          className="px-2 py-1 max-h-[380px] sm:max-h-[440px] overflow-y-auto space-y-1 custom-scrollbar"
        >
          {displayedPages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
              No matching pages found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            displayedPages.map((item, index) => {
              const isSelected = index === selectedIndex;
              const isFav = favorites.includes(item.id);
              const displayTime = formatTimeAgo(recentTimestamps[item.id], item.defaultTimeAgo);
              const IconComp = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectPage(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition select-none ${
                    isSelected
                      ? "bg-[#FFF9EC] text-[#0A0E1A] dark:bg-white/[0.08] dark:text-white"
                      : "hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {/* Left: Icon in rounded container */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border transition ${
                        isSelected
                          ? "bg-amber-100/80 border-amber-200/80 text-[#B88728] dark:bg-white/[0.12] dark:border-white/10 dark:text-white"
                          : "bg-slate-100 border-slate-200/60 text-slate-500 group-hover:text-[#0A0E1A] group-hover:bg-slate-200/70 dark:bg-white/[0.05] dark:border-white/[0.06] dark:text-slate-400 dark:group-hover:text-white dark:group-hover:bg-white/[0.08]"
                      }`}
                    >
                      <IconComp size={18} />
                    </div>

                    {/* Middle: Title & Breadcrumb path */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          isSelected
                            ? "text-[#0A0E1A] dark:text-white"
                            : "text-slate-800 dark:text-slate-100 group-hover:text-[#0A0E1A] dark:group-hover:text-white"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.path}
                      </p>
                    </div>
                  </div>

                  {/* Right: Timestamp & Favorite star */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400">
                      {displayTime}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        isFav
                          ? "opacity-100"
                          : isSelected
                          ? "opacity-100 text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400"
                          : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400"
                      }`}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star
                        size={16}
                        className={
                          isFav
                            ? "text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400"
                            : "text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400"
                        }
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Keyboard Shortcuts Footer with Light & Dark Theme */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#0E1117] text-[11px] text-slate-500 dark:text-slate-400 select-none">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-transparent">
                ↑↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-transparent">
                ↵
              </kbd>
              <span>open</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-transparent">
                ☆
              </kbd>
              <span>favorite</span>
            </span>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-transparent">
                esc
              </kbd>
              <span>close</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
