import { useState, useEffect, useRef, useCallback } from "react";

const DEBOUNCE_MS = 300;

/**
 * Generic localStorage form persistence hook.
 *
 * - Loads saved draft on mount (falls back to initialState on corrupt/missing data)
 * - Debounce-writes to localStorage on every state change
 * - Flushes immediately on unmount and tab switch to prevent data loss
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
        return { ...initialState, ...parsed };
      }
    } catch {
      try { localStorage.removeItem(storageKey); } catch {}
    }
    return initialState;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const formRef = useRef(form);
  formRef.current = form;

  const flushToStorage = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(formRef.current));
    } catch {}
  }, [storageKey]);

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
      timerRef.current = null;
    }, DEBOUNCE_MS);
    // On unmount: flush immediately instead of discarding
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        try {
          localStorage.setItem(storageKey, JSON.stringify(formRef.current));
        } catch {}
      }
    };
  }, [form, storageKey]);

  // Flush on tab switch / page hide AND beforeunload
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushToStorage();
      }
    };
    const onBeforeUnload = () => {
      flushToStorage();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      // Final flush on hook teardown (component unmount / navigation)
      flushToStorage();
    };
  }, [flushToStorage]);

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
        if (dbVal != null && JSON.stringify(currentVal) === JSON.stringify(initVal)) {
          merged[key] = dbVal as T[typeof key];
        }
      }
      return merged;
    });
  }, [initialState]);

  return { form, setForm, updateField, clearDraft, mergeDefaults };
}
