import { useState, useRef } from 'react';
import { CanvasSettings, LabelElement } from '../../types/label.types';
import { pxToMm, snapPoint } from '../utils/coordinateMath';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  elementId: string;
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
  centerX: number; // center of element in client px
  centerY: number;
  initialRotation: number;
  hasMoved: boolean;
}

export function useCanvasInteraction(
  settings: CanvasSettings,
  zoom: number,
  elements: LabelElement[],
  onUpdateElement: (id: string, updates: Partial<LabelElement>, skipHistory?: boolean) => void,
  commitHistory: () => void,
  onSelect: (id: string | null) => void
) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [rotateState, setRotateState] = useState<RotateState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    if (e.target === containerRef.current) {
      onSelect(null);
    }
  };

  const handlePointerDownElement = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    onSelect(id);
    
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    // Prevent dragging locked elements, but allow selecting them
    if (element.locked) return;

    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: element.x,
      initialY: element.y,
      elementId: id,
      hasMoved: false
    });
  };

  const handlePointerDownResize = (e: React.PointerEvent, handle: string, id: string) => {
    e.stopPropagation();
    
    const element = elements.find(el => el.id === id);
    if (!element) return;
    if (element.locked) return;
    
    onSelect(id);

    // --- ROTATE handle ---
    if (handle === 'rotate') {
      // Find center of the element in client coordinates
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

    // --- RESIZE handle ---
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
      hasMoved: false
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragState?.isDragging) {
      const dxPx = e.clientX - dragState.startX;
      const dyPx = e.clientY - dragState.startY;

      const dxMm = pxToMm(dxPx, zoom);
      const dyMm = pxToMm(dyPx, zoom);

      if (dxPx === 0 && dyPx === 0) return;
      setDragState(prev => (prev && !prev.hasMoved) ? { ...prev, hasMoved: true } : prev);

      let newX = dragState.initialX + dxMm;
      let newY = dragState.initialY + dyMm;

      if (settings.snapToGrid) {
        const snapped = snapPoint(newX, newY, settings.gridSizeMm, true);
        newX = snapped.x;
        newY = snapped.y;
      }

      onUpdateElement(dragState.elementId, { x: newX, y: newY }, true);

    } else if (rotateState?.isRotating) {
      // Calculate angle from element center to current mouse position
      const dx = e.clientX - rotateState.centerX;
      const dy = e.clientY - rotateState.centerY;
      // atan2 gives angle in radians, convert to degrees
      // Add 90deg offset so 0° = handle pointing up
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      // Normalize to 0-360
      if (angle < 0) angle += 360;
      angle = Math.round(angle);

      // Snap to 45° increments when Shift is held
      if (e.shiftKey) {
        angle = Math.round(angle / 45) * 45;
      }

      setRotateState(prev => (prev && !prev.hasMoved) ? { ...prev, hasMoved: true } : prev);
      
      const element = elements.find(el => el.id === rotateState.elementId);
      if (element && element.rotation !== angle) {
        onUpdateElement(rotateState.elementId, { rotation: angle }, true);
      }

    } else if (resizeState?.isResizing) {
      const dxPx = e.clientX - resizeState.startX;
      const dyPx = e.clientY - resizeState.startY;

      if (dxPx === 0 && dyPx === 0) return;
      setResizeState(prev => (prev && !prev.hasMoved) ? { ...prev, hasMoved: true } : prev);

      let dxMm = pxToMm(dxPx, zoom);
      let dyMm = pxToMm(dyPx, zoom);

      // Rotate the delta vector inversely to element rotation (for 90-degree multiples)
      const rot = resizeState.initialRotation || 0;
      if (rot === 90) {
        const tmp = dxMm; dxMm = dyMm; dyMm = -tmp;
      } else if (rot === 180) {
        dxMm = -dxMm; dyMm = -dyMm;
      } else if (rot === 270) {
        const tmp = dxMm; dxMm = -dyMm; dyMm = tmp;
      }

      let { initialX, initialY, initialWidth, initialHeight } = resizeState;
      let newX = initialX;
      let newY = initialY;
      let newWidth = initialWidth;
      let newHeight = initialHeight;

      const handle = resizeState.handle;
      if (!handle) return;

      if (handle.includes('e')) newWidth = initialWidth + dxMm;
      if (handle.includes('w')) { newWidth = initialWidth - dxMm; newX = initialX + dxMm; }
      if (handle.includes('s')) newHeight = initialHeight + dyMm;
      if (handle.includes('n')) { newHeight = initialHeight - dyMm; newY = initialY + dyMm; }

      if (newWidth < 2) { newWidth = 2; if (handle.includes('w')) newX = initialX + initialWidth - 2; }
      if (newHeight < 2) { newHeight = 2; if (handle.includes('n')) newY = initialY + initialHeight - 2; }

      if (settings.snapToGrid) {
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
    
    if (dragState?.isDragging) {
      const el = e.currentTarget as HTMLElement;
      if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (dragState.hasMoved) wasInteracting = true;
      setDragState(null);
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
    
    if (wasInteracting) {
       commitHistory();
    }
  };

  return {
    containerRef,
    handlePointerDownCanvas,
    handlePointerDownElement,
    handlePointerDownResize,
    handlePointerMove,
    handlePointerUp,
    isInteracting: dragState?.isDragging || resizeState?.isResizing || rotateState?.isRotating,
  };
}
