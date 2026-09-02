import { useState, useCallback, useEffect } from 'react';
import { DesignerState, LabelElement, CanvasSettings, LabelTemplate } from '../../types/label.types';
import { labelService } from '../../services/label.service';
import { toast } from 'sonner';

const MAX_HISTORY = 30;

const DEFAULT_SETTINGS: CanvasSettings = {
  widthMm: 100,
  heightMm: 50,
  dpi: 203,
  orientation: 'landscape',
  gridSizeMm: 1,
  snapToGrid: true,
  colorMode: 'color', // default: full color
};

const INITIAL_STATE: DesignerState = {
  templateId: null,
  templateName: 'Untitled Template',
  backgroundImageUrl: null,
  settings: DEFAULT_SETTINGS,
  elements: [],
  selectedElementId: null,
  zoom: 1.0,
  previewSampleData: true,
};

export function useDesignerState(initialTemplateId?: string | null) {
  const [state, setState] = useState<DesignerState>(INITIAL_STATE);
  const [isDirty, setIsDirty] = useState(false);
  
  // History tracking (excluding zoom and selectedElementId for undo/redo logic)
  const [history, setHistory] = useState<{ settings: CanvasSettings; elements: LabelElement[] }[]>([
    { settings: INITIAL_STATE.settings, elements: INITIAL_STATE.elements }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (initialTemplateId && initialTemplateId !== 'new') {
      labelService.getTemplateById(initialTemplateId).then((res) => {
        if (res) {
          const loadedState: DesignerState = {
            ...INITIAL_STATE,
            templateId: res.id || null,
            templateName: res.name,
            backgroundImageUrl: res.backgroundImageUrl || null,
            settings: {
              ...DEFAULT_SETTINGS,
              ...res.settings,
              // Existing templates saved before colorMode was added won't have this field.
              // Default them to 'color' so they print in full color.
              colorMode: res.settings.colorMode ?? 'color',
            },
            elements: res.layoutJson as LabelElement[],
          };
          setState(loadedState);
          setHistory([{ settings: loadedState.settings, elements: loadedState.elements }]);
          setHistoryIndex(0);
          setIsDirty(false);
        }
      }).catch((err) => {
        console.error("Failed to load template", err);
        toast.error("Failed to load template");
      });
    }
  }, [initialTemplateId]);

  const saveHistory = useCallback((newState: DesignerState) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ settings: newState.settings, elements: newState.elements });
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  const updateStateAndHistory = useCallback((updater: (prev: DesignerState) => DesignerState, skipHistory = false) => {
    setState((prev) => {
      const nextState = updater(prev);
      if (!skipHistory) {
        saveHistory(nextState);
        setIsDirty(true);
      }
      return nextState;
    });
  }, [saveHistory]);

  const commitHistory = useCallback(() => {
    setState(prev => {
      saveHistory(prev);
      setIsDirty(true);
      return prev;
    });
  }, [saveHistory]);

  const addElement = useCallback((element: LabelElement) => {
    updateStateAndHistory((prev) => ({
      ...prev,
      elements: [...prev.elements, element],
      selectedElementId: element.id,
    }));
  }, [updateStateAndHistory]);

  const updateElement = useCallback((id: string, updates: Partial<LabelElement>, skipHistory = false) => {
    updateStateAndHistory((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, ...updates } as LabelElement : el)),
    }), skipHistory);
  }, [updateStateAndHistory]);

  const deleteElement = useCallback((id: string) => {
    updateStateAndHistory((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
      selectedElementId: prev.selectedElementId === id ? null : prev.selectedElementId,
    }));
  }, [updateStateAndHistory]);

  const duplicateElement = useCallback((id: string) => {
    updateStateAndHistory((prev) => {
      const elToDuplicate = prev.elements.find((el) => el.id === id);
      if (!elToDuplicate) return prev;
      
      const highestZ = prev.elements.length > 0 ? Math.max(...prev.elements.map(e => e.zIndex || 0)) : -1;
      
      const newElement = { 
        ...elToDuplicate, 
        id: crypto.randomUUID(), 
        x: elToDuplicate.x + 5, 
        y: elToDuplicate.y + 5,
        zIndex: highestZ + 1
      };
      
      return {
        ...prev,
        elements: [...prev.elements, newElement],
        selectedElementId: newElement.id,
      };
    });
  }, [updateStateAndHistory]);

  const selectElement = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedElementId: id }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, zoom: Math.max(1.0, Math.min(3.0, zoom)) }));
  }, []);

  const togglePreview = useCallback(() => {
    setState((prev) => ({ ...prev, previewSampleData: !prev.previewSampleData }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<CanvasSettings>) => {
    updateStateAndHistory((prev) => {
      const currentWidth = prev.settings.widthMm;
      const currentHeight = prev.settings.heightMm;
      let newElements = prev.elements;
      
      // If width or height is changing, scale elements
      if (
        (newSettings.widthMm !== undefined && newSettings.widthMm !== currentWidth) ||
        (newSettings.heightMm !== undefined && newSettings.heightMm !== currentHeight)
      ) {
        const targetWidth = newSettings.widthMm ?? currentWidth;
        const targetHeight = newSettings.heightMm ?? currentHeight;
        
        const safeTargetWidth = Math.max(1, targetWidth);
        const safeTargetHeight = Math.max(1, targetHeight);
        const safeCurrentWidth = Math.max(1, currentWidth);
        const safeCurrentHeight = Math.max(1, currentHeight);
        
        const scaleX = safeTargetWidth / safeCurrentWidth;
        const scaleY = safeTargetHeight / safeCurrentHeight;
        
        newElements = prev.elements.map(el => {
          const scaledEl = { ...el };
          scaledEl.x = el.x * scaleX;
          scaledEl.y = el.y * scaleY;
          scaledEl.width = el.width * scaleX;
          scaledEl.height = el.height * scaleY;
          
          if (scaledEl.type === 'text') {
             // scale font size by the smaller ratio to keep it fitting
             scaledEl.fontSize = Math.max(4, Math.round((scaledEl.fontSize || 12) * Math.min(scaleX, scaleY)));
          }
          return scaledEl;
        });
      }

      return {
        ...prev,
        settings: { ...prev.settings, ...newSettings },
        elements: newElements,
      };
    });
  }, [updateStateAndHistory]);

  const updateTemplateName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, templateName: name }));
    setIsDirty(true);
  }, []);

  const setBackgroundImageUrl = useCallback((url: string | null) => {
    updateStateAndHistory((prev) => ({ ...prev, backgroundImageUrl: url }));
  }, [updateStateAndHistory]);

  const setTemplateId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, templateId: id }));
  }, []);

  const bringForward = useCallback((id: string) => {
    updateStateAndHistory((prev) => {
      let elements = prev.elements.map(e => ({...e})).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const index = elements.findIndex(el => el.id === id);
      if (index !== -1 && index < elements.length - 1) {
        const el = elements[index];
        elements.splice(index, 1);
        elements.splice(index + 1, 0, el);
        elements = elements.map((e, i) => ({ ...e, zIndex: i }));
      }
      return { ...prev, elements };
    });
  }, [updateStateAndHistory]);

  const sendBackward = useCallback((id: string) => {
    updateStateAndHistory((prev) => {
      let elements = prev.elements.map(e => ({...e})).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const index = elements.findIndex(el => el.id === id);
      if (index > 0) {
        const el = elements[index];
        elements.splice(index, 1);
        elements.splice(index - 1, 0, el);
        elements = elements.map((e, i) => ({ ...e, zIndex: i }));
      }
      return { ...prev, elements };
    });
  }, [updateStateAndHistory]);

  const bringToFront = useCallback((id: string) => {
    updateStateAndHistory((prev) => {
      let elements = prev.elements.map(e => ({...e})).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const index = elements.findIndex(el => el.id === id);
      if (index !== -1 && index < elements.length - 1) {
        const el = elements[index];
        elements.splice(index, 1);
        elements.push(el);
        elements = elements.map((e, i) => ({ ...e, zIndex: i }));
      }
      return { ...prev, elements };
    });
  }, [updateStateAndHistory]);

  const sendToBack = useCallback((id: string) => {
    updateStateAndHistory((prev) => {
      let elements = prev.elements.map(e => ({...e})).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const index = elements.findIndex(el => el.id === id);
      if (index > 0) {
        const el = elements[index];
        elements.splice(index, 1);
        elements.unshift(el);
        elements = elements.map((e, i) => ({ ...e, zIndex: i }));
      }
      return { ...prev, elements };
    });
  }, [updateStateAndHistory]);

  const clearCanvas = useCallback(() => {
    updateStateAndHistory((prev) => ({
      ...prev,
      elements: [],
      selectedElementId: null
    }));
  }, [updateStateAndHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const pastState = history[newIndex];
      setState((prev) => ({
        ...prev,
        settings: pastState.settings,
        elements: pastState.elements,
        selectedElementId: null, // Clear selection on undo
      }));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const futureState = history[newIndex];
      setState((prev) => ({
        ...prev,
        settings: futureState.settings,
        elements: futureState.elements,
        selectedElementId: null, // Clear selection on redo
      }));
    }
  }, [history, historyIndex]);

  return {
    state,
    isDirty,
    setIsDirty,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    selectElement,
    setZoom,
    updateSettings,
    updateTemplateName,
    setBackgroundImageUrl,
    setTemplateId,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    clearCanvas,
    togglePreview,
    undo,
    redo,
    commitHistory,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
