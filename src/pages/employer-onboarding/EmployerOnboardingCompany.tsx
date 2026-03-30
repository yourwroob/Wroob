import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEmployerOnboardingStatus } from "@/hooks/useEmployerOnboardingStatus";
import EmployerOnboardingLayout from "@/components/onboarding/EmployerOnboardingLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";


const INDUSTRY_TYPES = [
  "Manufacturing & Production",
  "Technology & IT Services",
  "BPO & Outsourcing",
  "Infrastructure & Construction",
  "Banking, Finance & Insurance",
  "Retail & E-Commerce",
  "Healthcare & Life Sciences",
  "Education & Ed-Tech",
  "Logistics & Supply Chain",
  "Hospitality & Tourism",
  "Media & Marketing",
  "Energy & Environment",
  "Agriculture & Allied",
  "Startup & Venture",
  "Government & PSU",
  "Professional Services",
  "Non-Profit & NGOs",
  "Self Employed / Freelance",
  "Other",
];

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+",
];

const EmployerOnboardingCompany = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStep } = useEmployerOnboardingStatus();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    logo_url: "",
    industry: "",
    company_description: "",
    website: "",
    year_established: "",
    company_size: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("employer_profiles")
      .select("company_name, logo_url, industry, company_description, website, year_established, company_size")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setForm({
            company_name: data.company_name || "",
            logo_url: data.logo_url || "",
            industry: data.industry || "",
            company_description: data.company_description || "",
            website: data.website || "",
            year_established: data.year_established ? String(data.year_established) : "",
            company_size: data.company_size || "",
          });
        }
      });
  }, [user]);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleContinue = async () => {
    if (!user) return;
    if (!form.company_name.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }
    if (!form.industry) {
      toast({ title: "Industry type is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("employer_profiles")
      .update({
        company_name: form.company_name.trim(),
        logo_url: form.logo_url || null,
        industry: form.industry,
        company_description: form.company_description || null,
        website: form.website || null,
        year_established: form.year_established ? parseInt(form.year_established) : null,
        company_size: form.company_size || null,
        onboarding_step: 2,
      } as any)
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await updateStep(2);
      navigate("/employer/onboarding/location");
    }
  };

  return (
    <EmployerOnboardingLayout currentStep={1}>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Basic Company Information</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
        Tell us about your company. This information will be visible to students browsing internships.
      </p>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label>Company Logo</Label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !user) return;
              const ext = file.name.split(".").pop();
              const path = `${user.id}/logo.${ext}`;
              const { error } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
              if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
              const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(path);
              update("logo_url", urlData.publicUrl);
              toast({ title: "Logo uploaded!" });
            }}
          />
          {form.logo_url && <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-contain border mt-2" />}
        </div>

        <div className="space-y-2">
          <Label>Company Name *</Label>
          <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} placeholder="Enter company name" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Industry Type *</Label>
            <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
              <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                {INDUSTRY_TYPES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Company Size</Label>
            <Select value={form.company_size} onValueChange={(v) => update("company_size", v)}>
              <SelectTrigger><SelectValue placeholder="No. of employees" /></SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Company Description (About Us)</Label>
          <Textarea value={form.company_description} onChange={(e) => update("company_description", e.target.value)} placeholder="A short brief about your company..." rows={4} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://www.example.com" />
          </div>
          <div className="space-y-2">
            <Label>Year of Establishment</Label>
            <Input type="number" min={1800} max={new Date().getFullYear()} value={form.year_established} onChange={(e) => update("year_established", e.target.value)} placeholder="e.g. 2015" />
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Button
          onClick={handleContinue}
          disabled={loading}
          size="lg"
          className="h-14 px-10 text-base bg-foreground text-background hover:bg-foreground/90 rounded-lg"
        >
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </EmployerOnboardingLayout>
  );
};

export default EmployerOnboardingCompany;
