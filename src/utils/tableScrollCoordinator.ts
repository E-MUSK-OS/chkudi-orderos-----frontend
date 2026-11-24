/**
 * Centralized table & page wheel scroll coordinator with hardware-accelerated smooth momentum.
 * 
 * Multi-level hierarchical smooth scroll coordination:
 * Level 1: Outer page scroll container (scrolls until Header Card & KPI cards dock)
 * Level 2: Primary table container (smoothly scrolls table rows internally)
 * Level 3: Inner nested scroll containers (e.g. sub-tables)
 * 
 * Features:
 * - Fluid hardware-accelerated exponential decay glide (~180ms decay).
 * - Multi-notch velocity accumulation (handles rapid wheel spins without stuttering).
 * - Distinguishes programmatic rAF updates from manual scrollbar thumb dragging.
 * - Handles tables with large datasets seamlessly without freezing.
 */

export interface CoordinateTableScrollParams {
  e: WheelEvent;
  scrollContainer: HTMLElement;
  tableContainer: HTMLElement | null;
  maxPageScroll?: number;
  isDocked?: boolean;
  minDesktopWidth?: number;
}

interface SmoothScrollState {
  current: number;
  target: number;
  max: number;
  rafId: number | null;
  lastTime: number;
  lastProgrammaticValue: number;
}

const scrollStates = new WeakMap<HTMLElement, SmoothScrollState>();

function getScrollState(el: HTMLElement, effectiveMax?: number): SmoothScrollState {
  let state = scrollStates.get(el);
  const realScrollTop = el.scrollTop;
  const maxScroll =
    typeof effectiveMax === "number"
      ? effectiveMax
      : Math.max(0, el.scrollHeight - el.clientHeight);

  if (!state) {
    state = {
      current: realScrollTop,
      target: realScrollTop,
      max: maxScroll,
      rafId: null,
      lastTime: 0,
      lastProgrammaticValue: realScrollTop,
    };
    scrollStates.set(el, state);

    // If user manually drags scrollbar thumb or uses keyboard, cancel rAF and re-sync
    el.addEventListener(
      "scroll",
      () => {
        if (!state) return;

        // If the scroll position matches the value our rAF loop just wrote, ignore it!
        if (Math.abs(el.scrollTop - state.lastProgrammaticValue) <= 1) {
          return;
        }

        // Real user interaction (e.g. scrollbar thumb drag)
        if (state.rafId !== null) {
          cancelAnimationFrame(state.rafId);
          state.rafId = null;
        }
        state.current = el.scrollTop;
        state.target = el.scrollTop;
        state.lastProgrammaticValue = el.scrollTop;
      },
      { passive: true }
    );
  } else {
    state.max = maxScroll;
    if (state.rafId === null && Math.abs(realScrollTop - state.current) > 3) {
      state.current = realScrollTop;
      state.target = realScrollTop;
      state.lastProgrammaticValue = realScrollTop;
    }
  }
  return state;
}

function startSmoothScroll(
  el: HTMLElement,
  state: SmoothScrollState,
  newTarget: number
): void {
  // Keep max fresh in case table rows expanded dynamically
  state.max = Math.max(0, el.scrollHeight - el.clientHeight);
  state.target = Math.max(0, Math.min(state.max, newTarget));

  if (state.rafId !== null) {
    // Already animating: target is updated, loop will glide toward it
    return;
  }

  state.current = el.scrollTop;
  state.lastTime = performance.now();

  const step = (time: number) => {
    const dt = Math.min(0.05, Math.max(0.001, (time - state.lastTime) / 1000));
    state.lastTime = time;

    const diff = state.target - state.current;
    if (Math.abs(diff) < 0.5) {
      state.current = state.target;
      state.lastProgrammaticValue = state.target;
      el.scrollTop = state.target;
      state.rafId = null;
      return;
    }

    // Exponential decay damping: lambda = 14 gives ~180ms smooth glide across 60Hz/120Hz/144Hz displays
    const factor = 1 - Math.exp(-14 * dt);
    state.current += diff * factor;
    const nextVal = Math.round(state.current);
    state.lastProgrammaticValue = nextVal;
    el.scrollTop = nextVal;

    state.rafId = requestAnimationFrame(step);
  };

  state.rafId = requestAnimationFrame(step);
}

function findScrollableElement(
  target: EventTarget | null,
  stopAt: HTMLElement | null
): HTMLElement | null {
  if (!target || !(target instanceof HTMLElement) || !stopAt) return null;
  let curr: HTMLElement | null = target;
  while (curr && curr !== stopAt && stopAt.contains(curr)) {
    if (curr.scrollHeight > curr.clientHeight + 4) {
      const style = window.getComputedStyle(curr);
      const overflowY = style.overflowY;
      if (overflowY === "auto" || overflowY === "scroll") {
        return curr;
      }
    }
    curr = curr.parentElement;
  }
  return null;
}

function applySmoothDownwardScroll(
  innerContainer: HTMLElement | null,
  tableContainer: HTMLElement | null,
  scrollContainer: HTMLElement,
  deltaY: number,
  effectiveMaxPageScroll: number
): void {
  let remainingDelta = deltaY;

  // 1. If outer page container has room to scroll down (docking the table)
  const pageState = getScrollState(scrollContainer, effectiveMaxPageScroll);
  if (pageState.max > 0 && pageState.target < pageState.max) {
    const room = pageState.max - pageState.target;
    if (remainingDelta <= room) {
      startSmoothScroll(scrollContainer, pageState, pageState.target + remainingDelta);
      return;
    } else {
      startSmoothScroll(scrollContainer, pageState, pageState.max);
      remainingDelta -= room;
    }
  }

  // 2. Inner nested container (e.g. variant table)
  if (innerContainer) {
    const innerState = getScrollState(innerContainer);
    if (innerState.max > 0 && innerState.target < innerState.max) {
      const room = innerState.max - innerState.target;
      if (remainingDelta <= room) {
        startSmoothScroll(innerContainer, innerState, innerState.target + remainingDelta);
        return;
      } else {
        startSmoothScroll(innerContainer, innerState, innerState.max);
        remainingDelta -= room;
      }
    }
  }

  // 3. Primary table container (scroll table rows smoothly)
  if (tableContainer) {
    const tableState = getScrollState(tableContainer);
    if (tableState.max > 0 && tableState.target < tableState.max) {
      const room = tableState.max - tableState.target;
      if (remainingDelta <= room) {
        startSmoothScroll(tableContainer, tableState, tableState.target + remainingDelta);
        return;
      } else {
        startSmoothScroll(tableContainer, tableState, tableState.max);
        remainingDelta -= room;
      }
    }
  }
}

function applySmoothUpwardScroll(
  innerContainer: HTMLElement | null,
  tableContainer: HTMLElement | null,
  scrollContainer: HTMLElement,
  deltaY: number, // negative value
  effectiveMaxPageScroll: number
): void {
  let remainingDelta = deltaY; // negative

  // 1. Inner nested container (e.g. variant table)
  if (innerContainer) {
    const innerState = getScrollState(innerContainer);
    if (innerState.target > 0) {
      const room = innerState.target; // positive
      if (Math.abs(remainingDelta) <= room) {
        startSmoothScroll(innerContainer, innerState, innerState.target + remainingDelta);
        return;
      } else {
        startSmoothScroll(innerContainer, innerState, 0);
        remainingDelta += room;
      }
    }
  }

  // 2. Primary table container (scroll table up to row 1)
  if (tableContainer) {
    const tableState = getScrollState(tableContainer);
    if (tableState.target > 0) {
      const room = tableState.target; // positive
      if (Math.abs(remainingDelta) <= room) {
        startSmoothScroll(tableContainer, tableState, tableState.target + remainingDelta);
        return;
      } else {
        startSmoothScroll(tableContainer, tableState, 0);
        remainingDelta += room;
      }
    }
  }

  // 3. Outer page container (reveals Header Card & KPI stats once table reaches row 1)
  const pageState = getScrollState(scrollContainer, effectiveMaxPageScroll);
  if (pageState.target > 0 && remainingDelta < 0) {
    startSmoothScroll(scrollContainer, pageState, pageState.target + remainingDelta);
  }
}

export function coordinateTableWheelScroll({
  e,
  scrollContainer,
  tableContainer,
  maxPageScroll,
  minDesktopWidth = 768,
}: CoordinateTableScrollParams): void {
  if (window.innerWidth < minDesktopWidth) return;

  // If scrolling horizontally more than vertically, do not intervene (e.g. trackpad horizontal column swipe)
  if (Math.abs(e.deltaY) < 1 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    return;
  }

  // Normalize delta across browsers and mouse devices
  let deltaY = e.deltaY;
  if (e.deltaMode === 1) {
    deltaY *= 33; // DOM_DELTA_LINE
  } else if (e.deltaMode === 2) {
    deltaY *= window.innerHeight || 800; // DOM_DELTA_PAGE
  }

  const effectiveMaxPageScroll =
    typeof maxPageScroll === "number"
      ? maxPageScroll
      : Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);

  const isOverTable =
    tableContainer &&
    (e.composedPath().includes(tableContainer) ||
      tableContainer.contains(e.target as Node));

  // Find if cursor is over a nested inner scroll container (e.g. variant table)
  const innerContainer =
    isOverTable && tableContainer
      ? findScrollableElement(e.target, tableContainer)
      : null;

  if (deltaY > 0) {
    // ==================================================================
    // SCROLLING DOWN (wheel downwards)
    // ==================================================================
    e.preventDefault();
    applySmoothDownwardScroll(
      innerContainer,
      tableContainer,
      scrollContainer,
      deltaY,
      effectiveMaxPageScroll
    );
  } else if (deltaY < 0) {
    // ==================================================================
    // SCROLLING UP (wheel upwards)
    // ==================================================================
    e.preventDefault();
    applySmoothUpwardScroll(
      innerContainer,
      tableContainer,
      scrollContainer,
      deltaY,
      effectiveMaxPageScroll
    );
  }
}
