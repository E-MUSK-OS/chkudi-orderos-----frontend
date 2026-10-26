import React from 'react';
import { Type, Barcode, QrCode, Image as ImageIcon, Minus, Square, ArrowUpDown } from 'lucide-react';
import { LabelElement, ElementType, TextElement, BarcodeElement, QrCodeElement, ImageElement, ShapeElement } from '../../types/label.types';
import { cn } from '@/lib/utils';

interface ToolboxProps {
  elements: LabelElement[];
  selectedIds: string[];
  onAddElement: (element: LabelElement) => void;
  onDistributeVertically: () => void;
  className?: string;
  isMobileGrid?: boolean;
  onAfterAdd?: () => void;
}

export function Toolbox({
  elements,
  selectedIds,
  onAddElement,
  onDistributeVertically,
  className,
  isMobileGrid = false,
  onAfterAdd,
}: ToolboxProps) {
  const handleAdd = (type: ElementType) => {
    const highestZ = elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) : -1;
    const offset = (elements.length % 10) * 2; // Stagger by 2mm

    const base = {
      id: crypto.randomUUID(),
      type,
      x: 5 + offset,
      y: 5 + offset,
      width: 40,
      height: 10,
      rotation: 0 as const,
      zIndex: highestZ + 1,
    };

    let newElement: LabelElement;

    switch (type) {
      case 'text':
        newElement = {
          ...base,
          type: 'text',
          content: 'Double click to edit',
          fontSize: 12,
          fontFamily: 'Inter',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: '#000000',
          lineHeight: 1.2,
        } as TextElement;
        break;
      case 'barcode':
        newElement = {
          ...base,
          type: 'barcode',
          width: 50,
          height: 15,
          barcodeFormat: 'CODE128',
          content: '123456789',
          showText: true,
          fontSize: 10,
          fontFamily: 'Inter',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'center',
          color: '#000000',
        } as BarcodeElement;
        break;
      case 'qrcode':
        newElement = {
          ...base,
          type: 'qrcode',
          width: 20,
          height: 20,
          content: 'https://example.com',
          errorCorrectionLevel: 'M',
        } as QrCodeElement;
        break;
      case 'image':
        newElement = {
          ...base,
          type: 'image',
          width: 20,
          height: 20,
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNTAgMTUwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2NjY2Ij5JbWFnZTwvdGV4dD48L3N2Zz4=',
          keepAspectRatio: true,
        } as ImageElement;
        break;
      case 'line':
        newElement = {
          ...base,
          type: 'line',
          height: 1, // Usually a thin line
          borderWidth: 1,
          borderColor: '#000000',
        } as ShapeElement;
        break;
      case 'rectangle':
        newElement = {
          ...base,
          type: 'rectangle',
          width: 20,
          height: 20,
          borderWidth: 1,
          borderColor: '#000000',
          fillColor: 'transparent',
        } as ShapeElement;
        break;
      default:
        return;
    }

    onAddElement(newElement);
    onAfterAdd?.();
  };

  const tools = [
    { type: 'text', icon: Type, label: 'Text', desc: 'Add editable label text' },
    { type: 'barcode', icon: Barcode, label: 'Barcode', desc: 'Add 1D barcode (Code128, etc.)' },
    { type: 'qrcode', icon: QrCode, label: 'QR Code', desc: 'Add 2D matrix QR code' },
    { type: 'image', icon: ImageIcon, label: 'Image', desc: 'Add logo or graphic' },
    { type: 'line', icon: Minus, label: 'Line', desc: 'Add divider line' },
    { type: 'rectangle', icon: Square, label: 'Rectangle', desc: 'Add box or frame' },
  ] as const;

  if (isMobileGrid) {
    return (
      <div className={cn("p-4 space-y-4", className)}>
        <div className="flex items-center justify-between pb-2 border-b border-stone-800 dark:border-white/[0.08]">
          <h3 className="text-sm font-bold text-white">Add Label Elements</h3>
          <span className="text-[11px] text-[#E8C16D]">Tap to insert</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => handleAdd(tool.type)}
              className="flex flex-col items-start p-3.5 rounded-2xl bg-[#161D2E] border border-slate-700/60 hover:border-[#E8C16D] active:scale-[0.98] transition cursor-pointer text-left group"
            >
              <div className="p-2.5 rounded-xl bg-[#0A0E1A] text-[#E8C16D] mb-2 group-hover:bg-[#E8C16D] group-hover:text-[#0A0E1A] transition">
                <tool.icon size={20} />
              </div>
              <span className="text-xs font-bold text-white">{tool.label}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{tool.desc}</span>
            </button>
          ))}
        </div>

        <div className="pt-2">
          <button
            onClick={() => {
              onDistributeVertically();
              onAfterAdd?.();
            }}
            disabled={selectedIds.length < 3}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
              selectedIds.length >= 3
                ? 'border-[#E8C16D]/40 bg-[#161D2E] text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] cursor-pointer'
                : 'border-slate-800 bg-transparent text-slate-600 cursor-not-allowed'
            }`}
          >
            <ArrowUpDown size={16} />
            <span>Distribute Vertically (Select 3+)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-16 bg-[#111827] dark:bg-[#0F1626] border-r border-stone-800 dark:border-white/[0.08] flex flex-col items-center py-4 gap-4 shrink-0 overflow-y-auto",
        className
      )}
    >
      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => handleAdd(tool.type)}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-sm text-gray-400 hover:bg-[#1F2937] dark:hover:bg-white/[0.06] hover:text-[#E8C16D] dark:hover:text-[#F5C451] transition-colors cursor-pointer"
          title={`Add ${tool.label}`}
        >
          <tool.icon size={20} />
          <span className="text-[10px] mt-1 font-medium">{tool.label}</span>
        </button>
      ))}

      <div className="w-10 h-px bg-stone-700 dark:bg-white/[0.08] my-2" />

      <button
        onClick={onDistributeVertically}
        disabled={selectedIds.length < 3}
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-sm transition-colors ${
          selectedIds.length >= 3 
            ? 'text-gray-400 hover:bg-[#1F2937] dark:hover:bg-white/[0.06] hover:text-[#E8C16D] dark:hover:text-[#F5C451] cursor-pointer' 
            : 'text-stone-700 dark:text-slate-600 cursor-not-allowed'
        }`}
        title="Distribute Vertically (Select 3+ elements)"
      >
        <ArrowUpDown size={20} />
        <span className="text-[10px] mt-1 font-medium text-center leading-tight">Space</span>
      </button>
    </div>
  );
}

