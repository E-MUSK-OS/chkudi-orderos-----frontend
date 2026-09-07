import React, { useEffect, useRef, useState } from 'react';
import { LabelTemplate, ProductLookupResult } from '../../types/label.types';
import { renderLabelToCanvas } from '@/lib/labelRenderer';

interface LivePreviewProps {
  template: LabelTemplate;
  productData: ProductLookupResult;
}

export function LivePreview({ template, productData }: LivePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const render = async () => {
      try {
        // We override the scale to keep the preview crisp but not massive in the DOM
        const resultCanvas = await renderLabelToCanvas(template, productData, 2);
        if (!active) return;
        
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
          canvasRef.current.width = resultCanvas.width;
          canvasRef.current.height = resultCanvas.height;
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(resultCanvas, 0, 0);
        }
        setError(null);
      } catch (err) {
        if (active) setError(String(err));
      }
    };
    render();
    return () => { active = false; };
  }, [template, productData]); // Intentionally rerendering when template changes

  return (
    <div className="relative flex items-center justify-center h-full w-full">
      <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-lg" />
      {error && <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-500 text-xs p-2 text-center">{error}</div>}
    </div>
  );
}
