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

/**
 * Resolves the visual/effective design dimensions in mm based on given width/height and rotation.
 * By default, the label takes width and height according to the given widthMm and heightMm.
 * If rotation is 90° or 270°, the visual canvas dimensions swap.
 */
export const getEffectiveCanvasDimensions = (settings: {
  widthMm: number;
  heightMm: number;
  orientation?: 'landscape' | 'portrait';
  rotation?: number;
}): { widthMm: number; heightMm: number } => {
  const baseW = settings.widthMm || 100;
  const baseH = settings.heightMm || 50;

  const rot = ((settings.rotation || 0) % 360 + 360) % 360;
  if (rot === 90 || rot === 270) {
    return {
      widthMm: baseH,
      heightMm: baseW,
    };
  }

  return {
    widthMm: baseW,
    heightMm: baseH,
  };
};

/**
 * Rotates elements by deltaAngle degrees (90, 180, 270) relative to previous canvas dimensions (wOld x hOld).
 * Accurately updates both the center position and the element's individual rotation.
 */
export function transformElementsRotation<T extends { x: number; y: number; width: number; height: number; rotation?: number }>(
  elements: T[],
  wOld: number,
  hOld: number,
  deltaAngle: number
): T[] {
  const normDelta = ((deltaAngle % 360) + 360) % 360;
  if (normDelta === 0) return elements;

  return elements.map((el) => {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    let newCx = cx;
    let newCy = cy;

    if (normDelta === 90) {
      newCx = hOld - cy;
      newCy = cx;
    } else if (normDelta === 180) {
      newCx = wOld - cx;
      newCy = hOld - cy;
    } else if (normDelta === 270) {
      newCx = cy;
      newCy = wOld - cx;
    }

    const newRot = Math.round(((el.rotation || 0) + normDelta) % 360);
    const newX = Math.round((newCx - el.width / 2) * 100) / 100;
    const newY = Math.round((newCy - el.height / 2) * 100) / 100;

    return {
      ...el,
      x: newX,
      y: newY,
      rotation: newRot,
    };
  });
}


