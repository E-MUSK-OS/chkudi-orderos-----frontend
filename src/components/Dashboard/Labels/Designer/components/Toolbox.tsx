import React from 'react';
import { Type, Barcode, QrCode, Image as ImageIcon, Minus, Square } from 'lucide-react';
import { LabelElement, ElementType, TextElement, BarcodeElement, QrCodeElement, ImageElement, ShapeElement } from '../../types/label.types';

interface ToolboxProps {
  elements: LabelElement[];
  onAddElement: (element: LabelElement) => void;
}

export function Toolbox({ elements, onAddElement }: ToolboxProps) {
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
          fontSize: 12,
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
          imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNlMGUwZTAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IiM2NjY2NjYiPkltYWdlPC90ZXh0Pjwvc3ZnPg==',
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
  };

  const tools = [
    { type: 'text', icon: Type, label: 'Text' },
    { type: 'barcode', icon: Barcode, label: 'Barcode' },
    { type: 'qrcode', icon: QrCode, label: 'QR Code' },
    { type: 'image', icon: ImageIcon, label: 'Image' },
    { type: 'line', icon: Minus, label: 'Line' },
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
  ] as const;

  return (
    <div className="w-16 bg-[#111827] border-r border-stone-800 flex flex-col items-center py-4 gap-4 shrink-0">
      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => handleAdd(tool.type)}
          className="flex flex-col items-center justify-center w-12 h-12 rounded-sm text-gray-400 hover:bg-[#1F2937] hover:text-[#E8C16D] transition-colors"
          title={`Add ${tool.label}`}
        >
          <tool.icon size={20} />
          <span className="text-[10px] mt-1 font-medium">{tool.label}</span>
        </button>
      ))}
    </div>
  );
}

