// FILE: src/components/Dashboard/Labels/components/LabelSelectionModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Search, Tag } from "lucide-react";
import { toast } from "sonner";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

import { labelService } from "@/components/Dashboard/Labels/services/label.service";
import {
  LabelTemplate,
  ProductLookupResult,
} from "@/components/Dashboard/Labels/types/label.types";
import { renderLabelToCanvas } from "@/lib/labelRenderer";
import { getMarketplaces } from "@/services/marketplaceAccount/marketplaceAccount.service";
import { Marketplace } from "@/services/marketplaceAccount/marketplaceAccount.types";

/**
 * Sample data used only to render a representative preview of each label
 * template inside the picker. Mirrors DUMMY_PRODUCT in TemplateGallery.tsx
 * so previews here look identical to the "Design Label" gallery.
 */
const SAMPLE_PRODUCT: ProductLookupResult = {
  title: "Sample Product Name",
  sku: "SAMPLE-SKU-123",
  mrp: 199.99,
  asin: "B00EXAMPLE",
  size: "M",
  manufacturingMonth: new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  }),
};

/* -------------------------------------------------------------------------- */
/* Lazy-rendered canvas preview — same technique as TemplateThumbnail in      */
/* TemplateGallery.tsx (IntersectionObserver + renderLabelToCanvas)          */
/* -------------------------------------------------------------------------- */
function LabelPreview({ template }: { template: LabelTemplate }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    if (template.thumbnailUrl) {
      setUrl(template.thumbnailUrl);
      return;
    }

    let mounted = true;
    renderLabelToCanvas(template, SAMPLE_PRODUCT, 1)
      .then((canvas) => {
        if (mounted) setUrl(canvas.toDataURL("image/png"));
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, [template, isVisible]);

  if (error) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full flex-col items-center justify-center bg-brand-navy p-4 text-center text-gray-400"
      >
        <span className="text-sm font-medium">Preview unavailable</span>
      </div>
    );
  }

  if (!url) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center bg-brand-navy text-gray-400"
      >
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center bg-brand-navy p-2"
    >
      <img
        src={url}
        alt={template.name}
        className="max-h-full max-w-full border border-stone-800 bg-[#111827] object-contain shadow-sm"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Single selectable card — visual language copied from the "Design Label"  */
/* gallery card, plus selection affordances (YouTube-style hover + tick)     */
/* -------------------------------------------------------------------------- */
function LabelCard({
  template,
  marketplaceName,
  selected,
  onSelect,
  onConfirm,
}: {
  template: LabelTemplate;
  marketplaceName: string | null;
  selected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onConfirm}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-[#111827] text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C16D] focus-visible:ring-offset-2",
        selected
          ? "border-[#E8C16D] shadow-lg ring-2 ring-[#E8C16D]"
          : "border-stone-800 hover:-translate-y-0.5 hover:border-[#E8C16D]/60 hover:shadow-md"
      )}
    >
      <div className="relative aspect-[4/3] border-b border-stone-800">
        <LabelPreview template={template} />

        {/* YouTube-style hover affordance */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0A0E1A] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {selected ? "Selected" : "Click to select"}
          </span>
        </div>

        {/* Selection checkmark badge */}
        {selected && (
          <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#E8C16D] shadow-md">
            <Check className="h-4 w-4 text-[#0A0E1A]" strokeWidth={3} />
          </div>
        )}
      </div>

      <div className="flex h-24 flex-col p-4">
        <h3 className="truncate font-semibold text-white" title={template.name}>
          {template.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          {marketplaceName && (
            <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
              {marketplaceName}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {template.settings.widthMm}x{template.settings.heightMm}mm
          </span>
        </div>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Main modal                                                                 */
/* -------------------------------------------------------------------------- */
interface LabelSelectionModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the chosen template once the user confirms selection. */
  onConfirm: (template: LabelTemplate) => void;
  /** Optional: only show templates assigned to this marketplace. */
  marketplaceId?: string;
}

export default function LabelSelectionModal({
  open,
  onClose,
  onConfirm,
  marketplaceId,
}: LabelSelectionModalProps) {
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setSelectedId(null);
    setSearch("");
    setIsLoading(true);

    Promise.all([
      labelService.getTemplates(marketplaceId),
      getMarketplaces()
        .then((res) => res.data)
        .catch(() => []),
    ])
      .then(([tpls, mkts]) => {
        setTemplates(tpls);
        setMarketplaces(mkts);
      })
      .catch(() => {
        toast.error("Failed to load label templates");
        setTemplates([]);
      })
      .finally(() => setIsLoading(false));
  }, [open, marketplaceId]);

  const getMarketplaceName = (id?: string | null) => {
    if (!id) return null;
    return marketplaces.find((m) => m.id === id)?.marketplaceName ?? null;
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = (template?: LabelTemplate) => {
    const chosen = template ?? templates.find((t) => t.id === selectedId);
    if (!chosen) return;
    onConfirm(chosen);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select a Label Template"
      description="Choose the label design you want to print for the selected orders."
      size="4xl"
      footer={
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            {selectedId ? "1 template selected" : "Select a template to continue"}
          </span>
          <div className="flex gap-3">
            <Button variant="outline" fullWidth={false} size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              fullWidth={false}
              size="sm"
              disabled={!selectedId}
              onClick={() => handleConfirm()}
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      }
    >
      {/* Search bar — same pattern as Toolbar.tsx's order search */}
      <div className="relative mb-6 w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search label templates..."
          className="pl-10"
          floatingLabel={false}
        />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-400">
          <Tag className="h-10 w-10" />
          <p className="text-sm font-medium">No label templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <LabelCard
              key={template.id}
              template={template}
              marketplaceName={getMarketplaceName(template.marketplaceId)}
              selected={selectedId === template.id}
              onSelect={() => setSelectedId(template.id ?? null)}
              onConfirm={() => handleConfirm(template)}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
