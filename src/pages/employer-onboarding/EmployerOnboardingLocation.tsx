import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEmployerOnboardingStatus } from "@/hooks/useEmployerOnboardingStatus";
import EmployerOnboardingLayout from "@/components/onboarding/EmployerOnboardingLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

const EmployerOnboardingLocation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStep } = useEmployerOnboardingStatus();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    head_office_address: "",
    city: "",
    state: "",
    pincode: "",
    hr_contact_name: "",
    hr_designation: "",
    hr_email: "",
    hr_phone: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("employer_profiles")
      .select("head_office_address, city, state, pincode, hr_contact_name, hr_designation, hr_email, hr_phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setForm({
            head_office_address: data.head_office_address || "",
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || "",
            hr_contact_name: data.hr_contact_name || "",
            hr_designation: data.hr_designation || "",
            hr_email: data.hr_email || "",
            hr_phone: data.hr_phone || "",
          });
        }
      });
  }, [user]);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleContinue = async () => {
    if (!user) return;
    if (!form.city.trim()) {
      toast({ title: "City is required", variant: "destructive" });
      return;
    }
    if (!form.hr_contact_name.trim()) {
      toast({ title: "HR contact name is required", variant: "destructive" });
      return;
    }
    if (!form.hr_email.trim()) {
      toast({ title: "HR email is required", variant: "destructive" });
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.hr_email)) {
      toast({ title: "Please enter a valid HR email", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("employer_profiles")
      .update({
        head_office_address: form.head_office_address || null,
        city: form.city.trim(),
        state: form.state || null,
        pincode: form.pincode || null,
        hr_contact_name: form.hr_contact_name.trim(),
        hr_designation: form.hr_designation || null,
        hr_email: form.hr_email.trim(),
        hr_phone: form.hr_phone || null,
        onboarding_step: 3,
      } as any)
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await updateStep(3);
      navigate("/employer/onboarding/manager");
    }
  };

  return (
    <EmployerOnboardingLayout currentStep={2}>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Location & Contact Details</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
        Provide your head office location and HR contact information.
      </p>

      <div className="mt-8 space-y-8">
        {/* Location section */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">📍 Head Office Address</h2>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={form.head_office_address} onChange={(e) => update("head_office_address", e.target.value)} placeholder="Street address, building name..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <LocationAutocomplete value={form.city} onChange={(v) => update("city", v)} placeholder="City" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="State" />
            </div>
            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input value={form.pincode} onChange={(e) => update("pincode", e.target.value)} placeholder="e.g. 110001" maxLength={6} />
            </div>
          </div>
        </div>

        {/* HR Contact section */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">👤 HR / Contact Person</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.hr_contact_name} onChange={(e) => update("hr_contact_name", e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input value={form.hr_designation} onChange={(e) => update("hr_designation", e.target.value)} placeholder="e.g. HR Manager" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Official Email *</Label>
              <Input type="email" value={form.hr_email} onChange={(e) => update("hr_email", e.target.value)} placeholder="hr@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={form.hr_phone} onChange={(e) => update("hr_phone", e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex gap-4">
        <Button variant="outline" onClick={() => navigate("/employer/onboarding/company")} className="h-12 px-8 rounded-lg">Back</Button>
        <Button onClick={handleContinue} disabled={loading} size="lg" className="h-14 px-10 text-base bg-foreground text-background hover:bg-foreground/90 rounded-lg">
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </EmployerOnboardingLayout>
  );
};

export default EmployerOnboardingLocation;
