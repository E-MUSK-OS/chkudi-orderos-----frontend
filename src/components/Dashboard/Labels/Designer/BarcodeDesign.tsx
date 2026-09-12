'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDesignerState } from './hooks/useDesignerState';
import { labelService } from '../services/label.service';
import { Toolbox } from './components/Toolbox';
import { TopToolbar } from './components/TopToolbar';
import { DesignCanvas } from './components/DesignCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { renderLabelToCanvas } from '@/lib/labelRenderer';
import { uploadImageToCloudinary } from './utils/uploadImage';
import { sampleData } from './utils/sampleData';
import ConfirmModal from './components/ConfirmModal';
import { PreviewPanel } from './components/PreviewPanel';
import { LivePreview } from './components/LivePreview';
import { ProductLookupResult, LabelElement } from '../types/label.types';

export function BarcodeDesign() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('id');
  const designer = useDesignerState(templateId || undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string> | null>(null);

  const [showClearModal, setShowClearModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const nudgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!designer.isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [designer.isDirty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        designer.undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'Z' && e.shiftKey))) {
        e.preventDefault();
        designer.redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (designer.state.selectedIds.length > 0) {
          e.preventDefault();
          designer.deleteElements(designer.state.selectedIds);
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        designer.selectAll();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        designer.clearSelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (designer.state.selectedIds.length > 0) {
          designer.duplicateElements(designer.state.selectedIds);
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (designer.state.selectedIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 1 : 0.1;
          
          const updates = designer.state.selectedIds.map(id => {
            const el = designer.state.elements.find(e => e.id === id);
            if (!el || el.locked) return null;
            const changes: any = {};
            if (e.key === 'ArrowUp') changes.y = el.y - step;
            if (e.key === 'ArrowDown') changes.y = el.y + step;
            if (e.key === 'ArrowLeft') changes.x = el.x - step;
            if (e.key === 'ArrowRight') changes.x = el.x + step;
            return { id, changes };
          }).filter(Boolean) as { id: string; changes: any }[];

          if (updates.length > 0) {
            designer.batchUpdateElements(updates, true);
            if (nudgeTimeoutRef.current) {
              clearTimeout(nudgeTimeoutRef.current);
            }
            nudgeTimeoutRef.current = setTimeout(() => {
              designer.commitHistory();
            }, 500);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (nudgeTimeoutRef.current) clearTimeout(nudgeTimeoutRef.current);
    };
  }, [designer]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const templateDataToRender = {
        name: designer.state.templateName || "Untitled Template",
        settings: designer.state.settings,
        layoutJson: designer.state.elements,
        backgroundImageUrl: designer.state.backgroundImageUrl,
      };

      const templateData = {
        ...templateDataToRender,
      };

      if (designer.state.templateId) {
        await labelService.updateTemplate(designer.state.templateId, templateData);
        toast.success("Template updated successfully");
      } else {
        const newTemplate = await labelService.createTemplate(templateData);
        designer.setIsDirty(false);
        toast.success("Template created successfully");
        router.replace(`/dashboard/labels/designer?id=${newTemplate.id}`);
      }
      designer.setIsDirty(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setShowClearModal(true);
  };

  const handleBack = () => {
    if (designer.isDirty) {
      setShowBackModal(true);
    } else {
      router.push('/dashboard/labels/designer');
    }
  };

  const handleDistributeVertically = () => {
    const { selectedIds, elements } = designer.state;
    const selectedEls = elements.filter(el => selectedIds.includes(el.id));
    if (selectedEls.length < 3) return;

    // Group elements into rows based on Y position (allow 2mm variance)
    const sortedByY = [...selectedEls].sort((a, b) => a.y - b.y);
    const rows: LabelElement[][] = [];
    
    for (const el of sortedByY) {
      if (rows.length === 0) {
        rows.push([el]);
      } else {
        const currentRow = rows[rows.length - 1];
        const rowAvgY = currentRow.reduce((sum, e) => sum + e.y, 0) / currentRow.length;
        if (Math.abs(el.y - rowAvgY) < 2) {
          currentRow.push(el);
        } else {
          rows.push([el]);
        }
      }
    }

    if (rows.length < 3) {
      toast.error("Please select elements across at least 3 rows to distribute space.");
      return;
    }

    const rowBounds = rows.map(row => {
      const top = Math.min(...row.map(e => e.y));
      const bottom = Math.max(...row.map(e => e.y + e.height));
      return { top, bottom, height: bottom - top, elements: row };
    });

    const topRow = rowBounds[0];
    const bottomRow = rowBounds[rowBounds.length - 1];

    const totalSpace = bottomRow.top - (topRow.top + topRow.height);
    const middleRows = rowBounds.slice(1, -1);
    const totalMiddleHeights = middleRows.reduce((sum, r) => sum + r.height, 0);

    const gapCount = rowBounds.length - 1;
    const gap = (totalSpace - totalMiddleHeights) / gapCount;

    const updates: { id: string; changes: { y: number } }[] = [];
    let currentY = topRow.top + topRow.height + gap;

    for (const row of middleRows) {
      const deltaY = currentY - row.top;
      for (const el of row.elements) {
        updates.push({ id: el.id, changes: { y: el.y + deltaY } });
      }
      currentY += row.height + gap;
    }

    if (updates.length > 0) {
      designer.batchUpdateElements(updates, false);
    }
  };

  const selectedElementId = designer.state.selectedIds.length === 1 ? designer.state.selectedIds[0] : null;

  return (
    <DashboardLayout title="Barcode Design">
      <div className="flex w-full h-[calc(100vh-4rem)] bg-brand-navy overflow-hidden font-sans">
        {!designer.state.previewSampleData && (
          <Toolbox 
            elements={designer.state.elements} 
            selectedIds={designer.state.selectedIds}
            onAddElement={designer.addElement} 
            onDistributeVertically={handleDistributeVertically}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <TopToolbar
            zoom={designer.state.zoom}
            setZoom={designer.setZoom}
            canUndo={designer.canUndo}
            canRedo={designer.canRedo}
            undo={designer.undo}
            redo={designer.redo}
            previewSampleData={designer.state.previewSampleData}
            togglePreview={designer.togglePreview}
            onSave={handleSave}
            onClear={handleClear}
            isSaving={isSaving}
            templateName={designer.state.templateName}
            updateTemplateName={designer.updateTemplateName}
            onBack={handleBack}
          />

          <DesignCanvas
            settings={designer.state.settings}
            elements={designer.state.elements}
            selectedElementId={designer.state.previewSampleData ? null : selectedElementId}
            selectedIds={designer.state.previewSampleData ? [] : designer.state.selectedIds}
            zoom={designer.state.zoom}
            previewSampleData={designer.state.previewSampleData}
            previewData={designer.state.previewSampleData ? (previewData || sampleData) : null}
            backgroundImageUrl={designer.state.backgroundImageUrl}
            onSelect={designer.selectElement}
            onToggleSelect={designer.toggleSelect}
            onSetSelection={designer.setSelection}
            onUpdateElement={designer.updateElement}
            onBatchUpdateElements={designer.batchUpdateElements}
            commitHistory={designer.commitHistory}
          />
        </div>

        {designer.state.previewSampleData ? (
          <PreviewPanel onSelectData={setPreviewData} />
        ) : (
          <PropertiesPanel
            settings={designer.state.settings}
            updateSettings={designer.updateSettings}
            backgroundImageUrl={designer.state.backgroundImageUrl}
            setBackgroundImageUrl={designer.setBackgroundImageUrl}
            selectedElement={designer.state.elements.find(e => e.id === selectedElementId)}
            selectedIds={designer.state.selectedIds}
            allElements={designer.state.elements}
            updateElement={designer.updateElement}
            onBatchUpdateElements={designer.batchUpdateElements}
            onDeleteElements={designer.deleteElements}
            onDuplicateElements={designer.duplicateElements}
            deleteElement={designer.deleteElement}
            duplicateElement={designer.duplicateElement}
            bringForward={designer.bringForward}
            sendBackward={designer.sendBackward}
            bringToFront={designer.bringToFront}
            sendToBack={designer.sendToBack}
            commitHistory={designer.commitHistory}
          />
        )}
      </div>

      <ConfirmModal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={() => designer.clearCanvas()}
        title="Clear Canvas"
        description="Are you sure you want to clear the canvas? You can undo this with Ctrl+Z."
      />

      <ConfirmModal
        open={showBackModal}
        onClose={() => setShowBackModal(false)}
        onConfirm={() => router.push('/dashboard/labels/designer')}
        title="Discard Unsaved Changes?"
        description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmLabel="Discard Changes"
      />
    </DashboardLayout>
  );
}

