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
    accessorKey: "thumbnailUrl",

    header: "Thumbnail",

    // cell: ({ row }) => {
    //   if (!row.original.thumbnailUrl) {
    //     return <div className="h-[70px] w-[100px] bg-slate-800" />;
    //   }

    //   return (
    //     <Image
    //       src={row.original.thumbnailUrl}
    //       alt="thumbnail"
    //       width={90}
    //       height={60}
    //       className="object-cover border border-slate-700"
    //     />
    //   );
    // },

    cell: ({ row }) => {
      console.log("VMS ITEM:", row.original);
      console.log("THUMBNAIL:", row.original.thumbnailUrl);

      if (!row.original.thumbnailUrl) {
        return (
          <div className="h-[70px] w-[100px] bg-red-500 text-white">
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
          className="h-[60px] w-[90px] border border-slate-700 object-cover"
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
        >
          Download
        </Button>

        <Button
          size="sm"
          variant="secondary"
          fullWidth={false}
          leftIcon={<Trash2 size={16} />}
          onClick={() => onDelete(row.original)}
        >
          Delete
        </Button>
      </div>
    ),
  },
];
