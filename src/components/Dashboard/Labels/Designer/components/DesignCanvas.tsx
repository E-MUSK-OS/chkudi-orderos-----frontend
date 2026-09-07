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
  selectedIds: string[];
  zoom: number;
  previewSampleData: boolean;
  previewData?: Record<string, string> | null;
  backgroundImageUrl: string | null;
  onSelect: (id: string | null) => void;
  onToggleSelect: (id: string) => void;
  onSetSelection: (ids: string[]) => void;
  onUpdateElement: (id: string, updates: Partial<LabelElement>, skipHistory?: boolean) => void;
  onBatchUpdateElements: (updates: { id: string; changes: Partial<LabelElement> }[], skipHistory?: boolean) => void;
  commitHistory: () => void;
}

export function DesignCanvas({
  settings, elements, selectedElementId, selectedIds, zoom, previewSampleData,
  previewData, backgroundImageUrl, onSelect, onToggleSelect, onSetSelection,
  onUpdateElement, onBatchUpdateElements, commitHistory,
}: DesignCanvasProps) {
  const {
    containerRef, handlePointerDownCanvas, handlePointerDownElement, handlePointerDownResize,
    handlePointerMove, handlePointerUp, isInteracting, marqueeRect, activeGuides,
  } = useCanvasInteraction(
    settings, zoom, elements, selectedIds,
    onUpdateElement, onBatchUpdateElements, commitHistory,
    onSelect, onToggleSelect, onSetSelection
  );

  const canvasWidthPx = mmToPx(settings.widthMm, zoom);
  const canvasHeightPx = mmToPx(settings.heightMm, zoom);
  const isMulti = selectedIds.length > 1;

  const groupBox = isMulti ? (() => {
    const selected = elements.filter(el => selectedIds.includes(el.id));
    const left = Math.min(...selected.map(e => e.x));
    const top = Math.min(...selected.map(e => e.y));
    const right = Math.max(...selected.map(e => e.x + e.width));
    const bottom = Math.max(...selected.map(e => e.y + e.height));
    return { left, top, right, bottom };
  })() : null;

  return (
    <div
      className="relative flex-1 overflow-auto bg-[#F7F5F0] flex items-center justify-center p-8"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="relative pointer-events-none" style={{ width: canvasWidthPx, height: canvasHeightPx }}>
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
            backgroundImage: !previewSampleData && settings.snapToGrid
              ? `linear-gradient(to right, #E7E0D2 1px, transparent 1px), linear-gradient(to bottom, #E7E0D2 1px, transparent 1px)`
              : 'none',
            backgroundSize: `${mmToPx(settings.gridSizeMm, zoom)}px ${mmToPx(settings.gridSizeMm, zoom)}px`,
          }}
        >
          {backgroundImageUrl && (
            <img
              src={backgroundImageUrl}
              alt=""
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'fill', pointerEvents: 'none',
                opacity: settings.backgroundOpacity ?? 1,
              }}
            />
          )}

          {elements.map((element) => (
            <ElementRenderer
              key={element.id}
              element={element}
              isSelected={!previewSampleData && selectedIds.includes(element.id)}
              isPrimarySelection={!previewSampleData && element.id === selectedElementId}
              isMultiSelected={!previewSampleData && isMulti && selectedIds.includes(element.id)}
              zoom={zoom}
              previewSampleData={previewSampleData}
              previewData={previewData}
              onPointerDownElement={previewSampleData ? () => {} : handlePointerDownElement}
              onPointerDownResize={previewSampleData ? () => {} : handlePointerDownResize}
              onUpdateElement={onUpdateElement}
              commitHistory={commitHistory}
            />
          ))}

          {/* Group selection bounding box - handles are intentionally omitted for v1 multi-select */}
          {groupBox && !previewSampleData && (
            <div
              className="absolute pointer-events-none border-2 border-[#E8C16D]"
              style={{
                left: mmToPx(groupBox.left, zoom),
                top: mmToPx(groupBox.top, zoom),
                width: mmToPx(groupBox.right - groupBox.left, zoom),
                height: mmToPx(groupBox.bottom - groupBox.top, zoom),
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.02)',
              }}
            />
          )}

          {/* Live smart guides */}
          {activeGuides.map((g, i) => g.axis === 'x' ? (
            <div key={i} className="absolute pointer-events-none" style={{
              left: mmToPx(g.positionMm, zoom) - 0.5,
              top: mmToPx(g.spanStartMm, zoom),
              width: 1,
              height: mmToPx(g.spanEndMm - g.spanStartMm, zoom),
              backgroundColor: '#FF3B30',
              zIndex: 50,
            }} />
          ) : (
            <div key={i} className="absolute pointer-events-none" style={{
              top: mmToPx(g.positionMm, zoom) - 0.5,
              left: mmToPx(g.spanStartMm, zoom),
              height: 1,
              width: mmToPx(g.spanEndMm - g.spanStartMm, zoom),
              backgroundColor: '#FF3B30',
              zIndex: 50,
            }} />
          ))}
        </div>

        {/* Marquee rectangle - positioned in viewport (client) coords via a fixed overlay */}
      </div>

      {marqueeRect && (
        <div
          className="fixed border border-[#E8C16D] bg-[#E8C16D]/10 pointer-events-none"
          style={{
            left: Math.min(marqueeRect.startClientX, marqueeRect.currentClientX),
            top: Math.min(marqueeRect.startClientY, marqueeRect.currentClientY),
            width: Math.abs(marqueeRect.currentClientX - marqueeRect.startClientX),
            height: Math.abs(marqueeRect.currentClientY - marqueeRect.startClientY),
            zIndex: 100,
          }}
        />
      )}
    </div>
  );
}
