"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, type LucideIcon } from "lucide-react";

type MenuItem = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
};

interface Props {
  items: MenuItem[];
}

export default function ActionMenu({ items }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    const menuWidth = 208;
    const menuHeight = 140; // અંદાજિત height (3 items)

    const margin = 8;

    let top = rect.bottom + margin;
    let left = rect.right - menuWidth;

    // Auto Flip (Bottom → Top)
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - margin;
    }

    // Right Edge
    if (left + menuWidth > window.innerWidth - margin) {
      left = window.innerWidth - menuWidth - margin;
    }

    // Left Edge
    if (left < margin) {
      left = margin;
    }

    // Top Edge
    if (top < margin) {
      top = margin;
    }

    setPosition({
      top,
      left,
    });
  };

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const outside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const reposition = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", esc);

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", esc);

      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-[#C89B3C] hover:text-[#C89B3C] dark:border-white/[0.1] dark:bg-[#0F1626] dark:text-slate-300 dark:hover:border-[#F5C451]/50 dark:hover:text-[#F5C451] cursor-pointer"
      >
        <MoreVertical size={18} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              top: position.top,
              left: position.left,
            }}
            className="fixed z-[9999] w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.1] dark:bg-[#0F1626] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition cursor-pointer ${
                    item.disabled ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    item.variant === "danger"
                      ? "text-red-600 hover:bg-red-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.06] dark:hover:text-[#F5C451]"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
