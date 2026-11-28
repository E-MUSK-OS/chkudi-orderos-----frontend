"use client";

import { useEffect } from "react";

/**
 * Globally clears a zero value ("0", "0.0", "0.00") when an editable
 * `<input type="number">` is focused, and restores "0" on blur if left empty.
 */
export default function GlobalNumberInputZeroBehavior() {
  useEffect(() => {
    const nativeValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== "number" || target.readOnly || target.disabled) return;

      const trimmed = target.value.trim();
      if (trimmed !== "" && Number(trimmed) === 0) {
        target.dataset.clearedZero = "1";
        target.dataset.prevZeroValue = trimmed;

        if (nativeValueSetter) {
          nativeValueSetter.call(target, "");
          target.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
          target.value = "";
        }

        // If a controlled React form coerces "" back to 0 onChange, keep the DOM input clear while focused
        requestAnimationFrame(() => {
          if (
            document.activeElement === target &&
            target.value.trim() !== "" &&
            Number(target.value) === 0
          ) {
            target.value = "";
          }
        });
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== "number" || target.readOnly || target.disabled) return;
      if (target.dataset.clearedZero !== "1") return;

      const restoreValue = target.dataset.prevZeroValue || "0";
      delete target.dataset.clearedZero;
      delete target.dataset.prevZeroValue;

      if (target.value.trim() === "") {
        if (nativeValueSetter) {
          nativeValueSetter.call(target, restoreValue);
          target.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
          target.value = restoreValue;
        }
      }
    };

    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("focusout", handleFocusOut, true);
    return () => {
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("focusout", handleFocusOut, true);
    };
  }, []);

  return null;
}
