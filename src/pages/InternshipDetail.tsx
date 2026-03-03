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
import { MapPin, Clock, Building2, Calendar, ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

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
        .select("*, employer_profiles!internships_employer_id_fkey(company_name, logo_url, industry, website)")
        .eq("id", id!)
        .single();
      setInternship(data);

      if (user) {
        const { data: app } = await supabase.from("applications").select("id").eq("student_id", user.id).eq("internship_id", id!).maybeSingle();
        setHasApplied(!!app);

        if (role === "student") {
          const { data: sp } = await supabase.from("student_profiles").select("skills").eq("user_id", user.id).single();
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
    const { error } = await supabase.from("applications").insert({
      student_id: user.id,
      internship_id: id,
      cover_letter: coverLetter,
    });
    setApplying(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setHasApplied(true);
      setShowApplyForm(false);
      toast({ title: "Application submitted!", description: "The employer will review your application." });
    }
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
                  <span className="font-medium">{internship.employer_profiles?.company_name || "Company"}</span>
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

          {/* Description */}
          <div className="space-y-2">
            <h2 className="font-display text-lg font-semibold">About the role</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{internship.description}</p>
          </div>

          {/* Requirements */}
          {internship.requirements && (
            <div className="space-y-2">
              <h2 className="font-display text-lg font-semibold">Requirements</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{internship.requirements}</p>
            </div>
          )}

          {/* Skills */}
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
                <Button size="lg" className="w-full rounded-full h-14 text-base font-semibold" onClick={() => setShowApplyForm(true)}>
                  Apply Now
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
