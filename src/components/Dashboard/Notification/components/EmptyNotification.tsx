"use client";

import { BellOff } from "lucide-react";

export default function EmptyNotification() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border py-24">

      <BellOff className="mb-4 h-16 w-16 text-gray-400" />

      <h2 className="text-xl font-semibold">
        No Notifications
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        You&#39;re all caught up.
      </p>

    </div>
  );
}