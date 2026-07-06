"use client";

import {
  UserRound,
  BadgeInfo,
  Clock3,
  Sunrise,
  ScanLine,
} from "lucide-react";

const SessionInfo = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Session Information
        </h2>
      </div>

      {/* Content */}
      <div className="space-y-5 p-5">
        {/* Session ID */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <BadgeInfo className="h-4 w-4" />
            Session ID
          </div>

          <span className="font-semibold text-gray-800">
            SES-202607050001
          </span>
        </div>

        {/* Operator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <UserRound className="h-4 w-4" />
            Operator
          </div>

          <span className="font-semibold text-gray-800">
            Kapil Sanghani
          </span>
        </div>

        {/* Shift */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Sunrise className="h-4 w-4" />
            Shift
          </div>

          <span className="font-semibold text-gray-800">
            Morning Shift
          </span>
        </div>

        {/* Login Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock3 className="h-4 w-4" />
            Login Time
          </div>

          <span className="font-semibold">09:00 AM</span>
        </div>

        {/* Today's Scans */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <ScanLine className="h-4 w-4" />
            Today&#39;s Scans
          </div>

          <span className="font-semibold text-blue-600">124</span>
        </div>
      </div>
    </div>
  );
};

export default SessionInfo;