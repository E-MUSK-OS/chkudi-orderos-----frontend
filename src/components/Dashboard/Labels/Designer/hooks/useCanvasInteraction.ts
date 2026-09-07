import { useState, useRef } from 'react';
import { CanvasSettings, LabelElement } from '../../types/label.types';
import { pxToMm, snapPoint, MM_TO_PX } from '../utils/coordinateMath';
import { computeGuides, Guide } from '../utils/alignmentGuides';

interface DragState {
  isDragging: boolean;
  startX: number; // client px
  startY: number;
  initial: Record<string, { x: number; y: number }>; // mm, per element id in the drag set
  hasMoved: boolean;
}

interface ResizeState {
  isResizing: boolean;
  handle: string | null;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  initialRotation: number;
  elementId: string;
  hasMoved: boolean;
}

interface RotateState {
  isRotating: boolean;
  elementId: string;
  centerX: number;
  centerY: number;
  initialRotation: number;
  hasMoved: boolean;
}

interface MarqueeState {
  isMarquee: boolean;
  startClientX: number;
  startClientY: number;
  currentClientX: number;
  currentClientY: number;
  additive: boolean; // shift held when marquee started
}

export function useCanvasInteraction(
  settings: CanvasSettings,
  zoom: number,
  elements: LabelElement[],
  selectedIds: string[],
  onUpdateElement: (id: string, updates: Partial<LabelElement>, skipHistory?: boolean) => void,
  onBatchUpdate: (updates: { id: string; changes: Partial<LabelElement> }[], skipHistory?: boolean) => void,
  commitHistory: () => void,
  onSelect: (id: string | null) => void,
  onToggleSelect: (id: string) => void,
  onSetSelection: (ids: string[]) => void
) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [rotateState, setRotateState] = useState<RotateState | null>(null);
  const [marqueeState, setMarqueeState] = useState<MarqueeState | null>(null);
  const [activeGuides, setActiveGuides] = useState<Guide[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const suspendSnapRef = useRef(false); // Alt key held

  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    if (e.target !== containerRef.current) return;
    // Start marquee selection on empty canvas
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setMarqueeState({
      isMarquee: true,
      startClientX: e.clientX,
      startClientY: e.clientY,
      currentClientX: e.clientX,
      currentClientY: e.clientY,
      additive: e.shiftKey,
    });
    if (!e.shiftKey) onSelect(null);
  };

  const handlePointerDownElement = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (!element) return;

    const isShiftOrCtrl = e.shiftKey || e.ctrlKey || e.metaKey;

    if (isShiftOrCtrl) {
      // Toggle only. Never start a drag from a shift/ctrl click, even if the
      // element ends up selected, because the user is building a selection,
      // not repositioning yet.
      onToggleSelect(id);
      return;
    }

    if (element.locked) {
      onSelect(id);
      return;
    }

    // Plain click on an element already inside a multi-selection keeps the
    // whole group selected and starts a group drag. Plain click on an
    // element outside the current selection replaces the selection with
    // just that element.
    const isPartOfExistingSelection = selectedIds.includes(id) && selectedIds.length > 1;
    const dragIds = isPartOfExistingSelection ? selectedIds : [id];
    if (!isPartOfExistingSelection) onSelect(id);

    const initial: Record<string, { x: number; y: number }> = {};
    dragIds.forEach(dragId => {
      const el = elements.find(e => e.id === dragId);
      if (el && !el.locked) initial[dragId] = { x: el.x, y: el.y };
    });

    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initial,
      hasMoved: false,
    });
  };

  const handlePointerDownResize = (e: React.PointerEvent, handle: string, id: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === id);
    if (!element) return;
    if (element.locked) return;

    onSelect(id); // resizing always collapses to single-element mode

    if (handle === 'rotate') {
      const elDom = e.currentTarget.closest('[data-element-id]') as HTMLElement | null;
      let centerX = e.clientX;
      let centerY = e.clientY;
      if (elDom) {
        const rect = elDom.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
      }
      const handleEl = e.currentTarget as HTMLElement;
      handleEl.setPointerCapture(e.pointerId);
      setRotateState({
        isRotating: true,
        elementId: id,
        centerX,
        centerY,
        initialRotation: element.rotation || 0,
        hasMoved: false,
      });
      return;
    }

    const elElement = e.currentTarget as HTMLElement;
    elElement.setPointerCapture(e.pointerId);
    setResizeState({
      isResizing: true,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y,
      initialWidth: element.width,
      initialHeight: element.height,
      initialRotation: element.rotation || 0,
      elementId: id,
      hasMoved: false,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    suspendSnapRef.current = e.altKey;

    if (marqueeState?.isMarquee) {
      setMarqueeState(prev => prev ? { ...prev, currentClientX: e.clientX, currentClientY: e.clientY } : prev);
      return;
    }

    if (dragState?.isDragging) {
      const dxPxRaw = e.clientX - dragState.startX;
      const dyPxRaw = e.clientY - dragState.startY;
      if (dxPxRaw === 0 && dyPxRaw === 0) return;
      setDragState(prev => (prev && !prev.hasMoved) ? { ...prev, hasMoved: true } : prev);

      let dxMm = pxToMm(dxPxRaw, zoom);
      let dyMm = pxToMm(dyPxRaw, zoom);

      const dragIds = Object.keys(dragState.initial);

      // Compute the moving selection's bounding box for guide + grid snapping
      const movingBoxes = dragIds.map(id => {
        const base = dragState.initial[id];
        const el = elements.find(e => e.id === id)!;
        return { id, x: base.x + dxMm, y: base.y + dyMm, width: el.width, height: el.height, rotation: el.rotation || 0 };
      });
      const left = Math.min(...movingBoxes.map(b => b.x));
      const top = Math.min(...movingBoxes.map(b => b.y));
      const right = Math.max(...movingBoxes.map(b => b.x + b.width));
      const bottom = Math.max(...movingBoxes.map(b => b.y + b.height));

      let snapDx = 0;
      let snapDy = 0;
      let guides: Guide[] = [];

      if (!suspendSnapRef.current) {
        const result = computeGuides(
          { left, top, right, bottom },
          elements.filter(el => !dragIds.includes(el.id)),
          settings,
          zoom
        );
        snapDx = result.dx;
        snapDy = result.dy;
        guides = result.guides;
      }

      if (guides.length === 0 && settings.snapToGrid && !suspendSnapRef.current) {
        const snapped = snapPoint(left, top, settings.gridSizeMm, true);
        snapDx = snapped.x - left;
        snapDy = snapped.y - top;
      }

      setActiveGuides(guides);

      const updates = dragIds.map(id => {
        const base = dragState.initial[id];
        return { id, changes: { x: base.x + dxMm + snapDx, y: base.y + dyMm + snapDy } };
      });
      onBatchUpdate(updates, true);
      return;
    }

    if (rotateState?.isRotating) {
      const dx = e.clientX - rotateState.centerX;
      const dy = e.clientY - rotateState.centerY;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      angle = Math.round(angle);
      if (e.shiftKey) angle = Math.round(angle / 45) * 45;

      setRotateState(prev => (prev && !prev.hasMoved) ? { ...prev, hasMoved: true } : prev);
      const element = elements.find(el => el.id === rotateState.elementId);
      if (element && element.rotation !== angle) {
        onUpdateElement(rotateState.elementId, { rotation: angle }, true);
      }
      return;
    }

    if (resizeState?.isResizing) {
      const dxPx = e.clientX - resizeState.startX;
      const dyPx = e.clientY - resizeState.startY;
      if (dxPx === 0 && dyPx === 0) return;
      setResizeState(prev => (prev && !prev.hasMoved) ? { ...prev, hasMoved: true } : prev);

      let dxMm = pxToMm(dxPx, zoom);
      let dyMm = pxToMm(dyPx, zoom);

      const rot = resizeState.initialRotation || 0;
      if (rot === 90) { const tmp = dxMm; dxMm = dyMm; dyMm = -tmp; }
      else if (rot === 180) { dxMm = -dxMm; dyMm = -dyMm; }
      else if (rot === 270) { const tmp = dxMm; dxMm = -dyMm; dyMm = tmp; }

      let { initialX, initialY, initialWidth, initialHeight } = resizeState;
      let newX = initialX, newY = initialY, newWidth = initialWidth, newHeight = initialHeight;
      const handle = resizeState.handle;
      if (!handle) return;

      if (handle.includes('e')) newWidth = initialWidth + dxMm;
      if (handle.includes('w')) { newWidth = initialWidth - dxMm; newX = initialX + dxMm; }
      if (handle.includes('s')) newHeight = initialHeight + dyMm;
      if (handle.includes('n')) { newHeight = initialHeight - dyMm; newY = initialY + dyMm; }

      if (newWidth < 2) { newWidth = 2; if (handle.includes('w')) newX = initialX + initialWidth - 2; }
      if (newHeight < 2) { newHeight = 2; if (handle.includes('n')) newY = initialY + initialHeight - 2; }

      if (settings.snapToGrid && !suspendSnapRef.current) {
        if (handle.includes('e') || handle.includes('w')) {
          const snappedW = snapPoint(newWidth, 0, settings.gridSizeMm, true);
          newWidth = snappedW.x;
          if (handle.includes('w')) newX = initialX + (initialWidth - newWidth);
        }
        if (handle.includes('s') || handle.includes('n')) {
          const snappedH = snapPoint(0, newHeight, settings.gridSizeMm, true);
          newHeight = snappedH.y;
          if (handle.includes('n')) newY = initialY + (initialHeight - newHeight);
        }
      }

      onUpdateElement(resizeState.elementId, { x: newX, y: newY, width: newWidth, height: newHeight }, true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    let wasInteracting = false;

    if (marqueeState?.isMarquee) {
      const el = e.currentTarget as HTMLElement;
      if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x1 = Math.min(marqueeState.startClientX, marqueeState.currentClientX) - rect.left;
        const y1 = Math.min(marqueeState.startClientY, marqueeState.currentClientY) - rect.top;
        const x2 = Math.max(marqueeState.startClientX, marqueeState.currentClientX) - rect.left;
        const y2 = Math.max(marqueeState.startClientY, marqueeState.currentClientY) - rect.top;

        const movedEnough = Math.abs(x2 - x1) > 3 || Math.abs(y2 - y1) > 3;
        if (movedEnough) {
          const x1Mm = pxToMm(x1, zoom), y1Mm = pxToMm(y1, zoom);
          const x2Mm = pxToMm(x2, zoom), y2Mm = pxToMm(y2, zoom);

          const hits = elements.filter(el => {
            if (el.locked) return false;
            const elLeft = el.x, elTop = el.y, elRight = el.x + el.width, elBottom = el.y + el.height;
            return elLeft < x2Mm && elRight > x1Mm && elTop < y2Mm && elBottom > y1Mm;
          }).map(el => el.id);

          if (marqueeState.additive) {
            const merged = Array.from(new Set([...selectedIds, ...hits]));
            onSetSelection(merged);
          } else {
            onSetSelection(hits);
          }
        }
      }
      setMarqueeState(null);
      return;
    }

    if (dragState?.isDragging) {
      const el = e.currentTarget as HTMLElement;
      if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (dragState.hasMoved) wasInteracting = true;
      setDragState(null);
      setActiveGuides([]);
    }
    if (rotateState?.isRotating) {
      const el = e.currentTarget as HTMLElement;
      if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (rotateState.hasMoved) wasInteracting = true;
      setRotateState(null);
    }
    if (resizeState?.isResizing) {
      const el = e.currentTarget as HTMLElement;
      if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (resizeState.hasMoved) wasInteracting = true;
      setResizeState(null);
    }

    if (wasInteracting) commitHistory();
  };

  return {
    containerRef,
    handlePointerDownCanvas,
    handlePointerDownElement,
    handlePointerDownResize,
    handlePointerMove,
    handlePointerUp,
    isInteracting: !!(dragState?.isDragging || resizeState?.isResizing || rotateState?.isRotating),
    marqueeRect: marqueeState?.isMarquee ? {
      startClientX: marqueeState.startClientX,
      startClientY: marqueeState.startClientY,
      currentClientX: marqueeState.currentClientX,
      currentClientY: marqueeState.currentClientY,
    } : null,
    activeGuides,
  };
}
