import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TECHNOLOGIES = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "Rust", "Ruby",
  "React", "Vue", "Angular", "Node.js", "Django", "Flask", "Spring",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "PostgreSQL", "MongoDB",
  "GraphQL", "REST", "Machine Learning", "Data Engineering", "iOS", "Android",
  "Flutter", "Swift", "Kotlin", "PHP", "Laravel", "TensorFlow", "PyTorch",
];

const MOTIVATION_OPTIONS = ["Solving technical problems", "Building products"];
const JOB_PRIORITIES = [
  "Having a say in what I work on and how I work",
  "Opportunities to progress within the company",
  "Team members I can learn from",
  "A company with a good growth trajectory",
  "Having a say in the company's and/or my team's direction",
  "Mentorship opportunities",
  "Learn new things and develop my skills",
  "Challenging problems to work on",
  "A diverse team",
];
const REMOTE_OPTIONS = ["Remote", "Hybrid", "On-site"];

const OnboardingCulture = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStep } = useOnboardingStatus();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    tech_interests: [] as string[],
    tech_avoid: [] as string[],
    motivation_type: "",
    job_priorities: [] as string[],
    remote_importance: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("student_culture" as any)
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setForm((f) => ({
            ...f,
            tech_interests: data.tech_interests || [],
            tech_avoid: data.tech_avoid || [],
            motivation_type: data.motivation_type || "",
            job_priorities: data.job_priorities || [],
            remote_importance: data.remote_importance || "",
          }));
        }
      });
  }, [user]);

  const toggleTech = (field: "tech_interests" | "tech_avoid", tech: string) => {
    setForm((f) => {
      const arr = f[field];
      if (arr.includes(tech)) return { ...f, [field]: arr.filter((t) => t !== tech) };
      if (arr.length >= 5) return f;
      return { ...f, [field]: [...arr, tech] };
    });
  };

  const togglePriority = (p: string) => {
    setForm((f) => {
      if (f.job_priorities.includes(p)) return { ...f, job_priorities: f.job_priorities.filter((x) => x !== p) };
      if (f.job_priorities.length >= 2) return f;
      return { ...f, job_priorities: [...f.job_priorities, p] };
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from("student_culture" as any)
      .upsert({
        user_id: user.id,
        tech_interests: form.tech_interests,
        tech_avoid: form.tech_avoid,
        motivation_type: form.motivation_type,
        job_priorities: form.job_priorities,
        remote_importance: form.remote_importance,
        // Clear removed fields
        career_track: null,
        environment_preference: null,
        quiet_importance: null,
        job_description_text: null,
      } as any, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await updateStep(3);
      navigate("/onboarding/resume");
    }
    setLoading(false);
  };

  return (
    <OnboardingLayout
      currentStep={2}
      title="Find your culture fit"
      subtitle="Tell us about your interests and preferences and we'll find you the perfect jobs."
    >
      <Card>
        <CardContent className="space-y-8 p-6 sm:p-8">
          {/* Tech interests */}
          <div className="space-y-3">
            <Label className="font-semibold">
              Which technologies are you <strong className="underline">most</strong> interested in working with?
            </Label>
            <p className="text-xs text-muted-foreground">Pick up to 5 that best match your interest</p>
            <Select onValueChange={(v) => toggleTech("tech_interests", v)}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Search and select technologies" />
              </SelectTrigger>
              <SelectContent>
                {TECHNOLOGIES.filter((t) => !form.tech_interests.includes(t)).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {form.tech_interests.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  {t} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTech("tech_interests", t)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Tech avoid */}
          <div className="space-y-3">
            <Label className="font-semibold">
              Which technologies are you <strong className="underline">not</strong> willing to work with?
            </Label>
            <p className="text-xs text-muted-foreground">Pick up to 5</p>
            <Select onValueChange={(v) => toggleTech("tech_avoid", v)}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Search and select technologies" />
              </SelectTrigger>
              <SelectContent>
                {TECHNOLOGIES.filter((t) => !form.tech_avoid.includes(t)).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {form.tech_avoid.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  {t} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTech("tech_avoid", t)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Motivation */}
          <div className="space-y-3">
            <Label className="font-semibold">What motivates you more?</Label>
            <div className="flex flex-wrap gap-2">
              {MOTIVATION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, motivation_type: opt }))}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-sm border transition-all",
                    form.motivation_type === opt
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("h-4 w-4 rounded-full border-2", form.motivation_type === opt ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                    {opt}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Job priorities */}
          <div className="space-y-3">
            <Label className="font-semibold">What's most important to you in your next job? (Max 2)</Label>
            <div className="flex flex-wrap gap-2">
              {JOB_PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriority(p)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm border transition-all",
                    form.job_priorities.includes(p)
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-muted-foreground/40",
                    !form.job_priorities.includes(p) && form.job_priorities.length >= 2 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("h-4 w-4 rounded-full border-2", form.job_priorities.includes(p) ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                    {p}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Remote work preference — pill toggle */}
          <div className="space-y-3">
            <Label className="font-semibold">What is your preferred work mode?</Label>
            <div className="flex gap-2">
              {REMOTE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, remote_importance: opt.toLowerCase() }))}
                  className={cn(
                    "rounded-full px-6 py-2.5 text-sm font-medium border transition-all",
                    form.remote_importance === opt.toLowerCase()
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:border-muted-foreground/50"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-2">
        <p className="text-sm">
          <span className="text-green-600 font-medium">✔ You're almost done!</span>{" "}
          <span className="text-primary">Complete profile and start searching for your dream job.</span>
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/onboarding/profile")}
            size="lg"
            className="rounded-full h-12 px-8"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            size="lg"
            className="rounded-full h-12 px-10 brand-gradient border-0 text-white shadow-lg shadow-primary/20"
          >
            {loading ? "Saving..." : "Save and continue"}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default OnboardingCulture;
