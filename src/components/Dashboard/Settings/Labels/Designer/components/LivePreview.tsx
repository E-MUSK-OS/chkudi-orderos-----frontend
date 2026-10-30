import React from 'react';
import { LabelTemplate, ProductLookupResult } from '../../types/label.types';
import { DesignCanvas } from './DesignCanvas';

interface LivePreviewProps {
  template: LabelTemplate;
  productData: ProductLookupResult;
  zoom?: number;
}

export function LivePreview({ template, productData, zoom = 1 }: LivePreviewProps) {
  const previewData: Record<string, string> = {
    title: productData.title || '',
    sku: productData.sku || '',
    masterSku: productData.masterSku || '',
    brand: productData.brand || '',
    size: productData.size || '',
    color: productData.color || '',
    mrp: productData.mrp ? String(productData.mrp) : '',
    asin: productData.asin || '',
    manufacturingMonth: productData.manufacturingMonth || '',
    fullSku: productData.masterSku || '',
  };

  return (
    <div className="relative flex items-center justify-center h-full w-full">
      <DesignCanvas
        settings={template.settings}
        elements={template.layoutJson || []}
        selectedElementId={null}
        selectedIds={[]}
        zoom={zoom}
        previewSampleData={true}
        previewData={previewData}
        backgroundImageUrl={template.backgroundImageUrl || null}
        onSelect={() => {}}
        onToggleSelect={() => {}}
        onSetSelection={() => {}}
        onUpdateElement={() => {}}
        onBatchUpdateElements={() => {}}
        commitHistory={() => {}}
      />
    </div>
  );
}
