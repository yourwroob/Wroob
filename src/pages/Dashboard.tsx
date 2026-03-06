import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const STUDENT_STEP_ROUTES = [
  "/onboarding/profile",
  "/onboarding/preferences",
  "/onboarding/culture",
  "/onboarding/resume",
  "/onboarding/done",
];

const EMPLOYER_STEP_ROUTES = [
  "/employer/onboarding/company",
  "/employer/onboarding/details",
  "/employer/onboarding/verify",
  "/employer/onboarding/team",
  "/employer/onboarding/done",
];

const Dashboard = () => {
  const { user, role, loading } = useAuth();
  const [onboardingCheck, setOnboardingCheck] = useState<"loading" | "needs" | "done">("loading");
  const [onboardingRoute, setOnboardingRoute] = useState("");

  useEffect(() => {
    if (loading || !user) return;

    if (role === "student") {
      supabase
        .from("student_profiles")
        .select("onboarding_status, onboarding_step")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          const d = data as any;
          if (d && d.onboarding_status !== "completed") {
            const step = Math.min(Math.max((d.onboarding_step || 1) - 1, 0), 4);
            setOnboardingRoute(STUDENT_STEP_ROUTES[step]);
            setOnboardingCheck("needs");
          } else {
            setOnboardingCheck("done");
          }
        });
    } else if (role === "employer") {
      supabase
        .from("employer_profiles")
        .select("onboarding_status, onboarding_step")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          const d = data as any;
          if (d && d.onboarding_status !== "completed") {
            const step = Math.min(Math.max((d.onboarding_step || 1) - 1, 0), 4);
            setOnboardingRoute(EMPLOYER_STEP_ROUTES[step]);
            setOnboardingCheck("needs");
          } else {
            setOnboardingCheck("done");
          }
        });
    } else if (!role) {
      // New OAuth user with no role yet — send to role picker
      setOnboardingRoute("/select-role");
      setOnboardingCheck("needs");
    } else {
      setOnboardingCheck("done");
    }
  }, [user, role, loading]);

  if (loading || onboardingCheck === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (onboardingCheck === "needs") {
    return <Navigate to={onboardingRoute} replace />;
  }

  if (role === "student") return <Navigate to="/internships" replace />;
  if (role === "employer") return <Navigate to="/my-internships" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;

  return <Navigate to="/" replace />;
};

export default Dashboard;
