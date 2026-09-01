import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { labelService } from '../../services/label.service';
import { ProductLookupResult } from '../../types/label.types';
import { toast } from 'sonner';

interface Props {
  onSelectData: (data: Record<string, string> | null) => void;
}

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
        <h3 className="font-semibold text-sm mb-4 text-[#E8C16D]">Preview Panel</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 bg-[#111827] border border-stone-700 rounded px-3 py-1.5 text-sm text-white placeholder-stone-400"
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

      <div className="flex-1 overflow-y-auto p-4 bg-[#0A0E1A] space-y-2">
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
          Clear Selection
        </button>
      </div>
    </div>
  );
}
