import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useOnboardingStatus() {
  const { user, role } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== "student") {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("student_profiles")
        .select("onboarding_status, onboarding_step")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setStatus((data as any).onboarding_status);
        setStep((data as any).onboarding_step ?? 1);
      }
      setLoading(false);
    };

    fetch();
  }, [user, role]);

  // FIX (HIGH-updatestep-silent-fail): Capture the DB error and revert the
  // optimistic step update on failure. Previously the error was discarded and
  // the step advanced in React state while remaining stale in the DB, causing
  // a redirect loop back to the completed step on next login.
  const updateStep = async (newStep: number) => {
    if (!user) return;
    const prevStep = step;
    setStep(newStep); // optimistic
    const { error } = await supabase
      .from("student_profiles")
      .update({ onboarding_step: newStep } as any)
      .eq("user_id", user.id);
    if (error) setStep(prevStep); // revert on failure — prevents UI from advancing
  };

  // FIX (HIGH-14): Return the DB error so callers can detect failure.
  // Previously this returned void — a failed DB write was silently ignored,
  // leaving onboarding_status as "pending" while showing a success toast.
  const completeOnboarding = async (): Promise<{ error: any }> => {
    if (!user) return { error: null };
    setStatus("completed"); // optimistic update
    const { error } = await supabase
      .from("student_profiles")
      .update({
        onboarding_status: "completed",
        onboarding_step: 4,
        onboarding_completed_at: new Date().toISOString(),
      } as any)
      .eq("user_id", user.id);
    if (error) setStatus(null); // revert on failure so caller can retry
    return { error };
  };

  return { status, step, loading, updateStep, completeOnboarding, needsOnboarding: status === "pending" };
}
