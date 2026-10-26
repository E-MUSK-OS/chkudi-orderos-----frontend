"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { VMSItem } from "../types";
import { Download, Eye, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

import Button from "@/components/ui/Button";

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
    meta: {
      headerClassName: "w-48 min-w-[170px] text-center",
      cellClassName: "w-48 min-w-[170px] text-center",
    },
    cell: ({ row }) => (
      <span className="font-mono font-semibold text-slate-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
        {row.original.trackingId}
      </span>
    ),
  },

  {
    accessorKey: "createdAt",
    header: "Date",
    meta: {
      headerClassName: "w-36 min-w-[125px] text-center",
      cellClassName: "w-36 min-w-[125px] text-center whitespace-nowrap",
    },
    cell: ({ row }) => (
      <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
        {format(new Date(row.original.createdAt), "dd MMM yyyy")}
      </span>
    ),
  },

  {
    id: "time",
    header: "Time",
    meta: {
      headerClassName: "w-36 min-w-[125px] text-center",
      cellClassName: "w-36 min-w-[125px] text-center whitespace-nowrap",
    },
    cell: ({ row }) => (
      <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {format(new Date(row.original.createdAt), "hh:mm:ss aa")}
      </span>
    ),
  },

  {
    id: "operator",
    header: "Operator",
    meta: {
      headerClassName: "w-40 min-w-[135px] text-center",
      cellClassName: "w-40 min-w-[135px] text-center whitespace-nowrap",
    },
    cell: ({ row }) => (
      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
        {row.original.operator?.operatorName ?? "-"}
      </span>
    ),
  },

  {
    id: "account",
    header: "Account",
    meta: {
      headerClassName: "w-40 min-w-[135px] text-center",
      cellClassName: "w-40 min-w-[135px] text-center whitespace-nowrap",
    },
    cell: ({ row }) => (
      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
        {row.original.account?.accountName ?? "-"}
      </span>
    ),
  },

  {
    accessorKey: "thumbnailUrl",
    header: "Thumbnail",
    meta: {
      headerClassName: "w-32 min-w-[115px] text-center",
      cellClassName: "w-32 min-w-[115px] text-center",
    },
    cell: ({ row }) => {
      if (!row.original.thumbnailUrl) {
        return (
          <div className="flex justify-center">
            <div className="flex h-[58px] w-[90px] items-center justify-center rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-white/[0.03] text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              No Thumbnail
            </div>
          </div>
        );
      }

      return (
        <div className="flex justify-center">
          <img
            src={getFullUrl(row.original.thumbnailUrl)}
            alt="thumbnail"
            width={90}
            height={58}
            className="h-[58px] w-[90px] rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] object-cover shadow-2xs"
          />
        </div>
      );
    },
  },

  {
    id: "preview",
    header: "Preview",
    enableSorting: false,
    meta: {
      headerClassName: "w-32 min-w-[115px] text-center",
      cellClassName: "w-32 min-w-[115px] text-center",
    },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Button
          size="sm"
          variant="secondary"
          fullWidth={false}
          rounded="rounded-xl"
          leftIcon={<Eye size={15} />}
          onClick={() => onPreview(row.original)}
          className="h-9 px-3.5 text-xs font-semibold bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#ddb75d] dark:bg-[#F5C451] dark:text-[#080B11] dark:hover:bg-[#e0b040] shadow-2xs whitespace-nowrap cursor-pointer"
        >
          Preview
        </Button>
      </div>
    ),
  },

  {
    id: "actions",
    header: "Actions",
    meta: {
      headerClassName: "w-56 min-w-[215px] text-center",
      cellClassName: "w-56 min-w-[215px] text-center",
    },
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
        <Button
          size="sm"
          variant="secondary"
          fullWidth={false}
          rounded="rounded-xl"
          leftIcon={<Download size={15} />}
          onClick={() => onDownload(row.original)}
          className="h-9 px-3.5 text-xs font-semibold border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#251F14] shadow-2xs whitespace-nowrap cursor-pointer"
        >
          Download
        </Button>

        <Button
          size="sm"
          variant="secondary"
          fullWidth={false}
          rounded="rounded-xl"
          leftIcon={<Trash2 size={15} />}
          onClick={() => onDelete(row.original)}
          className="h-9 px-3.5 text-xs font-semibold border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 shadow-2xs whitespace-nowrap cursor-pointer"
        >
          Delete
        </Button>
      </div>
    ),
  },
];
