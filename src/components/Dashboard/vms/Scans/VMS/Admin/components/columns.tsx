"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Button from "@/components/ui/Button";
import type { VMSItem } from "../types";
// import Image from "next/image";
import { Download, Eye, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { API_BASE_URL } from "@/lib/config";

const getFullUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

interface Props {
  onPreview: (item: VMSItem) => void;
  onDelete: (item: VMSItem) => void;
  onDownload: (item: VMSItem) => void;
}

export const getColumns = ({
  onPreview,
  onDelete,
  onDownload,
}: Props): ColumnDef<VMSItem>[] => [
  {
    accessorKey: "trackingId",

    header: "Tracking ID",

    cell: ({ row }) => (
      <span className="font-mono font-bold text-[#0A0E1A] text-sm sm:text-base">
        {row.original.trackingId}
      </span>
    ),
  },

  {
    accessorKey: "createdAt",

    header: "Date",

    cell: ({ row }) => (
      <span className="text-sm sm:text-base font-semibold text-slate-700 whitespace-nowrap">
        {format(new Date(row.original.createdAt), "dd MMM yyyy")}
      </span>
    ),
  },

  {
    id: "time",

    header: "Time",

    cell: ({ row }) => (
      <span className="text-sm sm:text-base font-semibold text-slate-600 whitespace-nowrap">
        {format(new Date(row.original.createdAt), "hh:mm:ss aa")}
      </span>
    ),
  },

  {
    id: "operator",

    header: "Operator",

    cell: ({ row }) => (
      <span className="text-sm sm:text-base font-bold text-slate-800">
        {row.original.operator?.operatorName ?? "-"}
      </span>
    ),
  },

  {
    id: "account",

    header: "Account",

    cell: ({ row }) => (
      <span className="text-sm sm:text-base font-semibold text-slate-700">
        {row.original.account?.accountName ?? "-"}
      </span>
    ),
  },

  {
    accessorKey: "thumbnailUrl",

    header: "Thumbnail",

    cell: ({ row }) => {
      if (!row.original.thumbnailUrl) {
        return (
          <div className="flex h-[60px] w-[90px] items-center justify-center rounded border border-[#E7E0D2] bg-slate-100 text-xs font-medium text-slate-400">
            No Thumbnail
          </div>
        );
      }

      return (
        <img
          src={getFullUrl(row.original.thumbnailUrl)}
          alt="thumbnail"
          width={90}
          height={60}
          className="h-[60px] w-[90px] rounded border border-[#E7E0D2] object-cover shadow-xs"
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
        className="bg-[#E8C16D] text-[#0A0E1A] font-semibold hover:bg-[#ddb75d] shadow-sm rounded-lg"
      >
        Preview
      </Button>
    ),
  },

  {
    id: "actions",

    header: "Actions",

    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          fullWidth={false}
          leftIcon={<Download size={16} />}
          onClick={() => onDownload(row.original)}
          className="bg-[#E8C16D] text-[#0A0E1A] font-semibold hover:bg-[#ddb75d] shadow-sm rounded-lg"
        >
          Download
        </Button>

        <Button
          size="sm"
          variant="secondary"
          fullWidth={false}
          leftIcon={<Trash2 size={16} />}
          onClick={() => onDelete(row.original)}
          className="bg-[#E8C16D] text-[#0A0E1A] font-semibold hover:bg-[#ddb75d] shadow-sm rounded-lg"
        >
          Delete
        </Button>
      </div>
    ),
  },
];
