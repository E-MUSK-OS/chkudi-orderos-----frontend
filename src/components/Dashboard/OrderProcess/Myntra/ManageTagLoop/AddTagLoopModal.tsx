"use client";

import { useMemo, useState } from "react";
import { Boxes, ArrowDown, Hash, Sparkles, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useCreateTagLoop } from "./hooks/useTagLoops";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddTagLoopModal({ open, onClose }: Props) {
  const [startTag, setStartTag] = useState("");
  const [total, setTotal] = useState(500);
  const { mutate, isPending } = useCreateTagLoop();

  const endTag = useMemo(() => {
    if (!startTag) return "";

    const prefix = startTag.match(/^[A-Za-z]+/)?.[0] ?? "";

    const startNumber = Number(startTag.replace(prefix, ""));

    if (Number.isNaN(startNumber)) return "";

    return `${prefix}${startNumber + total - 1}`;
  }, [startTag, total]);

  const handleSave = () => {
    mutate(
      {
        startTag,
        total,
      },
      {
        onSuccess: () => {
          onClose();
          setStartTag("");
          setTotal(500);
        },
        onError: (error: Error) => {
          alert(error.message);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden border-0 p-0">
        {/* Header */}

        <div className="border-b bg-[#0A0E1A] p-8 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <Sparkles size={24} />
              Add Tag Loop
            </DialogTitle>

            <p className="mt-2 text-blue-100">
              Create a new continuous TAG range.
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-8 p-8">
          {/* Inputs */}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Start TAG
              </label>

              <Input
                placeholder="MP220167200"
                value={startTag}
                onChange={(e) => setStartTag(e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Total TAG
              </label>

              <Input
                type="number"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Preview */}

          <div className="border border-slate-200 bg-slate-50 p-6">
            <div className="mb-5 flex items-center gap-2">
              <h3 className="font-semibold text-xl">Generated Preview</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Start */}

              <div className="bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Start
                </p>

                <h4 className="mt-3 break-all text-lg font-bold">
                  {startTag || "--"}
                </h4>
              </div>

              {/* Arrow */}

              <div className="flex items-center justify-center">
                <ArrowDown
                  size={30}
                  className="text-slate-400 md:rotate-[-90deg]"
                />
              </div>

              {/* End */}

              <div className="bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  End
                </p>

                <h4 className="mt-3 break-all text-lg font-bold text-blue-700">
                  {endTag || "--"}
                </h4>
              </div>
            </div>

            {/* Bottom */}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Hash className="text-green-600" size={18} />

                  <span className="text-sm text-slate-500">
                    Total Generated
                  </span>
                </div>

                <h3 className="mt-2 text-3xl font-bold text-green-600">
                  {total}
                </h3>
              </div>

              <div className="bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Boxes className="text-orange-500" size={18} />

                  <span className="text-sm text-slate-500">Status</span>
                </div>

                <h3 className="mt-2 text-xl font-semibold text-orange-600">
                  Ready to Generate
                </h3>
              </div>
            </div>
          </div>

          {/* Buttons */}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button onClick={handleSave}>
              <Plus className="mr-2 h-4 w-4" />
              Save Tag Loop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
