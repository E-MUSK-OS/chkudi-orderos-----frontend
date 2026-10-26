import { ZoomIn, ZoomOut, Undo, Redo, Eye, Save, Trash2, ArrowLeft, Loader2, Printer, RotateCcw, Wrench, Sliders } from 'lucide-react';

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
  activeMobileTab?: 'canvas' | 'tools' | 'properties';
  setActiveMobileTab?: (tab: 'canvas' | 'tools' | 'properties') => void;
  hasSelectedElement?: boolean;
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
  activeMobileTab,
  setActiveMobileTab,
  hasSelectedElement,
}: TopToolbarProps) {
  return (
    <div className="flex items-center justify-between h-14 bg-[#0A0E1A] dark:bg-[#080B11] border-b border-[#E7E0D2]/20 dark:border-white/[0.08] px-2 sm:px-4 shrink-0 shadow-xs overflow-x-auto no-scrollbar gap-1.5 sm:gap-3">
      {/* Left controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700 bg-[#161D2E] text-xs font-bold text-[#E8C16D] hover:bg-[#E8C16D] hover:text-[#0A0E1A] hover:border-[#E8C16D] transition active:scale-[0.98] cursor-pointer shadow-xs"
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
          <Undo size={16} />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 text-slate-300 hover:text-[#E8C16D] hover:bg-[#161D2E] rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
        </button>

        <div className="w-px h-5 bg-slate-800 mx-0.5 sm:mx-1" />

        <button
          onClick={() => setZoom(Math.max(1, Math.round((zoom - 0.1) * 10) / 10))}
          className="p-1 text-slate-300 hover:text-[#E8C16D] hover:bg-[#161D2E] rounded-xl transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>

        <span className="text-[11px] sm:text-xs font-bold w-10 sm:w-12 text-center text-[#E8C16D] shrink-0">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom(Math.min(3, Math.round((zoom + 0.1) * 10) / 10))}
          className="p-1 text-slate-300 hover:text-[#E8C16D] hover:bg-[#161D2E] rounded-xl transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        <button
          onClick={onReset ? onReset : () => setZoom(1)}
          className="inline-flex items-center gap-1 px-2 py-1 text-slate-300 hover:text-white hover:bg-[#161D2E] rounded-lg text-xs font-semibold transition cursor-pointer"
          title="Reset Everything (Dimensions, Orientation, Rotation & Zoom)"
        >
          <RotateCcw size={12} />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Center: Template Name */}
      <div className="flex-1 flex justify-center px-1 sm:px-2 min-w-0">
        <input
          type="text"
          value={templateName}
          onChange={(e) => updateTemplateName(e.target.value)}
          placeholder="Template Name"
          className="px-2.5 sm:px-3.5 py-1 text-xs sm:text-sm font-bold bg-[#161D2E] text-[#E8C16D] placeholder-slate-400 border border-slate-700 hover:border-[#E8C16D]/40 focus:border-[#E8C16D] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/30 transition text-center w-28 sm:w-44 md:w-60 truncate"
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {setActiveMobileTab && (
          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={() => setActiveMobileTab(activeMobileTab === 'tools' ? 'canvas' : 'tools')}
              className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                activeMobileTab === 'tools'
                  ? 'bg-[#E8C16D] text-[#0A0E1A] border-[#E8C16D]'
                  : 'bg-[#161D2E] text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Tools"
            >
              <Wrench size={15} />
            </button>

            <button
              onClick={() => setActiveMobileTab(activeMobileTab === 'properties' ? 'canvas' : 'properties')}
              className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 relative ${
                activeMobileTab === 'properties'
                  ? 'bg-[#E8C16D] text-[#0A0E1A] border-[#E8C16D]'
                  : 'bg-[#161D2E] text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Properties"
            >
              <Sliders size={15} />
              {hasSelectedElement && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#E8C16D] ring-2 ring-[#0A0E1A]" />
              )}
            </button>
          </div>
        )}

        {previewSampleData && onTestPrint && (
          <button
            onClick={onTestPrint}
            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#252014] transition shadow-xs active:scale-[0.98] cursor-pointer"
            title="Test print this label to your printer"
          >
            <Printer size={15} />
            <span className="hidden md:inline">Test Print</span>
          </button>
        )}

        <button
          onClick={togglePreview}
          title={previewSampleData ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}
          className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-xl border transition shadow-xs active:scale-[0.98] cursor-pointer ${
            previewSampleData 
              ? 'bg-[#E8C16D] text-[#0A0E1A] border-[#E8C16D]' 
              : 'bg-[#161D2E] text-[#E8C16D] border-slate-700 hover:bg-slate-800'
          }`}
        >
          <Eye size={15} />
          <span className="hidden sm:inline">{previewSampleData ? 'Preview' : 'Edit'}</span>
        </button>

        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-bold rounded-xl border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-900/50 hover:text-red-200 transition shadow-xs active:scale-[0.98] cursor-pointer"
          title="Clear Canvas"
        >
          <Trash2 size={15} />
          <span className="hidden md:inline">Clear</span>
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold bg-[#E8C16D] text-[#0A0E1A] rounded-xl hover:bg-[#d4af5a] transition active:scale-[0.98] shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
