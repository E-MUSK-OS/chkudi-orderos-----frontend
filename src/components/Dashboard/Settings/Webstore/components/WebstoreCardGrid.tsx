"use client";

import React from "react";
import { Store, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { Webstore } from "../types/webstore.types";
import WebstoreCard from "./WebstoreCard";

interface WebstoreCardGridProps {
  stores: Webstore[];
  loading: boolean;
  onModify: (store: Webstore) => void;
  onToggleStatus: (store: Webstore) => void;
  onDelete?: (store: Webstore) => void;
  onAddNew: () => void;
  togglingId?: string | null;
}

export default function WebstoreCardGrid({
  stores,
  loading,
  onModify,
  onToggleStatus,
  onDelete,
  onAddNew,
  togglingId,
}: WebstoreCardGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-2xl border border-slate-200 bg-white/50 p-4 dark:border-white/[0.08] dark:bg-[#0F1626]/50 animate-pulse flex flex-col justify-between"
          >
            <div className="flex justify-end">
              <div className="w-24 h-5 rounded bg-slate-200 dark:bg-white/[0.08]" />
            </div>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-white/[0.08]" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 mx-auto rounded bg-slate-200 dark:bg-white/[0.08]" />
              <div className="h-3 w-1/2 mx-auto rounded bg-slate-200 dark:bg-white/[0.08]" />
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="w-8 h-4 rounded-full bg-slate-200 dark:bg-white/[0.08]" />
              <div className="w-14 h-6 rounded bg-slate-200 dark:bg-white/[0.08]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-white/[0.1] bg-white/50 dark:bg-[#0F1626]/30 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#1A160E] dark:text-[#E8C16D] mb-4">
          <Store className="h-8 w-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          No Webstores Found
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          You haven't registered any marketplace webstores yet or none match your filter criteria.
        </p>
        <Button
          variant="primary"
          fullWidth={false}
          onClick={onAddNew}
          leftIcon={<Plus size={18} />}
          className="mt-5 h-10 px-6 text-xs sm:text-sm font-bold rounded-2xl active:scale-[0.98]"
        >
          Create Webstore
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3.5">
      {stores.map((store) => (
        <WebstoreCard
          key={store.id}
          store={store}
          onModify={onModify}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          togglingStatus={togglingId === store.id}
        />
      ))}
    </div>
  );
}
