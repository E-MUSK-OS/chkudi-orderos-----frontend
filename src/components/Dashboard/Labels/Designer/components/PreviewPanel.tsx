import React, { useState } from 'react';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import { labelService } from '../../services/label.service';
import { ProductLookupResult } from '../../types/label.types';
import { toast } from 'sonner';

interface Props {
  onSelectData: (data: Record<string, string> | null) => void;
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

export function PreviewPanel({ onSelectData }: Props) {
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
    <div className="w-80 bg-[#0A0E1A] border-l border-stone-800 flex flex-col h-full overflow-hidden text-white">
      <div className="p-4 border-b border-stone-800">
        <h3 className="font-semibold text-sm mb-4 text-[#E8C16D]">Live Preview Data</h3>
        <p className="text-[11px] text-gray-400 mb-4">
          Test your template against real products or worst-case long text to ensure text wrapping and barcodes don't break.
        </p>
        <button
          onClick={() => handleSelect(WORST_CASE_DATA)}
          className={`w-full py-2 mb-4 text-xs rounded border transition-colors flex items-center justify-center gap-2 ${
            selectedProduct?.sku === WORST_CASE_DATA.sku
              ? 'border-amber-500 bg-amber-500/20 text-amber-500'
              : 'border-stone-700 bg-[#111827] text-stone-300 hover:border-amber-500 hover:text-amber-500'
          }`}
        >
          <AlertTriangle size={14} />
          Load Worst-Case Data
        </button>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-[#111827] border border-stone-700 rounded px-3 py-1.5 text-sm text-white placeholder-stone-400 focus:outline-none focus:border-[#E8C16D]"
            placeholder="Search SKU or Name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-[#E8C16D] text-[#0A0E1A] px-3 py-1.5 rounded disabled:opacity-50 hover:bg-[#d4ae5c]"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {results.map((product, idx) => (
          <div
            key={idx}
            className={`p-3 rounded border cursor-pointer text-sm transition-colors ${
              selectedProduct?.sku === product.sku
                ? 'border-[#E8C16D] bg-[#E8C16D]/10 text-white'
                : 'border-stone-800 bg-[#111827] text-stone-300 hover:border-stone-600'
            }`}
            onClick={() => handleSelect(product)}
          >
            <div className="font-medium text-white line-clamp-1" title={product.title}>
              {product.title || 'Unknown Title'}
            </div>
            <div className="text-xs text-stone-500 mt-1">SKU: {product.sku}</div>
            <div className="text-xs text-stone-500 flex justify-between mt-1">
              <span>{product.color} {product.size}</span>
              {product.mrp && <span>₹{product.mrp}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-stone-800 bg-[#111827]">
        <button
          onClick={clearSelection}
          className="w-full py-2 text-sm text-stone-300 border border-stone-700 rounded hover:bg-stone-800 transition-colors"
        >
          Clear Data
        </button>
      </div>
    </div>
  );
}
