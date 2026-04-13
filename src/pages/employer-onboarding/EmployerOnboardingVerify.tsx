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
  // FIX (HIGH-verify-personal): Track domain mismatch to surface the unverified escape hatch.
  const [domainMismatch, setDomainMismatch] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("employer_profiles")
      // Also fetch 'website' — company_domain is not populated by the current
      // onboarding flow, so we fall back to the website URL entered in Step 1.
      .select("company_name, company_domain, website, work_email_verified")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          // Prefer explicit company_domain; fall back to website URL.
          const domainSource = data.company_domain || data.website || "";
          setCompany({ name: data.company_name || "", domain: domainSource });
          setVerified(data.work_email_verified || false);
        }
      });
  }, [user]);

  // Extract the bare hostname from whatever URL/domain string we have.
  const getEmailDomain = () => {
    if (!company.domain) return "";
    try {
      const url = new URL(company.domain.startsWith("http") ? company.domain : `https://${company.domain}`);
      return url.hostname.replace("www.", "");
    } catch {
      return company.domain.replace("www.", "");
    }
  };

  const handleVerifyEmail = async () => {
    if (!user) return;
    setVerifying(true);

    const userEmail = user.email || "";
    const emailDomain = userEmail.split("@")[1]?.toLowerCase() ?? "";
    const companyDomain = getEmailDomain().toLowerCase();

    // Guard: we need a company domain to compare against.
    if (!companyDomain) {
      setVerifying(false);
      toast({
        title: "Cannot verify",
        description: "No company website was found. Please go back to Step 1 and enter your company website.",
        variant: "destructive",
      });
      return;
    }

    // Guard: email domain must match company domain.
    // FIX (HIGH-verify-personal): Hard-blocking was unusable for employers who signed
    // up with a personal email (gmail, yahoo, etc.) but have a separate company domain.
    // Now we show the mismatch as a warning and set a flag rather than hard-blocking.
    if (emailDomain !== companyDomain) {
      setVerifying(false);
      setDomainMismatch(true);
      toast({
        title: "Domain mismatch",
        description: `Your email (@${emailDomain}) doesn't match your company domain (${companyDomain}). Use "Continue unverified" below to proceed — your profile will show as unverified until you re-verify with a matching work email.`,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("employer_profiles")
      .update({
        work_email_verified: true,
        verified_domain: emailDomain,
        verification_method: "email_match",
        verified_at: new Date().toISOString(),
        onboarding_step: 6,
      } as any)
      .eq("user_id", user.id);

    setVerifying(false);
    if (error) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } else {
      setVerified(true);
      toast({ title: "Email verified!" });
      await updateStep(5);
      navigate("/employer/onboarding/team");
    }
  };

  const handleContinue = async () => {
    if (verified) {
      await updateStep(5);
      navigate("/employer/onboarding/team");
    }
  };

  // FIX (HIGH-verify-personal): Allow employers with personal emails to proceed
  // without domain verification. Their profile will show as unverified (is_verified = false).
  const handleContinueUnverified = async () => {
    await updateStep(5);
    navigate("/employer/onboarding/team");
  };

  return (
    <EmployerOnboardingLayout currentStep={4}>
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

        {/* FIX (HIGH-verify-personal): When domain mismatch detected, show escape hatch.
            Profile remains unverified (is_verified = false) until they re-verify
            from settings with a matching work email. */}
        {!verified && domainMismatch && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
            <p>
              <strong>Using a personal email?</strong> You can still continue — your company profile
              will show as <em>unverified</em> until you re-verify with a work email that matches
              your company domain.
            </p>
            <button
              type="button"
              className="text-sm font-medium text-amber-900 underline hover:no-underline"
              onClick={handleContinueUnverified}
            >
              Continue without verification →
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-16 flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/employer/onboarding/legal")}
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
