// 1 mm = 3.7795275591 px (96 DPI screen representation)
export const MM_TO_PX = 3.7795275591;

/**
 * Converts millimeters to pixels based on the zoom level.
 */
export const mmToPx = (mm: number, zoom: number = 1): number => {
  return mm * MM_TO_PX * zoom;
};

/**
 * Converts pixels to millimeters based on the zoom level.
 */
export const pxToMm = (px: number, zoom: number = 1): number => {
  return px / (MM_TO_PX * zoom);
};

/**
 * Snaps a value (in mm) to the nearest grid step if snapToGrid is true.
 */
export const snapValue = (value: number, gridSize: number, snap: boolean): number => {
  if (!snap || !gridSize || gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Helper to snap a point (x, y) in mm.
 */
export const snapPoint = (x: number, y: number, gridSize: number, snap: boolean): { x: number; y: number } => {
  return {
    x: snapValue(x, gridSize, snap),
    y: snapValue(y, gridSize, snap)
  };
};
