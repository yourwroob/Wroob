import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Loader2 } from "lucide-react";

const SPECIALISATIONS = [
  "Computer Science", "Information Technology", "Electronics", "Mechanical Engineering",
  "Civil Engineering", "Electrical Engineering", "Data Science", "Business Administration",
  "Commerce", "Arts & Humanities", "Law", "Medicine", "Design", "Other",
];

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "0 months" },
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "9", label: "9 months" },
  { value: "12", label: "12 months" },
  { value: "15", label: "15 months" },
  { value: "18", label: "18 months" },
  { value: "21", label: "21 months" },
  { value: "24", label: "24 months" },
];

const OnboardingProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStep } = useOnboardingStatus();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [form, setForm] = useState({
    location: "",
    profile_role: "",
    experience_years: "",
    is_student: true,
    current_job_title: "",
    current_company: "",
    not_employed: false,
    linkedin_url: "",
    website_url: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setForm((f) => ({
            ...f,
            location: d.location || "",
            profile_role: d.profile_role || "",
            experience_years: d.experience_years || "",
            is_student: d.is_student ?? true,
            current_job_title: d.current_job_title || "",
            current_company: d.current_company || "",
            not_employed: d.not_employed ?? false,
            linkedin_url: d.linkedin_url || "",
            website_url: d.website_url || "",
          }));
        }
      });
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.location || !form.profile_role || !form.experience_years) {
      toast({ title: "Required fields missing", description: "Please fill in location, specialisation, and experience.", variant: "destructive" });
      return;
    }
    if (form.linkedin_url && !form.linkedin_url.includes("linkedin.com")) {
      toast({ title: "Invalid LinkedIn URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("student_profiles")
      .update({
        location: form.location,
        profile_role: form.profile_role,
        experience_years: form.experience_years,
        is_student: form.is_student,
        current_job_title: form.current_job_title,
        current_company: form.not_employed ? "" : form.current_company,
        not_employed: form.not_employed,
        linkedin_url: form.linkedin_url,
        website_url: form.website_url,
        onboarding_step: 2,
      } as any)
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await updateStep(2);
      navigate("/onboarding/culture");
    }
  };

  return (
    <OnboardingLayout
      currentStep={1}
      title="Create your profile"
      subtitle="Apply privately to thousands of tech companies & startups with one profile."
    >
      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          {/* Location */}
          <div className="space-y-2">
            <Label className="font-semibold">
              <span className="text-primary mr-1">*</span>Where are you based?
            </Label>
            <p className="text-xs text-muted-foreground">Tip: You can type a location or detect it automatically</p>
            <div className="flex gap-2">
              <LocationAutocomplete
                value={form.location}
                onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled={geoLoading}
                className="gap-2 shrink-0"
                onClick={() => {
                  if (!navigator.geolocation) {
                    toast({ title: "Geolocation not supported", description: "Your browser doesn't support location detection.", variant: "destructive" });
                    return;
                  }
                  setGeoLoading(true);
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
                        const data = await res.json();
                        const city = data.address?.city || data.address?.town || data.address?.village || "";
                        const state = data.address?.state || "";
                        const country = data.address?.country || "";
                        const location = [city, state, country].filter(Boolean).join(", ");
                        setForm((f) => ({ ...f, location }));
                        toast({ title: "Location detected!", description: location });
                      } catch {
                        toast({ title: "Could not resolve location", variant: "destructive" });
                      }
                      setGeoLoading(false);
                    },
                    (err) => {
                      setGeoLoading(false);
                      toast({
                        title: "Location access denied",
                        description: err.code === 1 ? "Please enable location in your browser settings." : "Could not get your location. Please try again.",
                        variant: "destructive",
                      });
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
              >
                {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {geoLoading ? "Detecting..." : "Detect"}
              </Button>
            </div>
          </div>

          {/* Course Specialisation */}
          <div className="space-y-2">
            <Label className="font-semibold">
              <span className="text-primary mr-1">*</span>Course Specialisation
            </Label>
            <Select value={form.profile_role} onValueChange={(v) => setForm((f) => ({ ...f, profile_role: v }))}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Select your specialisation" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALISATIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experience in 3-month increments */}
          <div className="space-y-2">
            <Label className="font-semibold">
              <span className="text-primary mr-1">*</span>How many months of experience do you have?
            </Label>
            <Select value={form.experience_years} onValueChange={(v) => setForm((f) => ({ ...f, experience_years: v }))}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Select months of experience" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_OPTIONS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Undergrad / PG toggle */}
          <div className="space-y-2">
            <Label className="font-semibold">
              <span className="text-primary mr-1">*</span>Are you undergrad or PG?
            </Label>
            <div className="flex gap-3">
              {[
                { value: true, label: "Undergraduate" },
                { value: false, label: "Postgraduate" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_student: opt.value }))}
                  className={`rounded-full px-6 py-2 text-sm font-medium border transition-all ${
                    form.is_student === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current work */}
          <div className="space-y-2">
            <Label className="font-semibold">Where do you currently work?</Label>
            <p className="text-xs text-muted-foreground">Your company will never see that you're looking for a job</p>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Job title</Label>
                <Input
                  placeholder="e.g., Design Director"
                  value={form.current_job_title}
                  onChange={(e) => setForm((f) => ({ ...f, current_job_title: e.target.value }))}
                  disabled={form.not_employed}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Company</Label>
                <Input
                  placeholder="e.g., Omnicorp"
                  value={form.current_company}
                  onChange={(e) => setForm((f) => ({ ...f, current_company: e.target.value }))}
                  disabled={form.not_employed}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="not-employed"
                  checked={form.not_employed}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, not_employed: !!v }))}
                />
                <Label htmlFor="not-employed" className="text-sm whitespace-nowrap">I'm not currently employed</Label>
              </div>
            </div>
          </div>

          {/* LinkedIn & Website */}
          <div className="rounded-lg bg-muted/50 p-5 space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold">LinkedIn Profile</Label>
              <Input
                placeholder="https://linkedin.com/in/"
                value={form.linkedin_url}
                onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Your Website</Label>
              <Input
                placeholder="https://mypersonalwebsite.com"
                value={form.website_url}
                onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="rounded-full h-12 px-10 brand-gradient border-0 text-white shadow-lg shadow-primary/20"
        >
          {loading ? "Saving..." : "Create your profile"}
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default OnboardingProfile;
