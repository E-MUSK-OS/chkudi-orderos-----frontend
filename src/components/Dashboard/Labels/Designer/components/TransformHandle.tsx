import React from 'react';

interface TransformHandleProps {
  onPointerDown: (e: React.PointerEvent, handle: string) => void;
  zoom: number;
}

export function TransformHandle({ onPointerDown, zoom }: TransformHandleProps) {
  const size = 8;
  const offset = -size / 2;

  // The 8 control handles
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

  return (
    <>
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

