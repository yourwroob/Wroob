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

  const completeOnboarding = async () => {
    if (!user) return;
    setStatus("completed");
    await supabase
      .from("employer_profiles")
      .update({
        onboarding_status: "completed",
        onboarding_step: 3,
        onboarding_completed_at: new Date().toISOString(),
      } as any)
      .eq("user_id", user.id);
  };

  return { status, step, loading, updateStep, completeOnboarding, needsOnboarding: status === "pending" };
}
