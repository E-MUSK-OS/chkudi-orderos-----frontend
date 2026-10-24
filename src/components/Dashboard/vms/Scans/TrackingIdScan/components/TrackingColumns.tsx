"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

// import { TrackingScanItem } from "../types";
import { VMSItem } from "../../VMS/Admin/types";
import ScanStatusBadge from "./ScanStatusBadge";

export const trackingColumns: ColumnDef<VMSItem>[] = [
  {
    accessorKey: "trackingId",
    header: "Tracking ID",
    cell: ({ row }) => (
      <span className="font-mono font-bold text-[#0A0E1A] tracking-wider text-xs sm:text-sm">
        {row.original.trackingId}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="font-semibold text-slate-800 text-xs sm:text-sm">
        {format(new Date(row.original.createdAt), "dd MMM yyyy")}
      </span>
    ),
  },
  {
    id: "time",
    header: "Time",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold text-slate-500">
        {format(new Date(row.original.createdAt), "hh:mm:ss aa")}
      </span>
    ),
  },
  {
    id: "operator",
    header: "Operator",
    cell: ({ row }) => (
      <span className="font-semibold text-slate-800 text-xs sm:text-sm">
        {row.original.operator?.operatorName ?? "-"}
      </span>
    ),
  },
  {
    id: "account",
    header: "Account",
    cell: ({ row }) => (
      <span className="font-semibold text-slate-800 text-xs sm:text-sm">
        {row.original.account?.accountName ?? "-"}
      </span>
    ),
  },
  {
    accessorKey: "packingScanStatus",
    header: "Scan Status",
    cell: ({ row }) => (
      <ScanStatusBadge status={row.original.packingScanStatus} />
    ),
  },
];
