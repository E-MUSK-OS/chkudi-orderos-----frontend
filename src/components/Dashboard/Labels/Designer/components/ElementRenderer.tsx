import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import { LabelElement } from '../../types/label.types';
import { mmToPx } from '../utils/coordinateMath';
import { resolveVariable } from '../utils/sampleData';
import { TransformHandle } from './TransformHandle';
import { getFontFamily, binarizeImageToCanvas } from '@/lib/labelRenderer';

interface ElementRendererProps {
  element: LabelElement;
  isSelected: boolean;
  isPrimarySelection: boolean;
  isMultiSelected: boolean;
  zoom: number;
  colorMode?: 'color' | 'monochrome';
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
  isPrimarySelection,
  isMultiSelected,
  zoom,
  colorMode,
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
  const [monoImageUrl, setMonoImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (colorMode === 'monochrome' && element.type === 'image' && element.imageUrl) {
      binarizeImageToCanvas(element.imageUrl, 220)
        .then((canvas) => {
          if (!isCancelled) {
            setMonoImageUrl(canvas.toDataURL('image/png'));
          }
        })
        .catch(() => {
          if (!isCancelled) setMonoImageUrl(null);
        });
    } else {
      setMonoImageUrl(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [colorMode, element.type === 'image' ? (element as any).imageUrl : null, element.type]);

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
        : (element.content === 'Double click to edit' && element.variableSource ? element.variableSource : element.content);

      try {
        setBarcodeError(null);
        JsBarcode(barcodeRef.current, content || '12345678', {
          format: element.barcodeFormat || 'CODE128',
          displayValue: false,
          margin: 0,
          width: 2,
          height: 100,
        });
        barcodeRef.current.setAttribute('preserveAspectRatio', 'none');
        barcodeRef.current.removeAttribute('width');
        barcodeRef.current.removeAttribute('height');
        barcodeRef.current.style.width = '100%';
        barcodeRef.current.style.height = '100%';
        barcodeRef.current.style.display = 'block';
      } catch (e: any) {
        setBarcodeError(e?.message || 'Invalid barcode format or content');
      }
    }
  }, [element, previewSampleData, previewData, zoom]);

  const xPx = mmToPx(element.x, zoom);
  const yPx = mmToPx(element.y, zoom);
  const widthPx = mmToPx(element.width, zoom);
  const heightPx = mmToPx(element.height, zoom);

  const contentOpacity = element.opacity ?? 1;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: xPx,
    top: yPx,
    width: widthPx,
    height: heightPx,
    transform: `rotate(${element.rotation}deg)`,
    zIndex: element.zIndex,
    border: !previewSampleData && isMultiSelected
      ? '1px dashed rgba(232,193,109,0.6)'
      : !previewSampleData && isPrimarySelection
        ? '1px dashed #E8C16D'
        : 'none',
    boxSizing: 'border-box',
    cursor: previewSampleData ? 'default' : (element.locked ? 'default' : 'move'),
    opacity: contentOpacity,
    filter: colorMode === 'monochrome' ? (element.type === 'image' ? 'grayscale(100%) contrast(400%)' : 'grayscale(100%)') : (element.locked && !previewSampleData ? 'grayscale(0.35)' : undefined),
    pointerEvents: isEditing ? 'none' : (previewSampleData ? 'none' : 'auto'),
    userSelect: isEditing ? 'auto' : 'none',
    WebkitUserSelect: isEditing ? 'auto' : 'none',
  };

  const renderContent = () => {
    switch (element.type) {
      case 'text': {
        const textContent = previewData
          ? resolveVariable(element.content, element.variableSource, previewData)
          : (element.content === 'Double click to edit' && element.variableSource ? element.variableSource : element.content);

        return (
          <div
            onDoubleClick={handleDoubleClick}
            style={{
              width: '100%',
              height: '100%',
              fontSize: `${element.fontSize * zoom}pt`,
              fontFamily: getFontFamily(element.fontFamily),
              fontWeight: element.fontWeight === 'bold' ? 'bold' : 'normal',
              fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
              textDecoration: element.textDecoration === 'underline' ? 'underline' : 'none',
              textAlign: element.textAlign,
              lineHeight: element.lineHeight,
              color: colorMode === 'monochrome' ? '#000000' : (element.color || '#000000'),
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              border: !previewSampleData && !textContent && !isEditing ? '1px dashed #ccc' : 'none',
              backgroundColor: !previewSampleData && !textContent && !isEditing ? 'rgba(0,0,0,0.05)' : 'transparent',
              pointerEvents: previewSampleData ? 'none' : 'auto',
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
              textContent || (previewSampleData ? null : <span style={{ opacity: 0.5, fontSize: '0.8em' }}>[Empty Text]</span>)
            )}
          </div>
        );
      }
      case 'barcode': {
        const barcodeContent = previewData 
          ? resolveVariable(element.content, element.variableSource, previewData)
          : (element.content === 'Double click to edit' && element.variableSource ? element.variableSource : element.content);

        const showText = element.showText !== false;
        const fontSizePt = (element.fontSize || 10) * zoom;

        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative' }}>
              <svg 
                ref={barcodeRef} 
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', display: barcodeError ? 'none' : 'block' }}
              />
            </div>
            {showText && !barcodeError && (
              <div
                style={{
                  fontSize: `${fontSizePt}pt`,
                  fontFamily: getFontFamily(element.fontFamily),
                  fontWeight: element.fontWeight === 'bold' ? 'bold' : 'normal',
                  fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
                  textDecoration: element.textDecoration === 'underline' ? 'underline' : 'none',
                  textAlign: element.textAlign || 'center',
                  lineHeight: 1.1,
                  color: colorMode === 'monochrome' ? '#000000' : (element.color || '#000000'),
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexShrink: 0,
                  paddingTop: '1px',
                }}
              >
                {barcodeContent || (previewSampleData ? '' : '[Empty Barcode]')}
              </div>
            )}
            {barcodeError && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-red-500 text-center bg-red-50 p-1">
                {barcodeError}
              </div>
            )}
          </div>
        );
      }
      case 'qrcode': {
        const qrContent = previewData
          ? resolveVariable(element.content, element.variableSource, previewData)
          : (element.content === 'Double click to edit' && element.variableSource ? element.variableSource : element.content);

        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QRCodeSVG
              value={qrContent || ' '}
              size={Math.min(widthPx, heightPx)}
              level={element.errorCorrectionLevel}
            />
          </div>
        );
      }
      case 'image': {
        if (!element.imageUrl) {
          return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: previewSampleData ? 'transparent' : '#f3f4f6', border: previewSampleData ? 'none' : '1px dashed #d1d5db', color: previewSampleData ? 'transparent' : '#9ca3af', fontSize: '10px' }}>
              {!previewSampleData && 'No Image'}
            </div>
          );
        }

        let displayUrl = (colorMode === 'monochrome' && monoImageUrl) ? monoImageUrl : element.imageUrl;
        if (displayUrl.startsWith('data:image/svg+xml')) {
          try {
            if (displayUrl.includes(';base64,')) {
              const b64 = displayUrl.split(';base64,')[1];
              const decoded = atob(b64);
              if (!decoded.includes('preserveAspectRatio')) {
                const updated = decoded.replace('<svg ', '<svg preserveAspectRatio="none" ');
                displayUrl = `data:image/svg+xml;base64,${btoa(updated)}`;
              }
            } else if (!displayUrl.includes('preserveAspectRatio')) {
              displayUrl = displayUrl.replace('<svg ', '<svg preserveAspectRatio="none" ');
            }
          } catch {
            // fallback
          }
        }

        return (
          <img
            src={displayUrl}
            alt="User uploaded"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML = previewSampleData 
                  ? '' 
                  : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:#fef2f2;border:1px dashed #fca5a5;color:#ef4444;font-size:10px;">Error</div>';
              }
            }}
          />
        );
      }
      case 'line': {
        const strokePx = mmToPx(element.borderWidth, zoom);
        return (
          <div
            style={{
              width: '100%',
              height: `${strokePx}px`,
              backgroundColor: colorMode === 'monochrome' ? '#000000' : element.borderColor,
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
              border: `${mmToPx(element.borderWidth, zoom)}px solid ${colorMode === 'monochrome' ? '#000000' : element.borderColor}`,
              backgroundColor: colorMode === 'monochrome'
                ? (element.fillColor && element.fillColor !== 'transparent' && element.fillColor !== '#ffffff' ? '#000000' : (element.fillColor || 'transparent'))
                : (element.fillColor || 'transparent'),
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      data-element-id={element.id}
      style={style}
      onPointerDown={(e) => {
        onPointerDownElement(e, element.id);
      }}
    >
      {renderContent()}
      
      {!previewSampleData && isPrimarySelection && !isMultiSelected && !element.locked && (
        <TransformHandle
          onPointerDown={(e, handle) => onPointerDownResize(e, handle, element.id)}
          zoom={zoom}
          rotation={element.rotation || 0}
        />
      )}
    </div>
  );
}

