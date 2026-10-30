import { CanvasSettings, LabelElement } from '../../types/label.types';
import { MM_TO_PX } from './coordinateMath';

export interface Guide {
  axis: 'x' | 'y';
  positionMm: number;
  spanStartMm: number;
  spanEndMm: number;
}

interface Box { left: number; top: number; right: number; bottom: number; }

function elementBox(el: LabelElement): Box {
  // Rotation-aware bounding box using the 4 rotated corners.
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const rot = ((el.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const hw = el.width / 2, hh = el.height / 2;
  const corners = [
    { x: -hw, y: -hh }, { x: hw, y: -hh }, { x: hw, y: hh }, { x: -hw, y: hh },
  ].map(p => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos,
  }));
  return {
    left: Math.min(...corners.map(c => c.x)),
    right: Math.max(...corners.map(c => c.x)),
    top: Math.min(...corners.map(c => c.y)),
    bottom: Math.max(...corners.map(c => c.y)),
  };
}

export function computeGuides(
  movingBox: Box,
  otherElements: LabelElement[],
  settings: CanvasSettings,
  zoom: number
): { dx: number; dy: number; guides: Guide[] } {
  const SNAP_PX = 6;
  const thresholdMm = SNAP_PX / (MM_TO_PX * zoom);

  const vCandidates: { pos: number; spanStart: number; spanEnd: number }[] = [
    { pos: 0, spanStart: 0, spanEnd: settings.heightMm },
    { pos: settings.widthMm, spanStart: 0, spanEnd: settings.heightMm },
    { pos: settings.widthMm / 2, spanStart: 0, spanEnd: settings.heightMm },
  ];
  const hCandidates: { pos: number; spanStart: number; spanEnd: number }[] = [
    { pos: 0, spanStart: 0, spanEnd: settings.widthMm },
    { pos: settings.heightMm, spanStart: 0, spanEnd: settings.widthMm },
    { pos: settings.heightMm / 2, spanStart: 0, spanEnd: settings.widthMm },
  ];

  otherElements.forEach(el => {
    const b = elementBox(el);
    vCandidates.push(
      { pos: b.left, spanStart: b.top, spanEnd: b.bottom },
      { pos: (b.left + b.right) / 2, spanStart: b.top, spanEnd: b.bottom },
      { pos: b.right, spanStart: b.top, spanEnd: b.bottom }
    );
    hCandidates.push(
      { pos: b.top, spanStart: b.left, spanEnd: b.right },
      { pos: (b.top + b.bottom) / 2, spanStart: b.left, spanEnd: b.right },
      { pos: b.bottom, spanStart: b.left, spanEnd: b.right }
    );
  });

  const movingV = [movingBox.left, (movingBox.left + movingBox.right) / 2, movingBox.right];
  const movingH = [movingBox.top, (movingBox.top + movingBox.bottom) / 2, movingBox.bottom];

  let bestDx = 0, bestVDelta = Infinity;
  let vGuide: Guide | null = null;
  movingV.forEach(edge => {
    vCandidates.forEach(c => {
      const delta = Math.abs(edge - c.pos);
      if (delta <= thresholdMm && delta < bestVDelta) {
        bestVDelta = delta;
        bestDx = c.pos - edge;
        vGuide = {
          axis: 'x',
          positionMm: c.pos,
          spanStartMm: Math.min(c.spanStart, movingBox.top) - 4,
          spanEndMm: Math.max(c.spanEnd, movingBox.bottom) + 4,
        };
      }
    });
  });

  let bestDy = 0, bestHDelta = Infinity;
  let hGuide: Guide | null = null;
  movingH.forEach(edge => {
    hCandidates.forEach(c => {
      const delta = Math.abs(edge - c.pos);
      if (delta <= thresholdMm && delta < bestHDelta) {
        bestHDelta = delta;
        bestDy = c.pos - edge;
        hGuide = {
          axis: 'y',
          positionMm: c.pos,
          spanStartMm: Math.min(c.spanStart, movingBox.left) - 4,
          spanEndMm: Math.max(c.spanEnd, movingBox.right) + 4,
        };
      }
    });
  });

  const guides: Guide[] = [];
  if (vGuide) guides.push(vGuide);
  if (hGuide) guides.push(hGuide);

  return { dx: bestDx, dy: bestDy, guides };
}
