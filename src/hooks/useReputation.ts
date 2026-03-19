import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ReputationData {
  reputation_score: number;
  breakdown: {
    internship_score: number;
    skill_score: number;
    feedback_score: number;
    profile_score: number;
  };
}

export function useReputation(studentId?: string) {
  const [data, setData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Use the edge function to get reputation data (works with service role, bypasses type issues)
      const { data: result, error: fnError } = await supabase.functions.invoke("student-reputation", {
        body: { action: "recalculate" },
      });

      if (fnError) {
        // Fallback: query directly with type cast
        const { data: sp } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", studentId)
          .maybeSingle();

        if (sp) {
          const raw = sp as any;
          setData({
            reputation_score: Number(raw.reputation_score || 0),
            breakdown: {
              internship_score: Math.min((raw.completed_internships || 0) * 10, 40),
              skill_score: Number(raw.skill_test_score || 0),
              feedback_score: Number(raw.company_feedback_score || 0),
              profile_score: Number(raw.profile_strength_score || 0),
            },
          });
        }
      } else if (result) {
        setData({
          reputation_score: Number(result.reputation_score || 0),
          breakdown: {
            internship_score: Math.min((result.completed_internships || 0) * 10, 40),
            skill_score: Number(result.skill_test_score || 0),
            feedback_score: Number(result.company_feedback_score || 0),
            profile_score: Number(result.profile_strength_score || 0),
          },
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const recalculate = useCallback(async () => {
    const { data: result, error } = await supabase.functions.invoke("student-reputation", {
      body: { action: "recalculate" },
    });
    if (!error && result) {
      setData({
        reputation_score: Number(result.reputation_score || 0),
        breakdown: {
          internship_score: Math.min((result.completed_internships || 0) * 10, 40),
          skill_score: Number(result.skill_test_score || 0),
          feedback_score: Number(result.company_feedback_score || 0),
          profile_score: Number(result.profile_strength_score || 0),
        },
      });
    }
    return { error };
  }, []);

  useEffect(() => {
    fetchReputation();
  }, [fetchReputation]);

  return { data, loading, error, recalculate, refetch: fetchReputation };
}
