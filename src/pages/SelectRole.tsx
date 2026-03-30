import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import wroobeLogo from "@/assets/wroob-logo.png";

const SelectRole = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<"student" | "employer" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If user already has a role, skip this page entirely
  useEffect(() => {
    if (!loading && role) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, role, navigate]);

  if (loading || role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleContinue = async () => {
    if (!selected || !user) return;
    setSubmitting(true);

    try {
      // Use SECURITY DEFINER function — prevents client-side role manipulation
      const { error } = await supabase.rpc("set_initial_role", { _role: selected });

      if (error) throw error;

      // Force auth context to re-fetch role
      window.location.href = selected === "student"
        ? "/onboarding/profile"
        : "/employer/onboarding/company";
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to set role.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={wroobeLogo} alt="Wroob" className="mx-auto h-14" />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">I'm joining as...</CardTitle>
            <CardDescription>Choose your role to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "student" as const, label: "Student", icon: GraduationCap, desc: "Find internships" },
                { value: "employer" as const, label: "Employer", icon: Building2, desc: "Post internships" },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelected(r.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-6 transition-all",
                    selected === r.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <r.icon className="h-8 w-8" />
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-xs text-muted-foreground">{r.desc}</span>
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={!selected || submitting}
              onClick={handleContinue}
            >
              {submitting ? "Setting up..." : "Continue"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SelectRole;
