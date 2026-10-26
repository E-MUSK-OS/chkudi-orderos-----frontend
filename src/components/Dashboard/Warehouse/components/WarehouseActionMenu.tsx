"use client";

import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  isActive: boolean;
  onEdit: () => void;
  onStatusChange: () => void;
  onDelete: () => void;
}

export default function WarehouseActionMenu({
  isActive,
  onEdit,
  onStatusChange,
  onDelete,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-slate-200
          bg-white
          text-slate-600
          shadow-sm
          transition-all
          duration-200
          hover:border-slate-300
          hover:bg-slate-50
          hover:text-slate-900
          hover:shadow-md
          dark:border-white/[0.08]
          dark:bg-[#0F1626]
          dark:text-slate-300
          dark:hover:bg-white/[0.06]
          dark:hover:text-white
          dark:hover:border-white/20
        "
      >
        <MoreHorizontal size={18} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="
          w-56
          rounded-xl
          border
          border-slate-200
          bg-white
          p-1.5
          shadow-xl
          dark:border-white/[0.08]
          dark:bg-[#0F1626]
        "
      >
        <DropdownMenuItem
          onClick={onEdit}
          className="
            h-10
            rounded-lg
            gap-3
            cursor-pointer
            transition-colors
            hover:bg-slate-100
            dark:text-slate-200
            dark:hover:bg-white/10
            dark:hover:text-white
          "
        >
          <Pencil size={16} />
          <span>Edit Warehouse</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onStatusChange}
          className="
            h-10
            rounded-lg
            gap-3
            cursor-pointer
            transition-colors
            hover:bg-blue-50
            dark:text-slate-200
            dark:hover:bg-white/10
            dark:hover:text-white
          "
        >
          {isActive ? (
            <>
              <PowerOff
                size={16}
                className="text-orange-500"
              />
              <span>Deactivate</span>
            </>
          ) : (
            <>
              <Power
                size={16}
                className="text-green-600"
              />
              <span>Activate</span>
            </>
          )}
        </DropdownMenuItem>

        <div className="my-1 border-t border-slate-100 dark:border-white/[0.06]" />

        <DropdownMenuItem
          onClick={onDelete}
          className="
            h-10
            rounded-lg
            gap-3
            cursor-pointer
            text-red-600
            transition-colors
            hover:bg-red-50
            focus:bg-red-50
            focus:text-red-600
            dark:text-red-400
            dark:hover:bg-red-500/15
            dark:focus:bg-red-500/15
          "
        >
          <Trash2 size={16} />
          <span>Delete Warehouse</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}