"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2, Edit2, Tag, Plus, Loader2, Search, X, LayoutGrid, Printer } from "lucide-react";
import { labelService } from "../services/label.service";
import { LabelTemplate, ProductLookupResult } from "../types/label.types";
import { renderLabelToCanvas } from "@/lib/labelRenderer";
import { toast } from "sonner";
import { getMarketplaces } from "@/services/marketplaceAccount/marketplaceAccount.service";
import { Marketplace } from "@/services/marketplaceAccount/marketplaceAccount.types";
import ActionMenu from "@/components/ui/ActionMenu";
import ConfirmModal from "./components/ConfirmModal";
import { TestPrintModal } from "./components/TestPrintModal";
import ReactSelect from "@/components/ui/ReactSelect";

const DUMMY_PRODUCT: ProductLookupResult = {
  title: "Sample Product Name",
  sku: "SAMPLE-SKU-123",
  mrp: 199.99,
  asin: "B00EXAMPLE",
  size: "M",
  manufacturingMonth: new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
};

function TemplateThumbnail({ template }: { template: LabelTemplate }) {
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
    renderLabelToCanvas(template, DUMMY_PRODUCT, 1).then(canvas => {
      if (mounted) setUrl(canvas.toDataURL("image/png"));
    }).catch(err => {
      console.error(err);
      if (mounted) setError(true);
    });
    return () => { mounted = false; };
  }, [template, isVisible]);

  if (error) {
    return (
      <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#080B11] text-slate-400 p-4 text-center">
        <span className="text-xs font-semibold">Preview unavailable</span>
      </div>
    );
  }

  if (!url) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-[#FAF8F5] dark:bg-[#080B11] text-[#E8C16D]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-[#FAF8F5] dark:bg-[#080B11] p-3 relative">
      <img
        src={url}
        alt={template.name}
        className="max-w-full max-h-full object-contain bg-white shadow-xs rounded-lg border border-[#E7E0D2] dark:border-white/[0.08]"
      />
    </div>
  );
}

export function TemplateGallery() {
  const router = useRouter();
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInFlight, setActionInFlight] = useState(false);

  const [search, setSearch] = useState("");

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [editingMarketplaceId, setEditingMarketplaceId] = useState<string | null>(null);
  const [testPrintTemplate, setTestPrintTemplate] = useState<LabelTemplate | null>(null);
  const isCancelingRename = useRef(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tpls, mkts] = await Promise.all([
        labelService.getTemplates(),
        getMarketplaces().then(res => res.data).catch(() => [])
      ]);
      setTemplates(tpls);
      setMarketplaces(mkts);
    } catch (err) {
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDuplicate = async (template: LabelTemplate) => {
    if (actionInFlight) return;
    setActionInFlight(true);
    try {
      const fullTemplate = await labelService.getTemplateById(template.id!);
      if (!fullTemplate) throw new Error("Template not found");
      const { id, name, ...rest } = fullTemplate;
      const newTemplate = await labelService.createTemplate({
        ...rest,
        name: `Copy of ${name}`
      });
      toast.success("Template duplicated");
      setTemplates(prev => [...prev, newTemplate]);
    } catch (err) {
      toast.error("Failed to duplicate template");
    } finally {
      setActionInFlight(false);
    }
  };

  const triggerDelete = (id: string) => {
    setDeleteModalId(id);
  };

  const confirmDelete = async () => {
    if (!deleteModalId || actionInFlight) return;
    setActionInFlight(true);
    try {
      await labelService.deleteTemplate(deleteModalId);
      toast.success("Template deleted");
      setTemplates(prev => prev.filter(t => t.id !== deleteModalId));
    } catch (err) {
      toast.error("Failed to delete template");
    } finally {
      setDeleteModalId(null);
      setActionInFlight(false);
    }
  };

  const submitRename = async (id: string) => {
    if (!renameValue.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (actionInFlight) return;
    setActionInFlight(true);
    try {
      const template = templates.find(t => t.id === id);
      if (!template) throw new Error("Template not found");
      const updated = await labelService.updateTemplate(id, { ...template, name: renameValue.trim() });
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
      toast.success("Template renamed");
    } catch (err) {
      toast.error("Failed to rename template");
    } finally {
      setRenamingId(null);
      setActionInFlight(false);
    }
  };

  const submitMarketplace = async (id: string, marketplaceId: string) => {
    if (actionInFlight) return;
    setActionInFlight(true);
    try {
      const template = templates.find(t => t.id === id);
      if (!template) throw new Error("Template not found");
      const updated = await labelService.updateTemplate(id, { ...template, marketplaceId: marketplaceId || null });
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
      toast.success("Marketplace updated");
    } catch (err) {
      toast.error("Failed to update marketplace");
    } finally {
      setEditingMarketplaceId(null);
      setActionInFlight(false);
    }
  };

  const getMarketplaceName = (id?: string | null) => {
    if (!id) return null;
    return marketplaces.find(m => m.id === id)?.marketplaceName || "Unknown";
  };

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((tpl) =>
      tpl.name.toLowerCase().includes(q) ||
      `${tpl.settings.widthMm}x${tpl.settings.heightMm}`.includes(q)
    );
  }, [templates, search]);

  return (
    <div className="space-y-6">
      {/* Page Header matching Product Analytics Amazon */}
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
              Label Templates
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Design, customize, and manage custom thermal barcode and product label templates.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/labels/designer?id=new")}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto self-stretch sm:self-start md:self-center min-h-[42px] sm:min-h-[44px] rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2.5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Total Templates Badge matching OrderOS Theme */}
      <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left side: Searchbar matching OrderOS theme */}
        <div className="w-full sm:max-w-md md:w-96 lg:w-[420px] transition-all">
          <div className="group flex h-10 sm:h-11 items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 sm:px-4 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:focus-within:bg-[#080B11]">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search template name, dimensions..."
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer shrink-0"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right side: Reset and Total Templates Badge */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end sm:self-center">
          {/* Reset Filters */}
          {search.trim() !== "" && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 hover:text-red-700 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              title="Reset search"
            >
              <div className="grid h-5 w-5 place-items-center rounded-md bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shrink-0">
                <X className="h-3.5 w-3.5" />
              </div>
              <span>Reset</span>
            </button>
          )}

          {/* Total Templates Badge matching OrderOS Theme */}
          <div className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#080B11] px-3.5 sm:px-4 shadow-xs">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Total Templates:</span>
            <span className="rounded-lg bg-[#0A0E1A] dark:bg-black/60 px-2.5 py-0.5 text-xs sm:text-sm font-bold text-[#E8C16D]">
              {filteredTemplates.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#E8C16D]" />
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Loading templates...</p>
          </div>
        </div>
      ) : filteredTemplates.length === 0 && search.trim() !== "" ? (
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 mb-4">
            <LayoutGrid className="h-8 w-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#0A0E1A] dark:text-white">No Matching Templates</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            No templates match "{search}". Try searching for another name or dimension.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setSearch("")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] shadow-xs cursor-pointer transition active:scale-[0.98]"
            >
              Clear Search
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Create New Card */}
          <div
            onClick={() => router.push("/dashboard/labels/designer?id=new")}
            className="group cursor-pointer rounded-2xl sm:rounded-3xl border-2 border-dashed border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#0F1626] hover:bg-[#FFFDF5] dark:hover:bg-[#121824] hover:border-[#E8C16D] p-6 flex flex-col items-center justify-center aspect-[4/3] transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40 group-hover:bg-[#E8C16D] group-hover:text-[#0A0E1A] flex items-center justify-center mb-3 transition-all duration-200 shadow-xs group-hover:scale-110">
              <Plus className="w-6 h-6 transition-transform duration-200" />
            </div>
            <span className="font-bold text-sm sm:text-base text-[#0A0E1A] dark:text-white group-hover:text-[#B88728] dark:group-hover:text-[#E8C16D] transition-colors">
              New Template
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Create custom barcode label
            </span>
          </div>

          {/* Template Cards */}
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="group cursor-pointer rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-hidden hover:border-[#E8C16D] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col relative"
              onClick={() => router.push(`/dashboard/labels/designer?id=${template.id}`)}
            >
              <div className="aspect-[4/3] border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11] relative flex items-center justify-center p-3">
                <TemplateThumbnail template={template} />
              </div>

              <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 relative bg-white dark:bg-[#0F1626]">
                <div className="pr-8">
                  {renamingId === template.id ? (
                    <input
                      type="text"
                      autoFocus
                      className="w-full text-sm font-bold text-[#0A0E1A] dark:text-white border-b-2 border-[#E8C16D] bg-transparent focus:outline-none mb-1.5"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onBlur={() => {
                        if (!isCancelingRename.current) submitRename(template.id!);
                        isCancelingRename.current = false;
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitRename(template.id!);
                        if (e.key === 'Escape') {
                          isCancelingRename.current = true;
                          setRenamingId(null);
                        }
                      }}
                    />
                  ) : (
                    <h3 className="font-bold text-sm sm:text-base text-[#0A0E1A] dark:text-white group-hover:text-[#B88728] dark:group-hover:text-[#E8C16D] transition-colors truncate" title={template.name}>
                      {template.name}
                    </h3>
                  )}

                  {editingMarketplaceId === template.id ? (
                    <div onClick={e => e.stopPropagation()} className="mt-2">
                      <ReactSelect
                        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                        options={[
                          { label: "No Marketplace", value: "" },
                          ...marketplaces.filter(m => m.isActive).map(m => ({
                            label: m.marketplaceName,
                            value: m.id
                          }))
                        ]}
                        value={
                          template.marketplaceId 
                            ? { label: getMarketplaceName(template.marketplaceId) || "", value: template.marketplaceId }
                            : { label: "No Marketplace", value: "" }
                        }
                        onChange={opt => {
                          if (opt) submitMarketplace(template.id!, String(opt.value));
                        }}
                        onBlur={() => setEditingMarketplaceId(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {template.marketplaceId && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40">
                          {getMarketplaceName(template.marketplaceId)}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                        {template.settings.widthMm} × {template.settings.heightMm} mm
                      </span>
                    </div>
                  )}
                </div>

                {/* Card footer action row */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-[#0A0E1A] dark:group-hover:text-white transition-colors flex items-center gap-1">
                    Edit Template
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {template.layoutJson ? `${template.layoutJson.length} items` : "Custom"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTestPrintTemplate(template);
                      }}
                      className="text-slate-400 dark:text-slate-500 hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-colors p-1 rounded-md hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E]"
                      title="Test Print"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Action Menu */}
                <div 
                  className="absolute top-4 right-3 opacity-80 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionMenu
                    items={[
                      { label: "Rename", icon: Edit2, onClick: () => { setRenamingId(template.id!); setRenameValue(template.name); }, disabled: actionInFlight },
                      { label: "Duplicate", icon: Copy, onClick: () => handleDuplicate(template), disabled: actionInFlight },
                      { label: "Assign Marketplace", icon: Tag, onClick: () => setEditingMarketplaceId(template.id!), disabled: actionInFlight },
                      { label: "Delete", icon: Trash2, variant: "danger", onClick: () => triggerDelete(template.id!), disabled: actionInFlight },
                    ]}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleteModalId !== null}
        onClose={() => setDeleteModalId(null)}
        onConfirm={confirmDelete}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        confirmLabel="Delete"
        danger={true}
      />

      {testPrintTemplate && (
        <TestPrintModal
          open={!!testPrintTemplate}
          onClose={() => setTestPrintTemplate(null)}
          template={testPrintTemplate}
          previewData={{
            title: "Sample Product Name",
            sku: "SAMPLE-SKU-123",
            mrp: "199.99",
            manufacturingMonth: new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
          }}
        />
      )}
    </div>
  );
}
