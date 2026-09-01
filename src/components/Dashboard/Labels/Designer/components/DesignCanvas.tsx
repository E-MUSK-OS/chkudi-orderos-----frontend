import React from 'react';
import { CanvasSettings, LabelElement } from '../../types/label.types';
import { mmToPx } from '../utils/coordinateMath';
import { CanvasRulers } from './CanvasRulers';
import { ElementRenderer } from './ElementRenderer';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';

interface DesignCanvasProps {
  settings: CanvasSettings;
  elements: LabelElement[];
  selectedElementId: string | null;
  zoom: number;
  previewSampleData: boolean;
  previewData?: Record<string, string> | null;
  backgroundImageUrl: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<LabelElement>, skipHistory?: boolean) => void;
  commitHistory: () => void;
}

export function DesignCanvas({
  settings,
  elements,
  selectedElementId,
  zoom,
  previewSampleData,
  previewData,
  backgroundImageUrl,
  onSelect,
  onUpdateElement,
  commitHistory,
}: DesignCanvasProps) {
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  const {
    containerRef,
    handlePointerDownCanvas,
    handlePointerDownElement,
    handlePointerDownResize,
    handlePointerMove,
    handlePointerUp,
    isInteracting,
  } = useCanvasInteraction(
    settings,
    zoom,
    elements,
    onUpdateElement,
    commitHistory,
    onSelect
  );

  const canvasWidthPx = mmToPx(settings.widthMm, zoom);
  const canvasHeightPx = mmToPx(settings.heightMm, zoom);

  return (
    <div 
      className="relative flex-1 overflow-auto bg-[#F7F5F0] flex items-center justify-center p-8"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="relative pointer-events-none" style={{ width: canvasWidthPx, height: canvasHeightPx }}>
        {/* Rulers positioned absolutely relative to this exact canvas bounds, offset by their own width/height outwards */}
        {!previewSampleData && (
          <div className="absolute -top-6 -left-6 pointer-events-auto">
            <CanvasRulers zoom={zoom} widthMm={settings.widthMm} heightMm={settings.heightMm} />
          </div>
        )}
        
        <div
          ref={containerRef}
          onPointerDown={handlePointerDownCanvas}
          className="absolute inset-0 bg-white shadow-lg overflow-hidden shrink-0 pointer-events-auto"
        style={{
          width: canvasWidthPx,
          height: canvasHeightPx,
          cursor: isInteracting ? 'move' : 'default',
          // Millimeter grid background
          backgroundImage: !previewSampleData && settings.snapToGrid
            ? `
              linear-gradient(to right, #E7E0D2 1px, transparent 1px),
              linear-gradient(to bottom, #E7E0D2 1px, transparent 1px)
            `
            : 'none',
          backgroundSize: `${mmToPx(settings.gridSizeMm, zoom)}px ${mmToPx(settings.gridSizeMm, zoom)}px`,
        }}
      >
        {backgroundImageUrl && (
          <img
            src={backgroundImageUrl}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }}
          />
        )}
        {elements.map((element) => (
          <ElementRenderer
            key={element.id}
            element={element}
            isSelected={!previewSampleData && element.id === selectedElementId}
            zoom={zoom}
            previewSampleData={previewSampleData}
            previewData={previewData}
            onPointerDownElement={previewSampleData ? () => {} : handlePointerDownElement}
            onPointerDownResize={previewSampleData ? () => {} : handlePointerDownResize}
            onUpdateElement={onUpdateElement}
            commitHistory={commitHistory}
          />
        ))}
        </div>
      </div>
    </div>
  );
}

