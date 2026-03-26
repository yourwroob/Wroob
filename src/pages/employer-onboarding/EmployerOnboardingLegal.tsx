import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEmployerOnboardingStatus } from "@/hooks/useEmployerOnboardingStatus";
import EmployerOnboardingLayout from "@/components/onboarding/EmployerOnboardingLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

const EmployerOnboardingLegal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStep } = useEmployerOnboardingStatus();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    gstin: "",
    gst_number: "",
    pan_number: "",
    cin: "",
    linkedin_profile: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("employer_profiles")
      .select("gstin, gst_number, pan_number, cin, linkedin_profile")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setForm({
            gstin: data.gstin || "",
            gst_number: data.gst_number || "",
            pan_number: data.pan_number || "",
            cin: data.cin || "",
            linkedin_profile: data.linkedin_profile || "",
          });
        }
      });
  }, [user]);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Basic format validators
  const isValidGSTIN = (v: string) => !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(v);
  const isValidPAN = (v: string) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(v);
  const isValidLinkedIn = (v: string) => !v || /linkedin\.com\/(company|in)\//i.test(v);

  const handleContinue = async () => {
    if (!user) return;

    if (!form.gstin.trim()) {
      toast({ title: "GSTIN is required", variant: "destructive" });
      return;
    }
    if (!isValidGSTIN(form.gstin.trim())) {
      toast({ title: "Invalid GSTIN format", description: "Example: 22AAAAA0000A1Z5", variant: "destructive" });
      return;
    }
    if (!form.pan_number.trim()) {
      toast({ title: "PAN is required", variant: "destructive" });
      return;
    }
    if (!isValidPAN(form.pan_number.trim())) {
      toast({ title: "Invalid PAN format", description: "Example: ABCDE1234F", variant: "destructive" });
      return;
    }
    if (!form.linkedin_profile.trim()) {
      toast({ title: "LinkedIn company profile is required", variant: "destructive" });
      return;
    }
    if (!isValidLinkedIn(form.linkedin_profile.trim())) {
      toast({ title: "Invalid LinkedIn URL", description: "Must be a linkedin.com/company/ URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("employer_profiles")
      .update({
        gstin: form.gstin.trim().toUpperCase(),
        gst_number: form.gst_number || null,
        pan_number: form.pan_number.trim().toUpperCase(),
        cin: form.cin || null,
        linkedin_profile: form.linkedin_profile.trim(),
        onboarding_step: 5,
      } as any)
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await updateStep(5);
      navigate("/employer/onboarding/verify");
    }
  };

  return (
    <EmployerOnboardingLayout currentStep={3}>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Legal & Verification Details</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
        These details help us verify your company and grant the <strong>"Verified Company" ✅</strong> badge after admin review.
      </p>

      <div className="mt-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>GSTIN Number *</Label>
            <Input value={form.gstin} onChange={(e) => update("gstin", e.target.value.toUpperCase())} placeholder="e.g. 22AAAAA0000A1Z5" maxLength={15} />
            <p className="text-xs text-muted-foreground">15-character alphanumeric</p>
          </div>
          <div className="space-y-2">
            <Label>GST Number</Label>
            <Input value={form.gst_number} onChange={(e) => update("gst_number", e.target.value)} placeholder="If different from GSTIN" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>PAN (Company) *</Label>
            <Input value={form.pan_number} onChange={(e) => update("pan_number", e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" maxLength={10} />
            <p className="text-xs text-muted-foreground">10-character format: XXXXX0000X</p>
          </div>
          <div className="space-y-2">
            <Label>CIN (if registered)</Label>
            <Input value={form.cin} onChange={(e) => update("cin", e.target.value)} placeholder="Company Identification Number" />
            <p className="text-xs text-muted-foreground">Optional</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>LinkedIn Company Profile *</Label>
          <Input value={form.linkedin_profile} onChange={(e) => update("linkedin_profile", e.target.value)} placeholder="https://www.linkedin.com/company/your-company" />
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 flex items-start gap-3">
          <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            After submission, our team will verify your GSTIN, PAN, and LinkedIn profile. A <strong>"Verified Company" ✅</strong> badge will be assigned upon successful verification.
          </p>
        </div>
      </div>

      <div className="mt-12 flex gap-4">
        <Button variant="outline" onClick={() => navigate("/employer/onboarding/manager")} className="h-12 px-8 rounded-lg">Back</Button>
        <Button onClick={handleContinue} disabled={loading} size="lg" className="h-14 px-10 text-base bg-foreground text-background hover:bg-foreground/90 rounded-lg">
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </EmployerOnboardingLayout>
  );
};

export default EmployerOnboardingLegal;
