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
import { ProductLookupResult } from '../types/label.types';

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
        if (designer.state.selectedElementId) {
          e.preventDefault();
          designer.deleteElement(designer.state.selectedElementId);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        designer.selectElement(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (designer.state.selectedElementId) {
          designer.duplicateElement(designer.state.selectedElementId);
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const id = designer.state.selectedElementId;
        if (id) {
          const el = designer.state.elements.find((e) => e.id === id);
          if (el && !el.locked) {
            e.preventDefault();
            const step = e.shiftKey ? 1 : 0.1;
            const updates: any = {};
            if (e.key === 'ArrowUp') updates.y = el.y - step;
            if (e.key === 'ArrowDown') updates.y = el.y + step;
            if (e.key === 'ArrowLeft') updates.x = el.x - step;
            if (e.key === 'ArrowRight') updates.x = el.x + step;
            designer.updateElement(id, updates, true);
            
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



  return (
    <DashboardLayout title="Barcode Design">
      <div className="flex w-full h-[calc(100vh-4rem)] bg-brand-navy overflow-hidden font-sans">
        <Toolbox elements={designer.state.elements} onAddElement={designer.addElement} />

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
            selectedElementId={designer.state.selectedElementId}
            zoom={designer.state.zoom}
            previewSampleData={designer.state.previewSampleData}
            previewData={previewData}
            backgroundImageUrl={designer.state.backgroundImageUrl}
            onSelect={designer.selectElement}
            onUpdateElement={designer.updateElement}
            commitHistory={designer.commitHistory}
          />
        </div>

        {designer.state.previewSampleData ? (
          <PreviewPanel
            onSelectData={setPreviewData}
          />
        ) : (
          <PropertiesPanel
            settings={designer.state.settings}
            updateSettings={designer.updateSettings}
            backgroundImageUrl={designer.state.backgroundImageUrl}
            setBackgroundImageUrl={designer.setBackgroundImageUrl}
            selectedElement={designer.state.elements.find(e => e.id === designer.state.selectedElementId)}
            updateElement={designer.updateElement}
            deleteElement={designer.deleteElement}
            duplicateElement={designer.duplicateElement}
            bringForward={designer.bringForward}
            sendBackward={designer.sendBackward}
            bringToFront={designer.bringToFront}
            sendToBack={designer.sendToBack}
          />
        )}
      </div>

      <ConfirmModal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={() => designer.clearCanvas()}
        title="Clear Canvas"
        description="Are you sure you want to clear the canvas? This action cannot be undone."
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

