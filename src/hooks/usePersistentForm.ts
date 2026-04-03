import { useState, useEffect, useRef, useCallback } from "react";

const DEBOUNCE_MS = 300;

/**
 * Generic localStorage form persistence hook.
 *
 * - Loads saved draft on mount (falls back to initialState on corrupt/missing data)
 * - Debounce-writes to localStorage on every state change
 * - clearDraft() removes stored data (call after successful submit)
 * - SSR-safe: no-ops when localStorage is unavailable
 */
export function usePersistentForm<T extends Record<string, any>>(
  storageKey: string,
  initialState: T
) {
  const [form, setForm] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge: initialState keys as base, parsed overrides
        return { ...initialState, ...parsed };
      }
    } catch {
      // Corrupt data — remove it
      try { localStorage.removeItem(storageKey); } catch {}
    }
    return initialState;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  // Debounced write to localStorage on every change (skip initial mount)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(form));
      } catch {}
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form, storageKey]);

  // Also flush on tab switch / page hide
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        try { localStorage.setItem(storageKey, JSON.stringify(form)); } catch {}
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [form, storageKey]);

  const updateField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  /**
   * Merge external data (e.g. from DB) into the form, but only for fields
   * that are still at their initial/default value (i.e. user hasn't edited them
   * and there was no saved draft for that field).
   */
  const mergeDefaults = useCallback((dbData: Partial<T>) => {
    setForm((prev) => {
      const merged = { ...prev };
      for (const key of Object.keys(dbData) as (keyof T)[]) {
        const dbVal = dbData[key];
        const currentVal = prev[key];
        const initVal = initialState[key];
        // Only fill from DB if user hasn't changed the field from its initial value
        if (dbVal != null && JSON.stringify(currentVal) === JSON.stringify(initVal)) {
          merged[key] = dbVal as T[typeof key];
        }
      }
      return merged;
    });
  }, [initialState]);

  return { form, setForm, updateField, clearDraft, mergeDefaults };
}
