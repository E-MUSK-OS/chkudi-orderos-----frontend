import React, { useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, Copy, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, UploadCloud, Lock, Unlock } from 'lucide-react';
import { 
  CanvasSettings, 
  LabelElement, 
  TextElement, 
  BarcodeElement, 
  QrCodeElement, 
  ImageElement, 
  ShapeElement 
} from '../../types/label.types';
import ReactSelect, { SelectOption } from '@/components/ui/ReactSelect';
import { uploadImageToCloudinary } from '../utils/uploadImage';
import { toast } from 'sonner';

interface PropertiesPanelProps {
  settings: CanvasSettings;
  updateSettings: (settings: Partial<CanvasSettings>) => void;
  backgroundImageUrl: string | null;
  setBackgroundImageUrl: (url: string | null) => void;
  selectedElement?: LabelElement;
  updateElement: (id: string, updates: Partial<LabelElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
}

const PRESET_SIZES: SelectOption[] = [
  { label: '100x50mm (Shipping Label)', value: '100x50' },
  { label: '50x30mm (Barcode Tag)', value: '50x30' },
  { label: '50x25mm (Jewelry/Small)', value: '50x25' },
  { label: '60x40mm (Standard Product)', value: '60x40' },
  { label: 'Custom', value: 'custom' },
];

const VARIABLE_SOURCES: SelectOption[] = [
  { label: 'Custom Value', value: 'custom' },
  { label: 'Product Title ({{title}})', value: '{{title}}' },
  { label: 'Product SKU ({{sku}})', value: '{{sku}}' },
  { label: 'Product MRP ({{mrp}})', value: '{{mrp}}' },
  { label: 'Product ASIN ({{asin}})', value: '{{asin}}' },
  { label: 'Product Size ({{size}})', value: '{{size}}' },
  { label: 'Product Color ({{color}})', value: '{{color}}' },
  { label: 'Manufacturing Month ({{manufacturingMonth}})', value: '{{manufacturingMonth}}' },
  { label: 'Current Date ({{printDate}})', value: '{{printDate}}' },
];

const BARCODE_FORMATS: SelectOption[] = [
  { label: 'CODE128', value: 'CODE128' },
  { label: 'EAN13', value: 'EAN13' },
  { label: 'UPC', value: 'UPC' },
  { label: 'CODE39', value: 'CODE39' },
];

const FONTS: SelectOption[] = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Serif', value: 'serif' },
];

const DPI_OPTIONS: SelectOption[] = [
  { label: '203 DPI (Standard Thermal)', value: '203' },
  { label: '300 DPI (High Res Thermal)', value: '300' },
];

const ORIENTATIONS: SelectOption[] = [
  { label: 'Landscape', value: 'landscape' },
  { label: 'Portrait', value: 'portrait' },
];

export function PropertiesPanel({
  settings,
  updateSettings,
  backgroundImageUrl,
  setBackgroundImageUrl,
  selectedElement,
  updateElement,
  deleteElement,
  duplicateElement,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
}: PropertiesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleSettingsChange = (key: keyof CanvasSettings, value: any) => {
    updateSettings({ [key]: value });
  };

  const handlePresetChange = (val: string) => {
    if (val === 'custom') return;
    const [w, h] = val.split('x').map(Number);
    updateSettings({ widthMm: w, heightMm: h });
  };

  const handleUpdate = (key: string, value: any) => {
    if (selectedElement) {
      updateElement(selectedElement.id, { [key]: value });
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File, onComplete: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    
    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      onComplete(url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedElement) {
    // Render Canvas Settings
    return (
      <div className="w-72 bg-[#111827] border-l border-stone-800 overflow-y-auto shrink-0 font-sans text-sm">
        <div className="p-4 border-b border-stone-800 font-semibold text-white">
          Canvas Properties
        </div>
        <div className="p-4 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">Preset Size</label>
            <ReactSelect menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              options={PRESET_SIZES}
              value={PRESET_SIZES.find(o => o.value === `${settings.widthMm}x${settings.heightMm}`) || PRESET_SIZES[4]}
              onChange={(opt) => opt && handlePresetChange(opt.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Width (mm)</label>
              <input
                type="number"
                min={1}
                className="w-full h-11 px-3 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D] transition-colors"
                value={settings.widthMm}
                onChange={(e) => handleSettingsChange('widthMm', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300">Height (mm)</label>
              <input
                type="number"
                min={1}
                className="w-full h-11 px-3 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D] transition-colors"
                value={settings.heightMm}
                onChange={(e) => handleSettingsChange('heightMm', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">Orientation</label>
            <ReactSelect menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              options={ORIENTATIONS}
              value={ORIENTATIONS.find(o => o.value === settings.orientation) || ORIENTATIONS[0]}
              onChange={(opt) => opt && handleSettingsChange('orientation', opt.value)}
            />
            <p className="text-[11px] text-gray-500">
              Portrait rotates the final printed/exported label 90°. This canvas always shows your unrotated layout.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">DPI Target</label>
            <ReactSelect menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              options={DPI_OPTIONS}
              value={DPI_OPTIONS.find(o => o.value === String(settings.dpi)) || DPI_OPTIONS[0]}
              onChange={(opt) => opt && handleSettingsChange('dpi', Number(opt.value))}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300">Grid Snap Step (mm)</label>
            <input
              type="number"
              min={0.1}
              step={0.1}
              className="w-full h-11 px-3 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D] transition-colors"
              value={settings.gridSizeMm}
              onChange={(e) => handleSettingsChange('gridSizeMm', Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="snapToGrid"
              checked={settings.snapToGrid}
              onChange={(e) => handleSettingsChange('snapToGrid', e.target.checked)}
              className="rounded-sm border-stone-700 text-[#E8C16D] focus:ring-[#E8C16D]"
            />
            <label htmlFor="snapToGrid" className="text-sm text-gray-300 cursor-pointer">
              Snap to Grid
            </label>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-medium text-gray-300">Print Color Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleSettingsChange('colorMode', 'color')}
                className={`flex-1 h-9 rounded-sm border text-xs font-medium transition-colors ${
                  (settings.colorMode ?? 'color') === 'color'
                    ? 'bg-[#E8C16D] text-[#0A0E1A] border-[#E8C16D]'
                    : 'bg-transparent text-gray-300 border-stone-700 hover:border-stone-500'
                }`}
              >
                🎨 Color
              </button>
              <button
                onClick={() => handleSettingsChange('colorMode', 'monochrome')}
                className={`flex-1 h-9 rounded-sm border text-xs font-medium transition-colors ${
                  (settings.colorMode ?? 'color') === 'monochrome'
                    ? 'bg-[#E8C16D] text-[#0A0E1A] border-[#E8C16D]'
                    : 'bg-transparent text-gray-300 border-stone-700 hover:border-stone-500'
                }`}
              >
                ⬛ Monochrome
              </button>
            </div>
            <p className="text-[10px] text-gray-500">
              {(settings.colorMode ?? 'color') === 'color'
                ? 'Label renders in full color — use with inkjet/laser printers.'
                : 'Label converts to B&W — use with thermal printers (TSC, Zebra).'}
            </p>
          </div>

          <div className="space-y-3 pt-4 border-stone-800">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Background Image</h4>
            <div className="space-y-2">
              {backgroundImageUrl && (
                <div className="flex gap-2">
                  <div className="relative h-20 flex-1 border border-stone-800 rounded-sm overflow-hidden bg-[#0A0E1A]">
                    <img src={backgroundImageUrl} alt="Background" className="w-full h-full object-contain" />
                  </div>
                  <button
                    onClick={() => setBackgroundImageUrl(null)}
                    className="h-20 px-3 bg-red-900/20 text-red-400 rounded-sm hover:bg-red-900/40 transition-colors border border-red-900/50 flex flex-col justify-center items-center gap-1"
                  >
                    <Trash2 size={14} />
                    <span className="text-[10px]">Clear</span>
                  </button>
                </div>
              )}
              
              <div 
                className={`w-full border-2 border-dashed rounded-sm p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${isDragging ? 'border-[#E8C16D] bg-[#1F2937]' : 'border-stone-700 hover:bg-stone-800'}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleImageUpload(e.dataTransfer.files[0], setBackgroundImageUrl);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0], setBackgroundImageUrl);
                    }
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
                <UploadCloud size={24} className={`pointer-events-none ${isDragging ? "text-[#E8C16D]" : "text-gray-400"}`} />
                <span className="text-xs text-gray-500 pointer-events-none">
                  {isUploading ? "Uploading..." : isDragging ? "Drop here!" : (backgroundImageUrl ? "Replace Background" : "Upload Background")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Common properties
  return (
    <div className="w-72 bg-[#111827] border-l border-stone-800 overflow-y-auto shrink-0 font-sans text-sm">
      <div className="p-4 border-b border-stone-800 flex items-center justify-between">
        <span className="font-semibold text-white capitalize">{selectedElement.type} Properties</span>
        <div className="flex items-center gap-1">
          <button onClick={() => bringToFront(selectedElement.id)} className="p-1 text-gray-400 hover:text-[#E8C16D] hover:bg-[#1F2937] rounded-sm" title="Bring to Front">
            <ArrowUpToLine size={16} />
          </button>
          <button onClick={() => bringForward(selectedElement.id)} className="p-1 text-gray-400 hover:text-[#E8C16D] hover:bg-[#1F2937] rounded-sm" title="Bring Forward">
            <ArrowUp size={16} />
          </button>
          <button onClick={() => sendBackward(selectedElement.id)} className="p-1 text-gray-400 hover:text-[#E8C16D] hover:bg-[#1F2937] rounded-sm" title="Send Backward">
            <ArrowDown size={16} />
          </button>
          <button onClick={() => sendToBack(selectedElement.id)} className="p-1 text-gray-400 hover:text-[#E8C16D] hover:bg-[#1F2937] rounded-sm" title="Send to Back">
            <ArrowDownToLine size={16} />
          </button>
          <button onClick={() => duplicateElement(selectedElement.id)} className="p-1 text-gray-400 hover:text-[#E8C16D] hover:bg-[#1F2937] rounded-sm" title="Duplicate">
            <Copy size={16} />
          </button>
          <button 
            onClick={() => handleUpdate('locked', !selectedElement.locked)} 
            className={`p-1 rounded-sm ${selectedElement.locked ? 'text-red-400 bg-red-900/20 hover:bg-red-900/40' : 'text-gray-400 hover:text-[#E8C16D] hover:bg-[#1F2937]'}`} 
            title={selectedElement.locked ? "Unlock Element" : "Lock Element"}
          >
            {selectedElement.locked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
          <button onClick={() => deleteElement(selectedElement.id)} className="p-1 text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded-sm" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Geometry */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Geometry</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">X (mm)</label>
              <input
                type="number"
                className="w-full h-9 px-2 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D]"
                value={selectedElement.x}
                onChange={(e) => handleUpdate('x', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Y (mm)</label>
              <input
                type="number"
                className="w-full h-9 px-2 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D]"
                value={selectedElement.y}
                onChange={(e) => handleUpdate('y', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Width (mm)</label>
              <input
                type="number"
                min={1}
                className="w-full h-9 px-2 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D]"
                value={selectedElement.width}
                onChange={(e) => handleUpdate('width', Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Height (mm)</label>
              <input
                type="number"
                min={1}
                className="w-full h-9 px-2 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D]"
                value={selectedElement.height}
                onChange={(e) => handleUpdate('height', Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Rotation</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={360}
                  step={1}
                  value={Math.round(selectedElement.rotation ?? 0)}
                  onChange={(e) => {
                    let v = Number(e.target.value);
                    if (v < 0) v = 0;
                    if (v > 360) v = 360;
                    handleUpdate('rotation', v);
                  }}
                  className="w-16 h-7 px-2 text-xs bg-transparent text-white border border-stone-700 rounded-sm focus:outline-none focus:border-[#E8C16D] text-right"
                />
                <span className="text-xs text-gray-500">°</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={Math.round(selectedElement.rotation ?? 0)}
              onChange={(e) => handleUpdate('rotation', Number(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full bg-stone-700 accent-[#E8C16D] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>0°</span>
              <button onClick={() => handleUpdate('rotation', 90)} className="hover:text-[#E8C16D] transition-colors">90°</button>
              <button onClick={() => handleUpdate('rotation', 180)} className="hover:text-[#E8C16D] transition-colors">180°</button>
              <button onClick={() => handleUpdate('rotation', 270)} className="hover:text-[#E8C16D] transition-colors">270°</button>
              <span>360°</span>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-stone-800" />

        {/* Type specific properties */}
        {selectedElement.type === 'text' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Typography & Data</h4>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Data Binding</label>
              <ReactSelect menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                height={36}
                options={VARIABLE_SOURCES}
                value={VARIABLE_SOURCES.find(o => o.value === (selectedElement as TextElement).variableSource) || VARIABLE_SOURCES[0]}
                onChange={(opt) => opt && handleUpdate('variableSource', opt.value === 'custom' ? undefined : opt.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Content</label>
              <textarea
                className="w-full p-2 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D] resize-none"
                rows={3}
                value={(selectedElement as TextElement).content}
                onChange={(e) => handleUpdate('content', e.target.value)}
                disabled={!!(selectedElement as TextElement).variableSource}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Font Family</label>
                <ReactSelect menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                  height={36}
                  options={FONTS}
                  value={FONTS.find(o => o.value === (selectedElement as TextElement).fontFamily) || FONTS[0]}
                  onChange={(opt) => opt && handleUpdate('fontFamily', opt.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Font Size (pt)</label>
                <input
                  type="number"
                  min={1}
                  className="w-full h-9 px-2 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D]"
                  value={(selectedElement as TextElement).fontSize}
                  onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-1 mt-3">
              <label className="text-xs text-gray-400">Formatting</label>
              <div className="flex items-center gap-1 mt-1">
                <button onClick={() => handleUpdate('fontWeight', (selectedElement as TextElement).fontWeight === 'bold' ? 'normal' : 'bold')} className={`p-1.5 rounded-sm ${(selectedElement as TextElement).fontWeight === 'bold' ? 'bg-[#E8C16D] text-white' : 'text-gray-500 hover:bg-[#1F2937]'}`}><Bold size={16} /></button>
                <button onClick={() => handleUpdate('fontStyle', (selectedElement as TextElement).fontStyle === 'italic' ? 'normal' : 'italic')} className={`p-1.5 rounded-sm ${(selectedElement as TextElement).fontStyle === 'italic' ? 'bg-[#E8C16D] text-white' : 'text-gray-500 hover:bg-[#1F2937]'}`}><Italic size={16} /></button>
                <button onClick={() => handleUpdate('textDecoration', (selectedElement as TextElement).textDecoration === 'underline' ? 'none' : 'underline')} className={`p-1.5 rounded-sm ${(selectedElement as TextElement).textDecoration === 'underline' ? 'bg-[#E8C16D] text-white' : 'text-gray-500 hover:bg-[#1F2937]'}`}><Underline size={16} /></button>
                <div className="w-px h-5 bg-stone-300 mx-1" />
                <button onClick={() => handleUpdate('textAlign', 'left')} className={`p-1.5 rounded-sm ${(selectedElement as TextElement).textAlign === 'left' ? 'bg-[#E8C16D] text-white' : 'text-gray-500 hover:bg-[#1F2937]'}`}><AlignLeft size={16} /></button>
                <button onClick={() => handleUpdate('textAlign', 'center')} className={`p-1.5 rounded-sm ${(selectedElement as TextElement).textAlign === 'center' ? 'bg-[#E8C16D] text-white' : 'text-gray-500 hover:bg-[#1F2937]'}`}><AlignCenter size={16} /></button>
                <button onClick={() => handleUpdate('textAlign', 'right')} className={`p-1.5 rounded-sm ${(selectedElement as TextElement).textAlign === 'right' ? 'bg-[#E8C16D] text-white' : 'text-gray-500 hover:bg-[#1F2937]'}`}><AlignRight size={16} /></button>
              </div>
            </div>
            <div className="space-y-1 mt-3">
              <label className="text-xs text-gray-400">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-9 h-9 border border-stone-800 p-0 rounded-sm"
                  value={(selectedElement as TextElement).color || '#000000'}
                  onChange={(e) => handleUpdate('color', e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 h-9 px-3 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D]"
                  value={(selectedElement as TextElement).color || '#000000'}
                  onChange={(e) => handleUpdate('color', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {selectedElement.type === 'barcode' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Barcode Settings</h4>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Data Binding</label>
              <ReactSelect menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                height={36}
                options={VARIABLE_SOURCES}
                value={VARIABLE_SOURCES.find(o => o.value === (selectedElement as BarcodeElement).variableSource) || VARIABLE_SOURCES[0]}
                onChange={(opt) => opt && handleUpdate('variableSource', opt.value === 'custom' ? undefined : opt.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Value</label>
              <input
                type="text"
                className="w-full h-9 px-3 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D]"
                value={(selectedElement as BarcodeElement).content}
                onChange={(e) => handleUpdate('content', e.target.value)}
                disabled={!!(selectedElement as BarcodeElement).variableSource}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Format</label>
              <ReactSelect menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                height={36}
                options={BARCODE_FORMATS}
                value={BARCODE_FORMATS.find(o => o.value === (selectedElement as BarcodeElement).barcodeFormat) || BARCODE_FORMATS[0]}
                onChange={(opt) => opt && handleUpdate('barcodeFormat', opt.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showText"
                checked={(selectedElement as BarcodeElement).showText}
                onChange={(e) => handleUpdate('showText', e.target.checked)}
                className="rounded-sm border-stone-700 text-[#E8C16D] focus:ring-[#E8C16D]"
              />
              <label htmlFor="showText" className="text-sm text-gray-300 cursor-pointer">
                Show Text Below
              </label>
            </div>
          </div>
        )}

        {selectedElement.type === 'qrcode' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QR Code Settings</h4>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Data Binding</label>
              <ReactSelect menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                height={36}
                options={VARIABLE_SOURCES}
                value={VARIABLE_SOURCES.find(o => o.value === (selectedElement as QrCodeElement).variableSource) || VARIABLE_SOURCES[0]}
                onChange={(opt) => opt && handleUpdate('variableSource', opt.value === 'custom' ? undefined : opt.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Value</label>
              <textarea
                className="w-full p-2 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D] resize-none"
                rows={3}
                value={(selectedElement as QrCodeElement).content}
                onChange={(e) => handleUpdate('content', e.target.value)}
                disabled={!!(selectedElement as QrCodeElement).variableSource}
              />
            </div>
          </div>
        )}

        {selectedElement.type === 'image' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Image Settings</h4>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Image Source</label>
              
              {/* Drag and Drop Zone */}
              <div 
                className={`w-full border-2 border-dashed rounded-sm p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${isDragging ? 'border-[#E8C16D] bg-[#1F2937]' : 'border-stone-700 hover:bg-stone-800'}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleImageUpload(e.dataTransfer.files[0], (url) => handleUpdate('imageUrl', url));
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0], (url) => handleUpdate('imageUrl', url));
                    }
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
                <UploadCloud size={24} className={`pointer-events-none ${isDragging ? "text-[#E8C16D]" : "text-gray-400"}`} />
                <span className="text-xs text-gray-500 pointer-events-none">
                  {isUploading ? "Uploading..." : isDragging ? "Drop here!" : "Click or Drag & Drop Image"}
                </span>
              </div>

              {/* Show URL preview/fallback */}
              {(selectedElement as ImageElement).imageUrl && (
                <input
                  type="text"
                  placeholder="Or paste URL here..."
                  className="w-full h-9 px-3 bg-transparent text-gray-300 border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D] text-xs truncate"
                  value={(selectedElement as ImageElement).imageUrl}
                  onChange={(e) => handleUpdate('imageUrl', e.target.value)}
                />
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="keepAspectRatio"
                checked={(selectedElement as ImageElement).keepAspectRatio}
                onChange={(e) => handleUpdate('keepAspectRatio', e.target.checked)}
                className="rounded-sm border-stone-700 text-[#E8C16D] focus:ring-[#E8C16D]"
              />
              <label htmlFor="keepAspectRatio" className="text-sm text-gray-300 cursor-pointer">
                Keep Aspect Ratio
              </label>
            </div>
          </div>
        )}

        {(selectedElement.type === 'line' || selectedElement.type === 'rectangle') && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shape Settings</h4>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Stroke Width (mm)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                className="w-full h-9 px-3 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D]"
                value={(selectedElement as ShapeElement).borderWidth}
                onChange={(e) => handleUpdate('borderWidth', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Stroke Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-9 h-9 border border-stone-800 p-0 rounded-sm"
                  value={(selectedElement as ShapeElement).borderColor}
                  onChange={(e) => handleUpdate('borderColor', e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 h-9 px-3 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D]"
                  value={(selectedElement as ShapeElement).borderColor}
                  onChange={(e) => handleUpdate('borderColor', e.target.value)}
                />
              </div>
            </div>
            {selectedElement.type === 'rectangle' && (
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Fill Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-9 h-9 border border-stone-800 p-0 rounded-sm"
                    value={(selectedElement as ShapeElement).fillColor || '#ffffff'}
                    onChange={(e) => handleUpdate('fillColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 h-9 px-3 bg-transparent text-white border border-stone-800 rounded-sm focus:outline-none focus:border-[#E8C16D]"
                    value={(selectedElement as ShapeElement).fillColor || ''}
                    placeholder="transparent"
                    onChange={(e) => handleUpdate('fillColor', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

