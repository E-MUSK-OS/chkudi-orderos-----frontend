"use client";

import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  MoreVertical,
  PackageCheck,
} from "lucide-react";
import { TagLoop } from "./types";

interface Props {
  tagLoops: TagLoop[];
}

export default function TagLoopList({
  tagLoops,
}: Props) {
  if (!tagLoops.length) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed border-[#E7E0D2] dark:border-white/[0.1] bg-[#FAF8F5] dark:bg-[#080B11]">
        <Boxes className="h-14 w-14 text-slate-300 dark:text-slate-600" />

        <h2 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-300">
          No Tag Loop Found
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Create your first TAG Loop.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {tagLoops.map((item) => (
        <div
          key={item.id}
          className="
          rounded-2xl
          border
          border-[#E7E0D2]
          dark:border-white/[0.08]
          bg-white
          dark:bg-[#0B0F17]
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-lg
        "
        >
          <div className="flex items-start justify-between p-6">
            {/* Left */}
            <div className="space-y-5 flex-1">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  TAG RANGE
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="rounded-lg bg-slate-100 dark:bg-[#080B11] border border-transparent dark:border-white/[0.06] px-4 py-2 font-semibold text-slate-800 dark:text-white">
                    {item.startTag}
                  </div>

                  <ArrowRight className="text-slate-400 dark:text-slate-500" />

                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-transparent dark:border-blue-900/40 px-4 py-2 font-semibold text-blue-700 dark:text-blue-400">
                    {item.endTag}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-transparent dark:border-blue-900/40 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                  <Boxes size={16} />
                  Total {item.total}
                </div>

                <div className="flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-950/40 border border-transparent dark:border-green-900/40 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400">
                  <CheckCircle2 size={16} />
                  Available {item.available}
                </div>

                <div className="flex items-center gap-2 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-transparent dark:border-orange-900/40 px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-400">
                  <PackageCheck size={16} />
                  Used {item.used}
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col items-end gap-5">
              <button className="rounded-lg p-2 transition hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500">
                <MoreVertical size={20} />
              </button>

              <span
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  font-semibold

                  ${
                    item.available === item.total
                      ? "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300"
                      : "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300"
                  }
                `}
              >
                {item.available === item.total
                  ? "Available"
                  : "In Use"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}