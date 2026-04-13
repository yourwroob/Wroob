import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useEmployerOnboardingStatus() {
  const { user, role } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== "employer") {
      setLoading(false);
      return;
    }

    supabase
      .from("employer_profiles")
      .select("onboarding_status, onboarding_step")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const d = data as any;
        if (d) {
          setStatus(d.onboarding_status);
          setStep(d.onboarding_step ?? 1);
        }
        setLoading(false);
      });
  }, [user, role]);

  const updateStep = async (newStep: number) => {
    if (!user) return;
    setStep(newStep);
    await supabase
      .from("employer_profiles")
      .update({ onboarding_step: newStep } as any)
      .eq("user_id", user.id);
  };

  // FIX (HIGH-employer-race): Mirror the HIGH-14 student fix.
  // Previously returned void — a failed DB write was silently ignored, leaving
  // onboarding_status as "pending" while the user was navigated to Done, causing
  // a redirect loop back to onboarding on next visit.
  const completeOnboarding = async (): Promise<{ error: any }> => {
    if (!user) return { error: null };
    setStatus("completed"); // optimistic update
    const { error } = await supabase
      .from("employer_profiles")
      .update({
        onboarding_status: "completed",
        onboarding_step: 6,
        onboarding_completed_at: new Date().toISOString(),
      } as any)
      .eq("user_id", user.id);
    if (error) setStatus(null); // revert on failure so caller can retry
    return { error };
  };

  return { status, step, loading, updateStep, completeOnboarding, needsOnboarding: status === "pending" };
}
