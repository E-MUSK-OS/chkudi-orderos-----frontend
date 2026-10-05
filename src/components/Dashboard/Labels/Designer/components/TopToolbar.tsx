import { ZoomIn, ZoomOut, Undo, Redo, Eye, Save, Trash2, ArrowLeft, Loader2, Printer, RotateCcw } from 'lucide-react';

interface TopToolbarProps {
  zoom: number;
  setZoom: (z: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  previewSampleData: boolean;
  togglePreview: () => void;
  onSave: () => void;
  onClear: () => void;
  onReset?: () => void;
  isSaving?: boolean;
  templateName: string;
  updateTemplateName: (name: string) => void;
  onBack: () => void;
  onTestPrint?: () => void;
}

export function TopToolbar({
  zoom,
  setZoom,
  canUndo,
  canRedo,
  undo,
  redo,
  previewSampleData,
  togglePreview,
  onSave,
  onClear,
  onReset,
  isSaving,
  templateName,
  updateTemplateName,
  onBack,
  onTestPrint,
}: TopToolbarProps) {
  return (
    <div className="flex items-center justify-between h-14 bg-[#0A0E1A] border-b border-[#E7E0D2]/20 px-3 sm:px-4 shrink-0 shadow-xs">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-[#161D2E] text-xs font-bold text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] hover:border-[#E8C16D] transition active:scale-[0.98] mr-1.5 cursor-pointer shadow-xs"
          title="Back to Gallery"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Gallery</span>
        </button>
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1.5 text-slate-300 hover:text-[#E8C16D] hover:bg-[#161D2E] rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={17} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 text-slate-300 hover:text-[#E8C16D] hover:bg-[#161D2E] rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={17} />
        </button>
        <div className="w-px h-6 bg-slate-800 mx-1 sm:mx-2" />
        <button
          onClick={() => setZoom(Math.max(1, Math.round((zoom - 0.1) * 10) / 10))}
          className="p-1.5 text-slate-300 hover:text-[#E8C16D] hover:bg-[#161D2E] rounded-xl transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={17} />
        </button>
        <span className="text-xs font-bold w-12 text-center text-[#E8C16D]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(3, Math.round((zoom + 0.1) * 10) / 10))}
          className="p-1.5 text-slate-300 hover:text-[#E8C16D] hover:bg-[#161D2E] rounded-xl transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={17} />
        </button>
        <button
          onClick={onReset ? onReset : () => setZoom(1)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-[#161D2E] rounded-lg text-xs font-semibold transition cursor-pointer"
          title="Reset Everything (Dimensions, Orientation, Rotation & Zoom)"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>
      
      <div className="flex-1 flex justify-center px-4">
        <input
          type="text"
          value={templateName}
          onChange={(e) => updateTemplateName(e.target.value)}
          placeholder="Template Name"
          className="px-3.5 py-1.5 text-xs sm:text-sm font-bold bg-[#161D2E] text-[#E8C16D] placeholder-slate-400 border border-slate-700 hover:border-[#E8C16D]/40 focus:border-[#E8C16D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/30 transition text-center w-60 sm:w-64"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {previewSampleData && onTestPrint && (
          <button
            onClick={onTestPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-[#E8C16D] bg-[#FFF9EC] text-[#0A0E1A] hover:bg-[#FFF3D6] transition shadow-xs active:scale-[0.98] cursor-pointer"
            title="Test print this label to your printer"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Test Print</span>
          </button>
        )}
        <button
          onClick={togglePreview}
          title={previewSampleData ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition shadow-xs active:scale-[0.98] cursor-pointer ${
            previewSampleData 
              ? 'bg-[#E8C16D] text-[#0A0E1A] border-[#E8C16D]' 
              : 'bg-[#161D2E] text-[#E8C16D] border-slate-700 hover:bg-slate-800'
          }`}
        >
          <Eye size={15} />
          <span>{previewSampleData ? 'Preview Mode' : 'Edit Mode'}</span>
        </button>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900/50 hover:text-red-200 transition shadow-xs active:scale-[0.98] cursor-pointer"
        >
          <Trash2 size={15} />
          <span>Clear</span>
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-bold bg-[#E8C16D] text-[#0A0E1A] rounded-xl hover:bg-[#d4af5a] transition active:scale-[0.98] shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
