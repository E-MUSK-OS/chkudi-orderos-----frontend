"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Button from "@/components/ui/Button";
import type { VMSItem } from "../types";
import Image from "next/image";
import { Download, Eye } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface Props {
  onPreview: (item: VMSItem) => void;
}

export const getColumns = ({ onPreview }: Props): ColumnDef<VMSItem>[] => [
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
    accessorKey: "thumbnailUrl",

    header: "Thumbnail",

    cell: ({ row }) => {
      if (!row.original.thumbnailUrl) {
        return <div className="h-[70px] w-[100px] bg-slate-800" />;
      }

      return (
        <Image
          src={row.original.thumbnailUrl}
          alt="thumbnail"
          width={90}
          height={60}
          className="object-cover border border-slate-700"
        />
      );
    },
  },

  {
    id: "preview",

    header: "Preview",

    enableSorting: false,

    cell: ({ row }) => (
      <Button
        size="sm"
        variant="secondary"
        fullWidth={false}
        leftIcon={<Eye size={16} />}
        onClick={() => onPreview(row.original)}
      >
        Preview
      </Button>
    ),
  },
];
