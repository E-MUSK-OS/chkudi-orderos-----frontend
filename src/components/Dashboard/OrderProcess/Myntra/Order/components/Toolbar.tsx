"use client";

import { ArrowRight, Printer, Search } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Props {
  search: string;
  onSearch: (value: string) => void;

  status: "OPEN" | "PRIORITY" | "PICKING" | "TRANSIT";
  onStatusChange: (status: "OPEN" | "PRIORITY" | "PICKING" | "TRANSIT") => void;

  counts: {
    OPEN: number;
    PRIORITY: number;
    PICKING: number;
    TRANSIT: number;
  };
  selectedRows: number[];
  onMoveToPicking: () => void;
  onGeneratePicklist: () => void;
}

const Toolbar = ({
  search,
  onSearch,
  status,
  onStatusChange,
  counts,
  selectedRows,
  onMoveToPicking,
  onGeneratePicklist,
}: Props) => {
  const buttons = [
    {
      key: "OPEN",
      label: "Open Orders",
      count: counts.OPEN,
    },
    {
      key: "PRIORITY",
      label: "Priority Orders",
      count: counts.PRIORITY,
    },
    {
      key: "PICKING",
      label: "In Picking",
      count: counts.PICKING,
    },
    {
      key: "TRANSIT",
      label: "In Transit",
      count: counts.TRANSIT,
    },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-6 gap-3">
        {buttons.map((button) => (
          <Button
            key={button.key}
            onClick={() => onStatusChange(button.key)}
            className={`h-14 border transition-all duration-200 ${
              status === button.key
                ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] hover:text-white hover:bg-[#0A0E1A]"
                : "bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
            }`}
          >
            {button.label} ({button.count})
          </Button>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search Order ID..."
            className="pl-10"
          />
        </div>

        <div className="flex gap-3">
          {(status === "OPEN" || status === "PRIORITY") && (
            <Button
              disabled={selectedRows.length === 0}
              onClick={onMoveToPicking}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Move To In Picking ({selectedRows.length})
            </Button>
          )}

          {status === "PICKING" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Button
                  variant="secondary"
                  disabled={selectedRows.length === 0}
                  onClick={onGeneratePicklist}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Generate Picklist ({selectedRows.length})
                </Button>
              </div>

              <div>
                <Button
                  disabled={selectedRows.length === 0}
                  onClick={() => {
                    // TODO: Process Action
                  }}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Process ({selectedRows.length})
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
