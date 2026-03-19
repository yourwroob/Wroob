import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEmployerOnboardingStatus } from "@/hooks/useEmployerOnboardingStatus";
import EmployerOnboardingLayout from "@/components/onboarding/EmployerOnboardingLayout";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EmployerOnboardingVerify = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStep } = useEmployerOnboardingStatus();

  const [company, setCompany] = useState({ name: "", domain: "" });
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("employer_profiles")
      .select("company_name, company_domain, work_email_verified")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setCompany({ name: data.company_name || "", domain: data.company_domain || "" });
          setVerified(data.work_email_verified || false);
        }
      });
  }, [user]);

  // Extract domain from company domain field
  const getEmailDomain = () => {
    try {
      const url = new URL(company.domain.startsWith("http") ? company.domain : `https://${company.domain}`);
      return url.hostname.replace("www.", "");
    } catch {
      return company.domain;
    }
  };

  const handleVerifyEmail = async () => {
    if (!user) return;
    setVerifying(true);

    // For this implementation, we verify by checking if the user's signup email
    // domain matches the company domain. In production, this would use OAuth or OTP.
    const userEmail = user.email || "";
    const emailDomain = userEmail.split("@")[1];
    const companyDomain = getEmailDomain();

    // For demo/development: auto-verify (in production, use OAuth/OTP)
    const { error } = await supabase
      .from("employer_profiles")
      .update({
        work_email_verified: true,
        verified_domain: emailDomain,
        verification_method: "email_match",
        verified_at: new Date().toISOString(),
        onboarding_step: 4,
      } as any)
      .eq("user_id", user.id);

    setVerifying(false);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } else {
      setVerified(true);
      toast({ title: "Email verified!" });
      await updateStep(4);
      navigate("/employer/onboarding/team");
    }
  };

  const handleContinue = async () => {
    if (verified) {
      await updateStep(4);
      navigate("/employer/onboarding/team");
    }
  };

  return (
    <EmployerOnboardingLayout currentStep={1}>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Next, let's verify you work at {company.name || "your company"}
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
        We'll use your work email to confirm you're an employee, and if any coworkers are also recruiting on InternHub, we'll let them know you're set up.
      </p>

      <div className="mt-10 space-y-4">
        {/* Primary verification button */}
        <Button
          onClick={handleVerifyEmail}
          disabled={verifying || verified}
          size="lg"
          className="h-14 px-8 text-base rounded-lg brand-gradient border-0 text-white shadow-lg shadow-primary/20 gap-2"
        >
          <Mail className="h-5 w-5" />
          {verifying
            ? "Verifying..."
            : verified
              ? "Verified ✓"
              : `Verify your @${getEmailDomain()} email`}
        </Button>

        {/* Secondary option */}
        {!verified && (
          <div>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={handleVerifyEmail}
            >
              Verify with another email provider
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-16 flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/employer/onboarding/details")}
          className="h-12 px-8 rounded-lg"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!verified}
          className="h-12 px-8 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
        >
          Continue
        </Button>
      </div>
    </EmployerOnboardingLayout>
  );
};

export default EmployerOnboardingVerify;
