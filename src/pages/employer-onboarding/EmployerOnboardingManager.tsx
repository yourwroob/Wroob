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
import { ShieldAlert } from "lucide-react";

const EmployerOnboardingManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStep } = useEmployerOnboardingStatus();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    manager_contact_name: "",
    manager_designation: "",
    manager_email: "",
    manager_phone: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("employer_profiles")
      .select("manager_contact_name, manager_designation, manager_email, manager_phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setForm({
            manager_contact_name: data.manager_contact_name || "",
            manager_designation: data.manager_designation || "",
            manager_email: data.manager_email || "",
            manager_phone: data.manager_phone || "",
          });
        }
      });
  }, [user]);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleContinue = async () => {
    if (!user) return;
    if (!form.manager_contact_name.trim()) {
      toast({ title: "Manager name is required", variant: "destructive" });
      return;
    }
    if (!form.manager_email.trim()) {
      toast({ title: "Manager email is required", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.manager_email)) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    if (!form.manager_phone.trim()) {
      toast({ title: "Manager phone is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("employer_profiles")
      .update({
        manager_contact_name: form.manager_contact_name.trim(),
        manager_designation: form.manager_designation || null,
        manager_email: form.manager_email.trim(),
        manager_phone: form.manager_phone.trim(),
        onboarding_step: 4,
      } as any)
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await updateStep(4);
      navigate("/employer/onboarding/legal");
    }
  };

  return (
    <EmployerOnboardingLayout currentStep={3}>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Upper-Level Manager Contact</h1>

      <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-destructive">🔒 Private Information</p>
          <p className="text-sm text-muted-foreground mt-1">
            This information is strictly confidential and will <strong>never</strong> be shown to students or any external users. Only platform admins can access these details for verification purposes.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Contact Person Name *</Label>
            <Input value={form.manager_contact_name} onChange={(e) => update("manager_contact_name", e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label>Designation</Label>
            <Input value={form.manager_designation} onChange={(e) => update("manager_designation", e.target.value)} placeholder="e.g. CEO, Director" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Official Email *</Label>
            <Input type="email" value={form.manager_email} onChange={(e) => update("manager_email", e.target.value)} placeholder="manager@company.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">+91</div>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit phone number"
                value={form.manager_phone}
                onChange={(e) => update("manager_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex gap-4">
        <Button variant="outline" onClick={() => navigate("/employer/onboarding/location")} className="h-12 px-8 rounded-lg">Back</Button>
        <Button onClick={handleContinue} disabled={loading} size="lg" className="h-14 px-10 text-base bg-foreground text-background hover:bg-foreground/90 rounded-lg">
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </EmployerOnboardingLayout>
  );
};

export default EmployerOnboardingManager;
