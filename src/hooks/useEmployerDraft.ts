import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_PREFIX = "wroob_employer_draft_";
const AUTO_SAVE_INTERVAL = 5000;

/**
 * Hook that persists employer form data to localStorage on every change
 * and auto-saves to the database every 5 seconds (or on blur).
 *
 * - On mount: loads from localStorage first (preserves unsaved edits),
 *   then fills any empty fields from the DB.
 * - On every form change: writes to localStorage immediately.
 * - Every 5 seconds (if dirty): saves to the database silently.
 */
export function useEmployerDraft<T extends Record<string, string>>(
  stepKey: string,
  dbFields: (keyof T)[],
  initialState: T
) {
  const { user } = useAuth();
  const [form, setForm] = useState<T>(initialState);
  const [dbLoaded, setDbLoaded] = useState(false);
  const dirtyRef = useRef(false);
  const formRef = useRef(form);
  formRef.current = form;

  const storageKey = `${STORAGE_PREFIX}${stepKey}`;

  // Load: localStorage first, then fill gaps from DB
  useEffect(() => {
    if (!user) return;

    // 1. Restore from localStorage
    let localDraft: Partial<T> = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) localDraft = JSON.parse(raw);
    } catch {}

    // 2. Load from DB and merge
    supabase
      .from("employer_profiles")
      .select(dbFields.join(", "))
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        const merged = { ...initialState } as T;
        // DB values as base
        if (data) {
          for (const key of dbFields) {
            const k = key as string;
            if (data[k] != null) {
              merged[k as keyof T] = String(data[k]) as T[keyof T];
            }
          }
        }
        // localStorage overrides (only non-empty)
        for (const key of Object.keys(localDraft)) {
          const v = localDraft[key as keyof T];
          if (v !== undefined && v !== "") {
            merged[key as keyof T] = v as T[keyof T];
          }
        }
        setForm(merged);
        setDbLoaded(true);
      });
  }, [user]);

  // Persist to localStorage on every form change
  useEffect(() => {
    if (!dbLoaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify(form)); } catch {}
    dirtyRef.current = true;
    return () => {
      // Flush on unmount to prevent data loss during navigation
      try { localStorage.setItem(storageKey, JSON.stringify(formRef.current)); } catch {}
    };
  }, [form, dbLoaded, storageKey]);

  // Auto-save to DB every 5 seconds
  useEffect(() => {
    if (!user || !dbLoaded) return;

    const save = async () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      const payload: Record<string, any> = {};
      for (const key of dbFields) {
        const k = key as string;
        const v = formRef.current[k as keyof T];
        payload[k] = v === "" ? null : v;
      }
      await supabase
        .from("employer_profiles")
        .update(payload as any)
        .eq("user_id", user.id);
    };

    const interval = setInterval(save, AUTO_SAVE_INTERVAL);

    // Also save on visibility change (tab switch)
    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      // Final save on unmount
      save();
    };
  }, [user, dbLoaded, dbFields]);

  const update = useCallback((key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  // Call after successful "Continue" to clear the local draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    dirtyRef.current = false;
  }, [storageKey]);

  // Trigger immediate save (e.g. on blur)
  const saveNow = useCallback(async () => {
    if (!user || !dirtyRef.current) return;
    dirtyRef.current = false;
    const payload: Record<string, any> = {};
    for (const key of dbFields) {
      const k = key as string;
      const v = formRef.current[k as keyof T];
      payload[k] = v === "" ? null : v;
    }
    await supabase
      .from("employer_profiles")
      .update(payload as any)
      .eq("user_id", user.id);
  }, [user, dbFields]);

  return { form, update, clearDraft, saveNow, dbLoaded };
}
