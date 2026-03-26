import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { COURSE_CATEGORIES } from "@/data/courseData";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import {
  X, Briefcase, MapPin, Clock, IndianRupee, Brain, FileText, FlaskConical, CalendarDays,
  ChevronDown, ChevronUp,
} from "lucide-react";

const DEPARTMENTS = [
  "HR", "Finance", "Operations", "IT", "Marketing", "Sales",
  "Design", "Engineering", "Data Science", "Legal", "Content", "Other",
];

const BENEFITS_OPTIONS = [
  { id: "certificate", label: "Certificate" },
  { id: "ppo", label: "PPO (Job Offer)" },
  { id: "incentives", label: "Incentives" },
  { id: "travel_allowance", label: "Travel Allowance" },
];

const WORKING_DAYS_OPTIONS = [
  "Mon–Fri", "Mon–Sat", "Flexible", "Custom",
];

const PostInternship = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allSkills, setAllSkills] = useState<{ name: string; category: string }[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true, location: true, duration: true, stipend: true,
    skills: true, description: true, selection: true, application: true,
  });

  const [form, setForm] = useState({
    // Section 1: Basic Info
    title: "",
    department: "",
    slots: 5,
    internship_category: "full-time" as "full-time" | "part-time",
    industry: "",
    // Section 2: Location & Mode
    type: "remote" as "remote" | "onsite" | "hybrid",
    location: "",
    // Section 3: Duration & Timing
    duration_months: 3,
    start_date: "",
    working_days: "Mon–Fri",
    working_hours: "9 AM – 5 PM",
    // Section 4: Stipend & Benefits
    stipend_type: "unpaid" as "unpaid" | "fixed" | "performance-based",
    stipend_amount: "",
    benefits: [] as string[],
    // Section 5: Skills & Eligibility
    skills_required: [] as string[],
    eligibility: [] as string[],
    // Section 6: Description
    description: "",
    roles_responsibilities: "",
    day_to_day_tasks: "",
    projects: "",
    requirements: "",
    // Section 7: Selection Process
    resume_screening: true,
    interview_required: false,
    test_assignment: "",
    // Section 8: Application Details
    deadline: "",
    joining_process: "",
  });

  useEffect(() => {
    supabase.from("skills").select("name, category").order("category").order("name").then(({ data }) => {
      if (data) setAllSkills(data);
    });
  }, []);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addSkill = (skill: string) => {
    if (!form.skills_required.includes(skill)) update("skills_required", [...form.skills_required, skill]);
    setSkillSearch("");
  };

  const removeSkill = (skill: string) => update("skills_required", form.skills_required.filter((s) => s !== skill));

  const toggleBenefit = (benefit: string) => {
    update("benefits", form.benefits.includes(benefit)
      ? form.benefits.filter((b) => b !== benefit)
      : [...form.benefits, benefit]
    );
  };

  const toggleEligibility = (course: string) => {
    update("eligibility", form.eligibility.includes(course)
      ? form.eligibility.filter((c) => c !== course)
      : [...form.eligibility, course]
    );
  };

  const toggleSection = (section: string) =>
    setExpandedSections((s) => ({ ...s, [section]: !s[section] }));

  const filteredSkills = allSkills.filter(
    (s) => s.name.toLowerCase().includes(skillSearch.toLowerCase()) && !form.skills_required.includes(s.name)
  );

  const validate = (): string | null => {
    if (!form.title.trim()) return "Internship title is required";
    if (!form.department) return "Department is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.roles_responsibilities.trim()) return "Roles & Responsibilities are required";
    if ((form.type === "onsite" || form.type === "hybrid") && !form.location.trim())
      return "Location is required for On-site/Hybrid internships";
    if (!form.deadline) return "Last date to apply is required";
    return null;
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!user) return;

    if (status === "published") {
      const error = validate();
      if (error) {
        toast({ title: "Validation Error", description: error, variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    const appCap = form.slots * 2;
    const { error } = await supabase.from("internships").insert({
      title: form.title,
      department: form.department,
      slots: form.slots,
      internship_category: form.internship_category,
      industry: form.industry,
      type: form.type,
      location: form.location || null,
      duration_months: form.duration_months,
      start_date: form.start_date || null,
      working_days: form.working_days,
      working_hours: form.working_hours,
      stipend_type: form.stipend_type,
      stipend_amount: form.stipend_amount ? parseFloat(form.stipend_amount) : null,
      benefits: form.benefits,
      skills_required: form.skills_required,
      eligibility: form.eligibility.length > 0 ? form.eligibility : null,
      description: form.description,
      roles_responsibilities: form.roles_responsibilities,
      day_to_day_tasks: form.day_to_day_tasks || null,
      projects: form.projects || null,
      requirements: form.requirements || null,
      resume_screening: form.resume_screening,
      interview_required: form.interview_required,
      test_assignment: form.test_assignment || null,
      deadline: form.deadline || null,
      joining_process: form.joining_process || null,
      employer_id: user.id,
      status,
      app_cap: appCap,
      application_count: 0,
    } as any);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "published" ? "Internship published!" : "Draft saved!" });
      navigate("/my-internships");
    }
  };

  const SectionHeader = ({ id, icon: Icon, title }: { id: string; icon: any; title: string }) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="flex w-full items-center justify-between py-3"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      {expandedSections[id] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
    </button>
  );

  const [eligibilitySearch, setEligibilitySearch] = useState("");

  // Flatten all courses for eligibility search
  const allCourses = Object.entries(COURSE_CATEGORIES).flatMap(([school, courses]) =>
    courses.map((c) => ({ school, course: c }))
  );
  const filteredCourses = eligibilitySearch.length >= 2
    ? allCourses.filter((c) =>
        c.course.toLowerCase().includes(eligibilitySearch.toLowerCase()) ||
        c.school.toLowerCase().includes(eligibilitySearch.toLowerCase())
      ).slice(0, 15)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-10">
        <h1 className="font-display text-3xl font-bold mb-8">Post Internship</h1>

        <div className="space-y-4">
          {/* Section 1: Basic Info */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader id="basic" icon={Briefcase} title="Basic Internship Info" />
              {expandedSections.basic && (
                <div className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <Label>Internship Title *</Label>
                    <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Frontend Developer Intern" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department *</Label>
                      <Select value={form.department} onValueChange={(v) => update("department", v)}>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Openings *</Label>
                      <Input type="number" min={1} max={50} value={form.slots} onChange={(e) => update("slots", Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))} />
                      <p className="text-xs text-muted-foreground">Max applications = {form.slots * 2}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Internship Type *</Label>
                      <Select value={form.internship_category} onValueChange={(v: any) => update("internship_category", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input value={form.industry} onChange={(e) => update("industry", e.target.value)} placeholder="e.g. Technology" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Location & Mode */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader id="location" icon={MapPin} title="Location & Mode" />
              {expandedSections.location && (
                <div className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <Label>Work Mode *</Label>
                    <Select value={form.type} onValueChange={(v: any) => update("type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(form.type === "onsite" || form.type === "hybrid") && (
                    <div className="space-y-2">
                      <Label>Location *</Label>
                      <LocationAutocomplete
                        value={form.location}
                        onChange={(v) => update("location", v)}
                        placeholder="Search for a city..."
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Duration & Timing */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader id="duration" icon={Clock} title="Duration & Timing" />
              {expandedSections.duration && (
                <div className="space-y-4 pb-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (months) *</Label>
                      <Select value={String(form.duration_months)} onValueChange={(v) => update("duration_months", parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? "s" : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Working Days</Label>
                      <Select value={form.working_days} onValueChange={(v) => update("working_days", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WORKING_DAYS_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Working Hours</Label>
                      <Input value={form.working_hours} onChange={(e) => update("working_hours", e.target.value)} placeholder="e.g. 9 AM – 5 PM" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Stipend & Benefits */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader id="stipend" icon={IndianRupee} title="Stipend & Benefits" />
              {expandedSections.stipend && (
                <div className="space-y-4 pb-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stipend Type *</Label>
                      <Select value={form.stipend_type} onValueChange={(v: any) => update("stipend_type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="performance-based">Performance-based</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {form.stipend_type !== "unpaid" && (
                      <div className="space-y-2">
                        <Label>Stipend Amount (₹/month)</Label>
                        <Input type="number" min={0} value={form.stipend_amount} onChange={(e) => update("stipend_amount", e.target.value)} placeholder="e.g. 10000" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Benefits</Label>
                    <div className="flex flex-wrap gap-4">
                      {BENEFITS_OPTIONS.map((b) => (
                        <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={form.benefits.includes(b.id)} onCheckedChange={() => toggleBenefit(b.id)} />
                          <span className="text-sm">{b.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Skills & Eligibility */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader id="skills" icon={Brain} title="Skills & Eligibility" />
              {expandedSections.skills && (
                <div className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <Label>Required Skills</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.skills_required.map((s) => (
                        <Badge key={s} variant="secondary" className="gap-1">{s} <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(s)} /></Badge>
                      ))}
                    </div>
                    <Input placeholder="Search skills..." value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} />
                    {skillSearch && (
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-md border p-2">
                        {filteredSkills.map((s) => (
                          <button key={s.name} className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent" onClick={() => addSkill(s.name)}>
                            {s.name} <span className="text-xs text-muted-foreground">({s.category})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Eligibility (Courses)</Label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.eligibility.map((c) => (
                        <Badge key={c} variant="secondary" className="gap-1 text-xs">{c} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleEligibility(c)} /></Badge>
                      ))}
                    </div>
                    <Input placeholder="Search courses..." value={eligibilitySearch} onChange={(e) => setEligibilitySearch(e.target.value)} />
                    {eligibilitySearch.length >= 2 && (
                      <div className="mt-2 max-h-40 overflow-y-auto rounded-md border p-2">
                        {filteredCourses.map((c) => (
                          <button
                            key={c.course}
                            className={`block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent ${form.eligibility.includes(c.course) ? "opacity-50" : ""}`}
                            onClick={() => toggleEligibility(c.course)}
                            disabled={form.eligibility.includes(c.course)}
                          >
                            {c.course} <span className="text-xs text-muted-foreground">({c.school})</span>
                          </button>
                        ))}
                        {filteredCourses.length === 0 && <p className="text-sm text-muted-foreground p-2">No courses found</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 6: Description */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader id="description" icon={FileText} title="Internship Description" />
              {expandedSections.description && (
                <div className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <Label>Overview *</Label>
                    <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the internship role and what the intern will learn..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Roles & Responsibilities *</Label>
                    <Textarea value={form.roles_responsibilities} onChange={(e) => update("roles_responsibilities", e.target.value)} placeholder="List the key responsibilities..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Day-to-Day Tasks</Label>
                    <Textarea value={form.day_to_day_tasks} onChange={(e) => update("day_to_day_tasks", e.target.value)} placeholder="What will the intern do on a daily basis?" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Projects Student Will Work On</Label>
                    <Textarea value={form.projects} onChange={(e) => update("projects", e.target.value)} placeholder="Describe projects or assignments..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Requirements / Qualifications</Label>
                    <Textarea value={form.requirements} onChange={(e) => update("requirements", e.target.value)} placeholder="Any specific qualifications needed?" rows={3} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 7: Selection Process */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader id="selection" icon={FlaskConical} title="Selection Process" />
              {expandedSections.selection && (
                <div className="space-y-4 pb-2">
                  <div className="flex items-center justify-between">
                    <Label>Resume Screening</Label>
                    <Switch checked={form.resume_screening} onCheckedChange={(v) => update("resume_screening", v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Interview Required</Label>
                    <Switch checked={form.interview_required} onCheckedChange={(v) => update("interview_required", v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Test / Assignment (if any)</Label>
                    <Textarea value={form.test_assignment} onChange={(e) => update("test_assignment", e.target.value)} placeholder="Describe any test or assignment..." rows={3} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 8: Application Details */}
          <Card>
            <CardContent className="pt-4">
              <SectionHeader id="application" icon={CalendarDays} title="Application Details" />
              {expandedSections.application && (
                <div className="space-y-4 pb-2">
                  <div className="space-y-2">
                    <Label>Last Date to Apply *</Label>
                    <Input type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Joining Process</Label>
                    <Textarea value={form.joining_process} onChange={(e) => update("joining_process", e.target.value)} placeholder="Describe the joining process after selection..." rows={3} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 pb-10">
            <Button onClick={() => handleSubmit("published")} disabled={loading || !form.title} className="flex-1">
              {loading ? "Publishing..." : "Publish Internship"}
            </Button>
            <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={loading || !form.title}>
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostInternship;
