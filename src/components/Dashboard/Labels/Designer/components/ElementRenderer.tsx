import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import { LabelElement } from '../../types/label.types';
import { mmToPx } from '../utils/coordinateMath';
import { resolveVariable } from '../utils/sampleData';
import { TransformHandle } from './TransformHandle';

interface ElementRendererProps {
  element: LabelElement;
  isSelected: boolean;
  zoom: number;
  previewSampleData: boolean;
  previewData?: Record<string, string> | null;
  onPointerDownElement: (e: React.PointerEvent, id: string) => void;
  onPointerDownResize: (e: React.PointerEvent, handle: string, id: string) => void;
  onUpdateElement: (id: string, updates: Partial<LabelElement>, skipHistory?: boolean) => void;
  commitHistory: () => void;
}

export function ElementRenderer({
  element,
  isSelected,
  zoom,
  previewSampleData,
  previewData,
  onPointerDownElement,
  onPointerDownResize,
  onUpdateElement,
  commitHistory,
}: ElementRendererProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isSelected && isEditing) {
      commitEdit();
    }
  }, [isSelected]);

  const handleDoubleClick = () => {
    if (element.type !== 'text' || element.locked || element.variableSource || previewSampleData) {
      return;
    }
    setEditValue(element.content);
    setIsEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 0);
  };

  const commitEdit = () => {
    if (isEditing && element.type === 'text' && editValue !== element.content) {
      onUpdateElement(element.id, { content: editValue }, true);
      commitHistory();
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // Render Barcode
  useEffect(() => {
    if (element.type === 'barcode' && barcodeRef.current) {
      const content = previewData 
        ? resolveVariable(element.content, element.variableSource, previewData)
        : previewSampleData
          ? resolveVariable(element.content, element.variableSource) 
          : element.content;

      try {
        setBarcodeError(null);
        JsBarcode(barcodeRef.current, content, {
          format: element.barcodeFormat,
          displayValue: element.showText,
          fontSize: element.fontSize,
          margin: 0,
          width: 2, // internal bars width ratio
          height: Math.max(4, mmToPx(element.height, 1) - (element.showText ? element.fontSize : 0)),
        });
      } catch (e: any) {
        setBarcodeError(e?.message || 'Invalid barcode format or content');
      }
    }
  }, [element, previewSampleData]);

  const xPx = mmToPx(element.x, zoom);
  const yPx = mmToPx(element.y, zoom);
  const widthPx = mmToPx(element.width, zoom);
  const heightPx = mmToPx(element.height, zoom);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: xPx,
    top: yPx,
    width: widthPx,
    height: heightPx,
    transform: `rotate(${element.rotation}deg)`,
    zIndex: element.zIndex,
    border: isSelected ? '1px dashed #E8C16D' : 'none',
    boxSizing: 'border-box',
    cursor: element.locked ? 'default' : 'move',
    opacity: element.locked ? 0.8 : 1,
    pointerEvents: isEditing ? 'none' : 'auto',
  };

  const renderContent = () => {
    switch (element.type) {
      case 'text': {
        const textContent = previewData
          ? resolveVariable(element.content, element.variableSource, previewData)
          : previewSampleData 
            ? resolveVariable(element.content, element.variableSource) 
            : element.content;

        return (
          <div
            onDoubleClick={handleDoubleClick}
            style={{
              width: '100%',
              height: '100%',
              fontSize: `${element.fontSize * zoom}pt`,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight === 'bold' ? 'bold' : 'normal',
              fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
              textDecoration: element.textDecoration === 'underline' ? 'underline' : 'none',
              textAlign: element.textAlign,
              lineHeight: element.lineHeight,
              color: element.color || '#000000',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              border: !textContent && !isEditing ? '1px dashed #ccc' : 'none',
              backgroundColor: !textContent && !isEditing ? 'rgba(0,0,0,0.05)' : 'transparent',
              pointerEvents: 'auto',
            }}
          >
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  resize: 'none',
                  color: 'inherit',
                  font: 'inherit',
                  textAlign: 'inherit',
                  lineHeight: 'inherit',
                  padding: 0,
                  margin: 0,
                  overflow: 'hidden',
                }}
              />
            ) : (
              textContent || <span style={{ opacity: 0.5, fontSize: '0.8em' }}>[Empty Text]</span>
            )}
          </div>
        );
      }
      case 'barcode':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <svg 
              ref={barcodeRef} 
              style={{ width: '100%', height: '100%', display: barcodeError ? 'none' : 'block' }}
            />
            {barcodeError && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-red-500 text-center bg-red-50 p-1">
                {barcodeError}
              </div>
            )}
          </div>
        );
      case 'qrcode': {
        const qrContent = previewData
          ? resolveVariable(element.content, element.variableSource, previewData)
          : previewSampleData 
            ? resolveVariable(element.content, element.variableSource) 
            : element.content;

        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QRCodeSVG
              value={qrContent}
              size={Math.min(widthPx, heightPx)}
              level={element.errorCorrectionLevel}
            />
          </div>
        );
      }
      case 'image':
        if (!element.imageUrl) {
          return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: '10px' }}>
              No Image
            </div>
          );
        }
        return (
          <img
            src={element.imageUrl}
            alt="User uploaded"
            style={{
              width: '100%',
              height: '100%',
              objectFit: element.keepAspectRatio ? 'contain' : 'fill',
              pointerEvents: 'none',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:#fef2f2;border:1px dashed #fca5a5;color:#ef4444;font-size:10px;">Error</div>';
              }
            }}
          />
        );
      case 'line': {
        const strokePx = mmToPx(element.borderWidth, zoom);
        return (
          <div
            style={{
              width: '100%',
              height: `${strokePx}px`,
              backgroundColor: element.borderColor,
              marginTop: `${(heightPx - strokePx) / 2}px`,
            }}
          />
        );
      }
      case 'rectangle':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              border: `${mmToPx(element.borderWidth, zoom)}px solid ${element.borderColor}`,
              backgroundColor: element.fillColor || 'transparent',
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={style}
      onPointerDown={(e) => {
        onPointerDownElement(e, element.id);
      }}
    >
      {renderContent()}
      
      {isSelected && !element.locked && (
        <TransformHandle onPointerDown={(e, handle) => onPointerDownResize(e, handle, element.id)} zoom={zoom} />
      )}
    </div>
  );
}

