import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEmployerOnboardingStatus } from "@/hooks/useEmployerOnboardingStatus";
import EmployerOnboardingLayout from "@/components/onboarding/EmployerOnboardingLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Building2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const HIRING_ROLES = [
  "Software Engineers",
  "Product Managers",
  "Designers",
  "Sales",
  "Other",
];

const FUNDING_STAGES = ["$0-1M", "$1-10M", "$11-50M", "$51M+"];

const EmployerOnboardingDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStep } = useEmployerOnboardingStatus();
  const [loading, setLoading] = useState(false);

  const [company, setCompany] = useState({ name: "", domain: "" });
  const [hiringRoles, setHiringRoles] = useState<string[]>([]);
  const [fundingStage, setFundingStage] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("employer_profiles")
      .select("company_name, company_domain, hiring_roles, funding_stage")
      .eq("user_id", user.id)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setCompany({ name: data.company_name || "", domain: data.company_domain || "" });
          setHiringRoles(data.hiring_roles || []);
          setFundingStage(data.funding_stage || "");
        }
      });
  }, [user]);

  const toggleRole = (role: string) => {
    setHiringRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (hiringRoles.length === 0) {
      toast({ title: "Please select at least one role", variant: "destructive" });
      return;
    }
    if (!fundingStage) {
      toast({ title: "Please select a funding stage", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("employer_profiles")
      .update({
        hiring_roles: hiringRoles,
        funding_stage: fundingStage,
        onboarding_step: 3,
      } as any)
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await updateStep(3);
      navigate("/employer/onboarding/verify");
    }
  };

  return (
    <EmployerOnboardingLayout currentStep={1}>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Let's find your Company
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
        Many companies already have a Wroobe profile. We'll look for yours, and if you use an applicant tracking system, we'll help find the jobs you've already posted.
      </p>

      {/* Company card */}
      {company.name && (
        <div className="mt-6 rounded-xl border-2 border-primary/20 p-5 flex items-center gap-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg">{company.name}</p>
            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {company.domain}
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-primary font-medium"
            onClick={() => navigate("/employer/onboarding/company")}
          >
            Change
          </Button>
        </div>
      )}

      {/* Hiring roles */}
      <div className="mt-10 space-y-4">
        <div>
          <Label className="text-base font-semibold">What roles are you hiring for?<span className="text-destructive">*</span></Label>
          <p className="text-sm text-muted-foreground">Select all that apply.</p>
        </div>
        <div className="space-y-3">
          {HIRING_ROLES.map((role) => (
            <div key={role} className="flex items-center gap-3">
              <Checkbox
                id={`role-${role}`}
                checked={hiringRoles.includes(role)}
                onCheckedChange={() => toggleRole(role)}
              />
              <Label htmlFor={`role-${role}`} className="text-base cursor-pointer">
                {role}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Funding stage */}
      <div className="mt-10 space-y-4">
        <Label className="text-base font-semibold">How much funding has your company raised so far?<span className="text-destructive">*</span></Label>
        <div className="space-y-3">
          {FUNDING_STAGES.map((stage) => (
            <div key={stage} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFundingStage(stage)}
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center",
                  fundingStage === stage
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40"
                )}
              >
                {fundingStage === stage && (
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                )}
              </button>
              <Label className="text-base cursor-pointer" onClick={() => setFundingStage(stage)}>
                {stage}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="h-14 px-10 text-base bg-foreground text-background hover:bg-foreground/90 rounded-lg"
        >
          {loading ? "Saving..." : "Next up: Get recruiter access"}
        </Button>
      </div>
    </EmployerOnboardingLayout>
  );
};

export default EmployerOnboardingDetails;
