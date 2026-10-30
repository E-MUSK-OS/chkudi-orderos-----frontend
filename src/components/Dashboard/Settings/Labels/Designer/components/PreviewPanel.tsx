import React, { useState } from 'react';
import { Search, Loader2, AlertTriangle, Printer } from 'lucide-react';
import { labelService } from '../../services/label.service';
import { ProductLookupResult } from '../../types/label.types';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

interface Props {
  onSelectData: (data: Record<string, string> | null) => void;
  onTestPrint?: () => void;
  className?: string;
  onCloseMobile?: () => void;
}

const WORST_CASE_DATA: ProductLookupResult = {
  title: "Super Long Product Title That Goes On And On And On And Will Definitely Break The Layout If Not Handled Properly With Text Wrapping And Auto Shrink Enabled",
  sku: "SKU-999999999999999999",
  masterSku: "MSKU-XXXXXXXXXXXXXX",
  brand: "Ultra Long Brand Name Co.",
  size: "XXL / 44 / Wide",
  color: "Midnight Blue/Charcoal Grey",
  mrp: 999999.99,
  asin: "B00000000000000",
  manufacturingMonth: "December 2029",
};

export function PreviewPanel({ onSelectData, onTestPrint, className, onCloseMobile }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductLookupResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductLookupResult | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await labelService.lookupProduct(query);
      setResults(res);
      if (res.length === 0) {
        toast.info("No products found");
      }
    } catch (error) {
      toast.error("Failed to search products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (product: ProductLookupResult) => {
    setSelectedProduct(product);
    onSelectData({
      title: product.title || "",
      sku: product.sku || "",
      masterSku: product.masterSku || "",
      brand: product.brand || "",
      size: product.size || "",
      color: product.color || "",
      mrp: product.mrp ? String(product.mrp) : "",
      asin: product.asin || "",
      manufacturingMonth: product.manufacturingMonth || "",
      fullSku: product.masterSku || "",
    });
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setResults([]);
    setQuery("");
    onSelectData(null);
  };

  return (
    <div className={cn("w-full lg:w-80 bg-[#111827] dark:bg-[#0F1626] border-l border-stone-800 dark:border-white/[0.08] flex flex-col h-full overflow-hidden text-white", className)}>
      <div className="p-4 border-b border-stone-800 dark:border-white/[0.08]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-[#E8C16D]">Live Preview Data</h3>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden px-2.5 py-1 rounded-lg bg-[#E8C16D] text-[#0A0E1A] text-xs font-bold hover:bg-[#d4af5a] transition"
            >
              Done
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mb-4">
          Test your template against real products or worst-case long text to ensure text wrapping and barcodes don't break.
        </p>
        <button
          onClick={() => handleSelect(WORST_CASE_DATA)}
          className={`w-full py-2 mb-4 text-xs rounded-sm dark:rounded-xl border transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold ${
            selectedProduct?.sku === WORST_CASE_DATA.sku
              ? 'border-amber-500 bg-amber-500/20 text-amber-400'
              : 'border-stone-700 dark:border-white/[0.1] bg-[#1F2937] dark:bg-[#080B11] text-stone-300 hover:border-amber-500 hover:text-amber-500'
          }`}
        >
          <AlertTriangle size={14} />
          Load Worst-Case Data
        </button>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-[#1F2937] dark:bg-[#080B11] border border-stone-700 dark:border-white/[0.1] rounded-sm dark:rounded-xl px-3 py-1.5 text-sm text-white placeholder-stone-400 focus:outline-none focus:border-[#E8C16D]"
            placeholder="Search SKU or Name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-[#E8C16D] text-[#0A0E1A] px-3 py-1.5 rounded-sm dark:rounded-xl disabled:opacity-50 hover:bg-[#d4ae5c] cursor-pointer"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {results.map((product, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-sm dark:rounded-xl border cursor-pointer text-sm transition-colors ${
              selectedProduct?.sku === product.sku
                ? 'border-[#E8C16D] bg-[#E8C16D]/10 text-white'
                : 'border-stone-800 dark:border-white/[0.08] bg-[#1F2937]/50 dark:bg-[#080B11] text-stone-300 hover:border-stone-600'
            }`}
            onClick={() => handleSelect(product)}
          >
            <div className="font-semibold text-white line-clamp-1" title={product.title}>
              {product.title || 'Unknown Title'}
            </div>
            <div className="text-xs text-stone-400 mt-1">SKU: {product.sku}</div>
            <div className="text-xs text-stone-400 flex justify-between items-center mt-1">
              <span>{product.color} {product.size}</span>
              <div className="flex items-center gap-2">
                {product.mrp && <span className="text-[#E8C16D] font-bold">₹{product.mrp}</span>}
                {selectedProduct?.sku === product.sku && onTestPrint && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestPrint();
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold bg-[#E8C16D] text-[#0A0E1A] px-2 py-0.5 rounded-sm dark:rounded-lg hover:bg-[#d4ae5c] transition-colors cursor-pointer"
                  >
                    <Printer size={12} />
                    Print
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-stone-800 dark:border-white/[0.08] bg-[#1F2937]/30 dark:bg-[#080B11] space-y-2.5">
        {onTestPrint && (
          <button
            onClick={onTestPrint}
            className="w-full py-2.5 px-4 text-sm font-bold bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#d4ae5c] rounded-sm dark:rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] cursor-pointer"
          >
            <Printer size={16} />
            {selectedProduct ? `Test Print (${selectedProduct.sku})` : "Test Print Label"}
          </button>
        )}
        <button
          onClick={clearSelection}
          className="w-full py-1.5 text-xs text-stone-400 border border-stone-700 dark:border-white/[0.1] rounded-sm dark:rounded-xl hover:bg-[#1F2937] dark:hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
        >
          Clear Data
        </button>
      </div>
    </div>
  );
}
