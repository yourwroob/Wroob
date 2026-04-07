import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { InternshipCapBar } from "@/components/InternshipCapBar";
import ProfileLink from "@/components/ProfileLink";
import {
  MapPin, Clock, Building2, Calendar, ArrowLeft, CheckCircle, ExternalLink,
  IndianRupee, Briefcase, GraduationCap, FileText, FlaskConical, Users, BadgeCheck,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const BENEFIT_LABELS: Record<string, string> = {
  certificate: "Certificate",
  ppo: "PPO (Job Offer)",
  incentives: "Incentives",
  travel_allowance: "Travel Allowance",
};

const InternshipDetail = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [internship, setInternship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [studentSkills, setStudentSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("internships")
        .select("*")
        .eq("id", id!)
        .maybeSingle();

      if (data) {
        const { data: ep } = await supabase
          .from("employer_profiles")
          .select("company_name, logo_url, industry, website, is_verified")
          .eq("user_id", data.employer_id)
          .maybeSingle();
        setInternship({ ...data, employer_profiles: ep });
      } else {
        setInternship(null);
      }

      if (user) {
        const { data: app } = await supabase.from("applications").select("id").eq("student_id", user.id).eq("internship_id", id!).maybeSingle();
        setHasApplied(!!app);

        if (role === "student") {
          const { data: sp } = await supabase.from("student_profiles").select("skills").eq("user_id", user.id).maybeSingle();
          if (sp?.skills) setStudentSkills(sp.skills);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user, role]);

  const handleApply = async () => {
    if (!user || !id) return;
    setApplying(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please log in", variant: "destructive" });
        setApplying(false);
        return;
      }

      const res = await supabase.functions.invoke("apply-to-internship", {
        body: { internship_id: id, cover_letter: coverLetter },
      });

      if (res.error || res.data?.error) {
        const code = res.data?.code;
        const msg = code === "RATE_LIMITED"
          ? "⏳ You're applying too fast. Please wait a moment and try again."
          : code === "CAPACITY_REACHED"
          ? "⚠️ Applications are full for this role."
          : code === "DUPLICATE"
          ? "You have already applied to this internship."
          : res.data?.error || res.error?.message || "Something went wrong";
        toast({ title: "Error", description: msg, variant: "destructive" });
      } else {
        setHasApplied(true);
        setShowApplyForm(false);
        if (res.data?.application_count != null) {
          setInternship((prev: any) => ({
            ...prev,
            application_count: res.data.application_count,
            status: res.data.application_count >= prev.app_cap ? "closed" : prev.status,
          }));
        }
        toast({ title: "Application submitted!", description: res.data?.message || "The employer will review your application." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }

    setApplying(false);
  };

  const matchScore = () => {
    if (!studentSkills.length || !internship?.skills_required?.length) return null;
    const matched = internship.skills_required.filter((s: string) => studentSkills.includes(s)).length;
    return Math.round((matched / internship.skills_required.length) * 100);
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-10"><Skeleton className="h-96" /></div>
    </div>
  );

  if (!internship) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-20 text-center">
        <h2 className="font-display text-2xl font-bold">Internship not found</h2>
        <Button className="mt-4" onClick={() => navigate("/internships")}>Browse Internships</Button>
      </div>
    </div>
  );

  const score = matchScore();
  const isFull = internship.application_count >= internship.app_cap;
  const isClosed = internship.status === "closed";

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-semibold flex items-center gap-2">
        <Icon className="h-4.5 w-4.5 text-primary" />{title}
      </h2>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-10">
        <Button variant="ghost" size="sm" className="mb-8 gap-1.5 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold md:text-4xl">{internship.title}</h1>
                <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <ProfileLink userId={internship.employer_id} type="employer" className="font-medium">
                    {internship.employer_profiles?.company_name || "Company"}
                  </ProfileLink>
                  {internship.employer_profiles?.is_verified && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                  {internship.employer_profiles?.website && (
                    <a href={internship.employer_profiles.website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
              {score !== null && (
                <Badge variant={score >= 70 ? "default" : "secondary"} className="text-base px-4 py-1.5 shrink-0 font-semibold">
                  {score}% match
                </Badge>
              )}
            </div>

            {/* Meta tags */}
            <div className="mt-6 flex flex-wrap gap-2">
              {internship.location && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">
                  <MapPin className="h-3.5 w-3.5" />{internship.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium capitalize">
                <Clock className="h-3.5 w-3.5" />{internship.type}
              </span>
              {internship.internship_category && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium capitalize">
                  <Briefcase className="h-3.5 w-3.5" />{internship.internship_category}
                </span>
              )}
              {internship.department && (
                <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">{internship.department}</span>
              )}
              {internship.duration_months && (
                <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">
                  {internship.duration_months} month{internship.duration_months > 1 ? "s" : ""}
                </span>
              )}
              {internship.deadline && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">
                  <Calendar className="h-3.5 w-3.5" />Deadline: {format(new Date(internship.deadline), "MMM d, yyyy")}
                </span>
              )}
              {internship.industry && (
                <span className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium">{internship.industry}</span>
              )}
            </div>
          </div>

          {/* Capacity Bar */}
          {internship.app_cap > 0 && (
            <InternshipCapBar applicationCount={internship.application_count} appCap={internship.app_cap} slots={internship.slots} />
          )}

          {/* Duration & Timing */}
          {(internship.start_date || internship.working_days || internship.working_hours) && (
            <Section icon={Clock} title="Duration & Timing">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {internship.start_date && (
                  <div><span className="text-muted-foreground">Start Date:</span> {format(new Date(internship.start_date), "MMM d, yyyy")}</div>
                )}
                {internship.working_days && (
                  <div><span className="text-muted-foreground">Working Days:</span> {internship.working_days}</div>
                )}
                {internship.working_hours && (
                  <div><span className="text-muted-foreground">Working Hours:</span> {internship.working_hours}</div>
                )}
              </div>
            </Section>
          )}

          {/* Stipend & Benefits */}
          {(internship.stipend_type || (internship.benefits && internship.benefits.length > 0)) && (
            <Section icon={IndianRupee} title="Stipend & Benefits">
              <div className="text-sm space-y-2">
                {internship.stipend_type && (
                  <p>
                    <span className="text-muted-foreground">Stipend:</span>{" "}
                    <span className="capitalize font-medium">{internship.stipend_type}</span>
                    {internship.stipend_amount && <span> — ₹{Number(internship.stipend_amount).toLocaleString()}/month</span>}
                  </p>
                )}
                {internship.benefits && internship.benefits.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {internship.benefits.map((b: string) => (
                      <Badge key={b} variant="outline">{BENEFIT_LABELS[b] || b}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Description */}
          {internship.description && (
            <Section icon={FileText} title="About the Role">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{internship.description}</p>
            </Section>
          )}

          {/* Roles & Responsibilities */}
          {internship.roles_responsibilities && (
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold">Roles & Responsibilities</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{internship.roles_responsibilities}</p>
            </div>
          )}

          {/* Day-to-day Tasks */}
          {internship.day_to_day_tasks && (
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold">Day-to-Day Tasks</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{internship.day_to_day_tasks}</p>
            </div>
          )}

          {/* Projects */}
          {internship.projects && (
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold">Projects</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{internship.projects}</p>
            </div>
          )}

          {/* Requirements */}
          {internship.requirements && (
            <div className="space-y-2">
              <h2 className="font-display text-lg font-semibold">Requirements</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{internship.requirements}</p>
            </div>
          )}

          {/* Skills */}
          {internship.skills_required?.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {internship.skills_required.map((s: string) => (
                  <span
                    key={s}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      studentSkills.includes(s)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Eligibility */}
          {internship.eligibility && internship.eligibility.length > 0 && (
            <Section icon={GraduationCap} title="Eligibility (Courses)">
              <div className="flex flex-wrap gap-2">
                {internship.eligibility.map((c: string) => (
                  <Badge key={c} variant="secondary">{c}</Badge>
                ))}
              </div>
            </Section>
          )}

          {/* Selection Process */}
          {(internship.resume_screening !== null || internship.interview_required !== null || internship.test_assignment) && (
            <Section icon={FlaskConical} title="Selection Process">
              <ul className="text-sm space-y-1.5 text-muted-foreground">
                {internship.resume_screening && <li>✓ Resume Screening</li>}
                {internship.interview_required && <li>✓ Interview</li>}
                {internship.test_assignment && <li>✓ Test/Assignment: {internship.test_assignment}</li>}
              </ul>
            </Section>
          )}

          {/* Joining Process */}
          {internship.joining_process && (
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold">Joining Process</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{internship.joining_process}</p>
            </div>
          )}

          {/* Openings */}
          {internship.slots && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{internship.slots} opening{internship.slots > 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Apply section */}
          {role === "student" && (
            <div className="sticky bottom-6 pt-4">
              {hasApplied ? (
                <div className="flex items-center gap-2 rounded-xl bg-success/10 p-4 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">You've already applied to this internship</span>
                </div>
              ) : showApplyForm ? (
                <div className="rounded-xl border bg-card p-6 space-y-4">
                  <h3 className="font-display text-lg font-semibold">Apply</h3>
                  <div className="space-y-2">
                    <Label>Cover Letter (optional)</Label>
                    <Textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Why are you interested in this internship?" rows={6} />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleApply} disabled={applying} className="rounded-full px-8">
                      {applying ? "Submitting..." : "Submit Application"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowApplyForm(false)} className="rounded-full">Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full rounded-full h-14 text-base font-semibold"
                  onClick={() => setShowApplyForm(true)}
                  disabled={isFull || isClosed}
                >
                  {isFull ? "Applications Full" : isClosed ? "Internship Closed" : "Apply Now"}
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default InternshipDetail;
