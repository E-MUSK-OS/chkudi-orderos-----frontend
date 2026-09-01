import { ZoomIn, ZoomOut, Undo, Redo, Eye, Save, Trash2, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react';

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
  isSaving?: boolean;
  templateName: string;
  updateTemplateName: (name: string) => void;
  onBack: () => void;
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
  isSaving,
  templateName,
  updateTemplateName,
  onBack
}: TopToolbarProps) {
  return (
    <div className="flex items-center justify-between h-14 bg-[#111827] border-b border-stone-800 px-4 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 text-gray-300 hover:bg-[#1F2937] rounded-sm mr-2"
          title="Back to Gallery"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 text-gray-300 hover:bg-[#1F2937] disabled:opacity-50 disabled:hover:bg-transparent rounded-sm"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-gray-300 hover:bg-[#1F2937] disabled:opacity-50 disabled:hover:bg-transparent rounded-sm"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={18} />
        </button>
        <div className="w-px h-6 bg-stone-700 mx-2" />
        <button
          onClick={() => setZoom(Math.max(1, Math.round((zoom - 0.1) * 10) / 10))}
          className="p-2 text-gray-300 hover:bg-[#1F2937] rounded-sm"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-sm font-medium w-12 text-center text-gray-300">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(3, Math.round((zoom + 0.1) * 10) / 10))}
          className="p-2 text-gray-300 hover:bg-[#1F2937] rounded-sm"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-2 text-gray-300 hover:bg-[#1F2937] rounded-sm text-xs font-medium"
          title="Reset Zoom"
        >
          Reset
        </button>
      </div>
      
      <div className="flex-1 flex justify-center px-4">
        <input
          type="text"
          value={templateName}
          onChange={(e) => updateTemplateName(e.target.value)}
          placeholder="Template Name"
          className="px-3 py-1.5 text-sm font-medium bg-stone-800 text-white placeholder-gray-400 border border-stone-700 rounded-sm focus:outline-none focus:border-[#E8C16D] transition-colors text-center w-64"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={togglePreview}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm border ${
            previewSampleData 
              ? 'bg-[#E8C16D] text-black border-[#E8C16D]' 
              : 'bg-[#111827] text-gray-300 border-stone-800 hover:bg-[#1F2937]'
          }`}
        >
          <Eye size={16} />
          {previewSampleData ? 'Preview Mode' : 'Edit Mode'}
        </button>
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[#111827] border border-stone-800 text-red-600 hover:bg-red-900/20 rounded-sm"
        >
          <Trash2 size={16} />
          Clear
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-[#E8C16D] text-[#0A0E1A] rounded-sm hover:bg-[#E8C16D]/90 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

