"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import StatsCards from "./StatsCards";
import AddTagLoopModal from "./AddTagLoopModal";
import { TagLoop } from "./types";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import { Plus, Search, Boxes, ArrowRight } from "lucide-react";
import { useTagLoops } from "./hooks/useTagLoops";

export default function ManageTagLoop() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useTagLoops();

  const tagLoops = data?.data ?? [];

  const [search, setSearch] = useState("");

  const filteredLoops = useMemo(() => {
    return [...tagLoops]
      .filter((item) =>
        `${item.startTag} ${item.endTag}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
      .reverse();
  }, [search, tagLoops]);

  return (
    <DashboardLayout title="Manage Tag Loop">
      <div className="space-y-8">
        <StatsCards />
        <div className="border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">
                Tag Loop Management
              </h2>

              <p className="mt-2 text-lg text-slate-500">
                Create and manage RFID / Barcode TAG ranges.
              </p>
            </div>

            <div>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tag Loop
              </Button>
            </div>
          </div>
          <div className="my-6 border-t border-slate-200" />
          {filteredLoops.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-2xl text-slate-900">Current TAG Ranges</p>

                <span className="rounded bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  Total Ranges : {filteredLoops.length}
                </span>
              </div>

              <div className="space-y-6">
                {filteredLoops.map((loop) => (
                  <div
                    key={loop.id}
                    className="border border-slate-200 bg-white"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 bg-[#0A0E1A] px-6 py-4">
                      <div>
                        <p className="text-xl text-[#E8C16D]">
                          Active Tag Range
                        </p>
                      </div>
                    </div>

                    {/* Range */}
                    <div className="grid gap-8 px-6 py-8 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
                      <div>
                        <p className="mb-2 text-lg uppercase tracking-widest text-[#0A0E1A]">
                          Start Tag
                        </p>

                        <h2 className="text-3xl font-bold tracking-wide text-[#E8C16D]">
                          {loop.nextAvailableTag ?? "Completed"}
                        </h2>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="h-[2px] w-50 bg-[#0A0E1A]" />

                        <ArrowRight className="h-7 w-7 text-[#0A0E1A]" />

                        <div className="h-[2px] w-50 bg-[#0A0E1A]" />
                      </div>

                      <div className="text-right">
                        <p className="mb-2 text-lg uppercase tracking-widest text-[#0A0E1A]">
                          End Tag
                        </p>

                        <h2 className="text-3xl font-bold tracking-wide text-[#E8C16D]">
                          {loop.endTag}
                        </h2>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid border-t border-slate-200 md:grid-cols-3">
                      <div className="border-r border-slate-200 px-6 py-5">
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                          Total Tag
                        </p>

                        <h3 className="mt-2 text-3xl font-bold">
                          {loop.total}
                        </h3>
                      </div>

                      <div className="border-r border-slate-200 px-6 py-5">
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                          Available
                        </p>

                        <h3 className="mt-2 text-3xl font-bold text-green-600">
                          {loop.available}
                        </h3>
                      </div>

                      <div className="px-6 py-5">
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                          Used
                        </p>

                        <h3 className="mt-2 text-3xl font-bold text-orange-600">
                          {loop.used}
                        </h3>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="border-t border-slate-200 px-6 py-5">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Availability</span>

                        <span className="font-semibold">
                          {Math.round((loop.available / loop.total) * 100)}%
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden bg-slate-200">
                        <div
                          className="h-full bg-green-600 transition-all"
                          style={{
                            width: `${(loop.available / loop.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* <TagLoopList tagLoops={filteredLoops} /> */}
        <AddTagLoopModal open={open} onClose={() => setOpen(false)} />
      </div>
    </DashboardLayout>
  );
}
