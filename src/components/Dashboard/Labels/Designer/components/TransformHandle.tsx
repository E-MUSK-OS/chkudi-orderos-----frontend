import React from 'react';

interface TransformHandleProps {
  onPointerDown: (e: React.PointerEvent, handle: string) => void;
  zoom: number;
}

export function TransformHandle({ onPointerDown, zoom }: TransformHandleProps) {
  const size = 8;
  const offset = -size / 2;

  // The 8 resize handles
  const handles = [
    { id: 'nw', top: offset, left: offset, cursor: 'nwse-resize' },
    { id: 'n', top: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    { id: 'ne', top: offset, right: offset, cursor: 'nesw-resize' },
    { id: 'w', top: '50%', left: offset, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    { id: 'e', top: '50%', right: offset, transform: 'translateY(-50%)', cursor: 'ew-resize' },
    { id: 'sw', bottom: offset, left: offset, cursor: 'nesw-resize' },
    { id: 's', bottom: offset, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
    { id: 'se', bottom: offset, right: offset, cursor: 'nwse-resize' },
  ];

  // Rotation handle: sits above the top-center handle with a line connecting them
  const rotateHandleOffset = 22; // px above the element

  return (
    <>
      {/* Rotation line (thin stem from top edge to rotate dot) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -rotateHandleOffset,
          width: 1,
          height: rotateHandleOffset,
          backgroundColor: '#E8C16D',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />
      {/* Rotation handle dot */}
      <div
        onPointerDown={(e) => onPointerDown(e, 'rotate')}
        title="Drag to rotate"
        style={{
          position: 'absolute',
          top: -rotateHandleOffset - 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 14,
          height: 14,
          borderRadius: '50%',
          backgroundColor: '#E8C16D',
          border: '2px solid #ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          cursor: 'crosshair',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Rotation arrow icon */}
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M2 5 A3 3 0 0 1 8 5" stroke="#0A0E1A" strokeWidth="1.5" strokeLinecap="round"/>
          <polyline points="7,3 8,5 6,5" fill="#0A0E1A"/>
        </svg>
      </div>

      {/* Resize handles */}
      {handles.map((h) => (
        <div
          key={h.id}
          onPointerDown={(e) => onPointerDown(e, h.id)}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8C16D',
            top: h.top,
            left: h.left,
            right: h.right,
            bottom: h.bottom,
            transform: h.transform,
            cursor: h.cursor,
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
}
