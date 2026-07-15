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
      <span className="font-medium text-white">{row.original.trackingId}</span>
    ),
  },

  {
    accessorKey: "createdAt",

    header: "Date",

    cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy"),
  },

  {
    id: "time",

    header: "Time",

    cell: ({ row }) => format(new Date(row.original.createdAt), "hh:mm:ss aa"),
  },

  {
    id: "operator",

    header: "Operator",

    cell: ({ row }) => (
      <span>{row.original.operator?.operatorName ?? "-"}</span>
    ),
  },

  {
    id: "account",

    header: "Account",

    cell: ({ row }) => <span>{row.original.account?.accountName ?? "-"}</span>,
  },

  {
    accessorKey: "packingScanStatus",

    header: "Scan Status",

    cell: ({ row }) => (
      <ScanStatusBadge status={row.original.packingScanStatus} />
    ),
  },
];
