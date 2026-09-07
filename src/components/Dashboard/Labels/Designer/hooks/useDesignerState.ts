import { useReducer, useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { DesignerState, LabelElement, CanvasSettings, LabelTemplate } from '../../types/label.types';
import { labelService } from '../../services/label.service';
import { toast } from 'sonner';

const MAX_HISTORY = 50;

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
  selectedIds: [],
  zoom: 1.0,
  previewSampleData: true,
};

type Snapshot = {
  settings: CanvasSettings;
  elements: LabelElement[];
  backgroundImageUrl: string | null;
  selectedIds: string[];
};

type ReducerState = {
  current: DesignerState;
  history: Snapshot[];
  historyIndex: number;
};

type Action =
  | { type: 'LOAD_TEMPLATE'; payload: DesignerState }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'UPDATE_TEMPLATE_NAME'; payload: string }
  | { type: 'SET_TEMPLATE_ID'; payload: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'UPDATE_STATE_NO_HISTORY'; payload: (prev: DesignerState) => DesignerState }
  | { type: 'UPDATE_STATE_WITH_HISTORY'; payload: (prev: DesignerState) => DesignerState }
  | { type: 'COMMIT_HISTORY' };

function snapshotOf(state: DesignerState): Snapshot {
  return {
    settings: state.settings,
    elements: state.elements,
    backgroundImageUrl: state.backgroundImageUrl,
    selectedIds: state.selectedIds,
  };
}

function pushHistory(state: ReducerState, newCurrent: DesignerState): ReducerState {
  const newSnapshot = snapshotOf(newCurrent);
  const slicedHistory = state.history.slice(0, state.historyIndex + 1);
  
  slicedHistory.push(newSnapshot);
  
  if (slicedHistory.length > MAX_HISTORY) {
    slicedHistory.shift();
  }
  
  return {
    current: newCurrent,
    history: slicedHistory,
    historyIndex: slicedHistory.length - 1,
  };
}

function designerReducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case 'LOAD_TEMPLATE': {
      const newState = action.payload;
      return {
        current: newState,
        history: [snapshotOf(newState)],
        historyIndex: 0,
      };
    }
    case 'SET_ZOOM': {
      return { ...state, current: { ...state.current, zoom: action.payload } };
    }
    case 'TOGGLE_PREVIEW': {
      return { ...state, current: { ...state.current, previewSampleData: !state.current.previewSampleData } };
    }
    case 'UPDATE_TEMPLATE_NAME': {
      return { ...state, current: { ...state.current, templateName: action.payload } };
    }
    case 'SET_TEMPLATE_ID': {
      return { ...state, current: { ...state.current, templateId: action.payload } };
    }
    case 'UPDATE_STATE_NO_HISTORY': {
      return { ...state, current: action.payload(state.current) };
    }
    case 'UPDATE_STATE_WITH_HISTORY': {
      const nextCurrent = action.payload(state.current);
      return pushHistory(state, nextCurrent);
    }
    case 'COMMIT_HISTORY': {
      const currentSnap = snapshotOf(state.current);
      const lastSnap = state.history[state.historyIndex];
      if (JSON.stringify(currentSnap) === JSON.stringify(lastSnap)) {
        return state;
      }
      return pushHistory(state, state.current);
    }
    case 'UNDO': {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        const pastState = state.history[newIndex];
        
        const validIds = new Set(pastState.elements.map(e => e.id));
        const restoredSelectedIds = pastState.selectedIds.filter(id => validIds.has(id));

        return {
          ...state,
          historyIndex: newIndex,
          current: {
            ...state.current,
            settings: pastState.settings,
            elements: pastState.elements,
            backgroundImageUrl: pastState.backgroundImageUrl,
            selectedIds: restoredSelectedIds,
          },
        };
      }
      return state;
    }
    case 'REDO': {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        const futureState = state.history[newIndex];
        
        const validIds = new Set(futureState.elements.map(e => e.id));
        const restoredSelectedIds = futureState.selectedIds.filter(id => validIds.has(id));

        return {
          ...state,
          historyIndex: newIndex,
          current: {
            ...state.current,
            settings: futureState.settings,
            elements: futureState.elements,
            backgroundImageUrl: futureState.backgroundImageUrl,
            selectedIds: restoredSelectedIds,
          },
        };
      }
      return state;
    }
    default:
      return state;
  }
}

export function useDesignerState(initialTemplateId?: string | null) {
  const [state, dispatch] = useReducer(designerReducer, {
    current: INITIAL_STATE,
    history: [snapshotOf(INITIAL_STATE)],
    historyIndex: 0,
  });

  const savedIndexRef = useRef(0);
  const [forceDirty, setForceDirty] = useState(false);

  const isDirty = forceDirty || state.historyIndex !== savedIndexRef.current;

  useEffect(() => {
    let active = true;

    if (initialTemplateId && initialTemplateId !== 'new') {
      if (isDirty) return;

      labelService.getTemplateById(initialTemplateId).then((res) => {
        if (!active) return;
        if (res) {
          const loadedState: DesignerState = {
            ...INITIAL_STATE,
            templateId: res.id || null,
            templateName: res.name,
            backgroundImageUrl: res.backgroundImageUrl || null,
            settings: {
              ...DEFAULT_SETTINGS,
              ...res.settings,
              colorMode: res.settings.colorMode ?? 'color',
            },
            elements: res.layoutJson as LabelElement[],
          };
          dispatch({ type: 'LOAD_TEMPLATE', payload: loadedState });
          savedIndexRef.current = 0;
          setForceDirty(false);
        }
      }).catch((err) => {
        if (!active) return;
        console.error("Failed to load template", err);
        toast.error("Failed to load template");
      });
    }

    return () => {
      active = false;
    };
  }, [initialTemplateId, isDirty]);

  const commitHistory = useCallback(() => {
    dispatch({ type: 'COMMIT_HISTORY' });
  }, []);

  const addElement = useCallback((element: LabelElement) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => ({
        ...prev,
        elements: [...prev.elements, element],
        selectedIds: [element.id],
      }),
    });
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<LabelElement>, skipHistory = false) => {
    dispatch({
      type: skipHistory ? 'UPDATE_STATE_NO_HISTORY' : 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === id ? { ...el, ...updates } as LabelElement : el)),
      }),
    });
  }, []);

  const deleteElement = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => ({
        ...prev,
        elements: prev.elements.filter((el) => el.id !== id),
        selectedIds: prev.selectedIds.filter(selectedId => selectedId !== id),
      }),
    });
  }, []);

  const duplicateElement = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => {
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
          selectedIds: [newElement.id],
        };
      }
    });
  }, []);

  const selectElement = useCallback((id: string | null) => {
    dispatch({
      type: 'UPDATE_STATE_NO_HISTORY',
      payload: (prev) => ({ ...prev, selectedIds: id ? [id] : [] })
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE_STATE_NO_HISTORY',
      payload: (prev) => ({
        ...prev,
        selectedIds: prev.selectedIds.includes(id)
          ? prev.selectedIds.filter(sid => sid !== id)
          : [...prev.selectedIds, id]
      })
    });
  }, []);

  const setSelection = useCallback((ids: string[]) => {
    dispatch({
      type: 'UPDATE_STATE_NO_HISTORY',
      payload: (prev) => ({ ...prev, selectedIds: ids })
    });
  }, []);

  const selectAll = useCallback(() => {
    dispatch({
      type: 'UPDATE_STATE_NO_HISTORY',
      payload: (prev) => ({
        ...prev,
        selectedIds: prev.elements.filter(el => !el.locked).map(el => el.id)
      })
    });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({
      type: 'UPDATE_STATE_NO_HISTORY',
      payload: (prev) => ({ ...prev, selectedIds: [] })
    });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: Math.max(1.0, Math.min(3.0, zoom)) });
  }, []);

  const togglePreview = useCallback(() => {
    dispatch({ type: 'TOGGLE_PREVIEW' });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<CanvasSettings>) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => {
        const currentWidth = prev.settings.widthMm;
        const currentHeight = prev.settings.heightMm;
        let newElements = prev.elements;
        
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
      }
    });
  }, []);

  const updateTemplateName = useCallback((name: string) => {
    dispatch({ type: 'UPDATE_TEMPLATE_NAME', payload: name });
    setForceDirty(true);
  }, []);

  const setBackgroundImageUrl = useCallback((url: string | null) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => ({ ...prev, backgroundImageUrl: url })
    });
  }, []);

  const setTemplateId = useCallback((id: string) => {
    dispatch({ type: 'SET_TEMPLATE_ID', payload: id });
  }, []);

  const bringForward = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => {
        let elements = prev.elements.map(e => ({...e})).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        const index = elements.findIndex(el => el.id === id);
        if (index !== -1 && index < elements.length - 1) {
          const el = elements[index];
          elements.splice(index, 1);
          elements.splice(index + 1, 0, el);
          elements = elements.map((e, i) => ({ ...e, zIndex: i }));
        }
        return { ...prev, elements };
      }
    });
  }, []);

  const sendBackward = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => {
        let elements = prev.elements.map(e => ({...e})).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        const index = elements.findIndex(el => el.id === id);
        if (index > 0) {
          const el = elements[index];
          elements.splice(index, 1);
          elements.splice(index - 1, 0, el);
          elements = elements.map((e, i) => ({ ...e, zIndex: i }));
        }
        return { ...prev, elements };
      }
    });
  }, []);

  const bringToFront = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => {
        let elements = prev.elements.map(e => ({...e})).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        const index = elements.findIndex(el => el.id === id);
        if (index !== -1 && index < elements.length - 1) {
          const el = elements[index];
          elements.splice(index, 1);
          elements.push(el);
          elements = elements.map((e, i) => ({ ...e, zIndex: i }));
        }
        return { ...prev, elements };
      }
    });
  }, []);

  const sendToBack = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => {
        let elements = prev.elements.map(e => ({...e})).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        const index = elements.findIndex(el => el.id === id);
        if (index > 0) {
          const el = elements[index];
          elements.splice(index, 1);
          elements.unshift(el);
          elements = elements.map((e, i) => ({ ...e, zIndex: i }));
        }
        return { ...prev, elements };
      }
    });
  }, []);

  const clearCanvas = useCallback(() => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => ({
        ...prev,
        elements: [],
        selectedIds: []
      })
    });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const batchUpdateElements = useCallback((updates: { id: string; changes: Partial<LabelElement> }[], skipHistory = false) => {
    dispatch({
      type: skipHistory ? 'UPDATE_STATE_NO_HISTORY' : 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => {
        const updateMap = new Map(updates.map(u => [u.id, u.changes]));
        return {
          ...prev,
          elements: prev.elements.map(el => {
            if (updateMap.has(el.id)) {
              return { ...el, ...updateMap.get(el.id) } as LabelElement;
            }
            return el;
          })
        };
      }
    });
  }, []);

  const deleteElements = useCallback((ids: string[]) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => ({
        ...prev,
        elements: prev.elements.filter((el) => !ids.includes(el.id)),
        selectedIds: prev.selectedIds.filter(selectedId => !ids.includes(selectedId)),
      }),
    });
  }, []);

  const duplicateElements = useCallback((ids: string[]) => {
    dispatch({
      type: 'UPDATE_STATE_WITH_HISTORY',
      payload: (prev) => {
        const elsToDuplicate = prev.elements.filter((el) => ids.includes(el.id));
        if (elsToDuplicate.length === 0) return prev;
        
        let highestZ = prev.elements.length > 0 ? Math.max(...prev.elements.map(e => e.zIndex || 0)) : -1;
        
        const newElements = elsToDuplicate.map(el => {
          highestZ++;
          return {
            ...el,
            id: crypto.randomUUID(),
            x: el.x + 5,
            y: el.y + 5,
            zIndex: highestZ
          };
        });
        
        return {
          ...prev,
          elements: [...prev.elements, ...newElements],
          selectedIds: newElements.map(e => e.id),
        };
      }
    });
  }, []);

  return useMemo(() => ({
    state: state.current,
    isDirty,
    setIsDirty: (dirty: boolean) => {
      if (!dirty) {
        savedIndexRef.current = state.historyIndex;
        setForceDirty(false);
      } else {
        setForceDirty(true);
      }
    },
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    batchUpdateElements,
    deleteElements,
    duplicateElements,
    selectElement,
    toggleSelect,
    setSelection,
    selectAll,
    clearSelection,
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
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
  }), [
    state.current,
    isDirty,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    batchUpdateElements,
    deleteElements,
    duplicateElements,
    selectElement,
    toggleSelect,
    setSelection,
    selectAll,
    clearSelection,
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
    state.historyIndex,
    state.history.length,
  ]);
}
