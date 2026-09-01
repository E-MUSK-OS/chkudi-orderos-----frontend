import React from 'react';
import { mmToPx } from '../utils/coordinateMath';

interface CanvasRulersProps {
  zoom: number;
  widthMm: number;
  heightMm: number;
}

export function CanvasRulers({ zoom, widthMm, heightMm }: CanvasRulersProps) {
  
  const tickSpacingMm = 10; // 10mm = 1cm major ticks
  const minorTickSpacingMm = 1; // 1mm minor ticks

  const renderHorizontalRuler = () => {
    const ticks = [];
    for (let i = 0; i <= widthMm; i += minorTickSpacingMm) {
      const isMajor = i % tickSpacingMm === 0;
      ticks.push(
        <div
          key={`h-${i}`}
          className="absolute bottom-0 border-l border-black"
          style={{
            left: mmToPx(i, zoom),
            height: isMajor ? '100%' : '50%',
          }}
        >
          {isMajor && (
            <span className="absolute -top-4 -left-1 text-[9px] text-black">
              {i}
            </span>
          )}
        </div>
      );
    }
    return ticks;
  };

  const renderVerticalRuler = () => {
    const ticks = [];
    for (let i = 0; i <= heightMm; i += minorTickSpacingMm) {
      const isMajor = i % tickSpacingMm === 0;
      ticks.push(
        <div
          key={`v-${i}`}
          className="absolute right-0 border-t border-black"
          style={{
            top: mmToPx(i, zoom),
            width: isMajor ? '100%' : '50%',
          }}
        >
          {isMajor && (
            <span className="absolute -left-5 -top-2.5 text-[9px] text-black transform rotate-[-90deg]">
              {i}
            </span>
          )}
        </div>
      );
    }
    return ticks;
  };

  return (
    <>
      {/* Horizontal Ruler */}
      <div className="absolute top-0 left-6 h-6 bg-white border-b border-black overflow-hidden" style={{ width: mmToPx(widthMm, zoom) }}>
        {renderHorizontalRuler()}
      </div>

      {/* Vertical Ruler */}
      <div className="absolute top-6 left-0 w-6 bg-white border-r border-black overflow-hidden" style={{ height: mmToPx(heightMm, zoom) }}>
        {renderVerticalRuler()}
      </div>
      
      {/* Corner */}
      <div className="absolute top-0 left-0 w-6 h-6 bg-white border-b border-r border-black" />
    </>
  );
}

