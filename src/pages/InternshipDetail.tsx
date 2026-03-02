import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Building2, Calendar, ArrowLeft, CheckCircle } from "lucide-react";
import { format } from "date-fns";

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
        <Button variant="ghost" className="mb-6 gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold">{internship.title}</h1>
                <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {internship.employer_profiles?.company_name || "Company"}
                </p>
              </div>
              {score !== null && (
                <Badge variant={score >= 70 ? "default" : "secondary"} className="text-lg px-4 py-1 shrink-0">
                  {score}% match
                </Badge>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {internship.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{internship.location}</span>}
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{internship.type}</span>
              {internship.deadline && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Deadline: {format(new Date(internship.deadline), "MMM d, yyyy")}</span>}
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm">{internship.description}</p></CardContent>
          </Card>

          {internship.requirements && (
            <Card>
              <CardHeader><CardTitle>Requirements</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{internship.requirements}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Required Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {internship.skills_required.map((s: string) => (
                  <Badge key={s} variant={studentSkills.includes(s) ? "default" : "outline"}>{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {role === "student" && (
            <div>
              {hasApplied ? (
                <div className="flex items-center gap-2 rounded-lg bg-success/10 p-4 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">You've already applied to this internship</span>
                </div>
              ) : showApplyForm ? (
                <Card>
                  <CardHeader><CardTitle>Apply</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Cover Letter (optional)</Label>
                      <Textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Why are you interested in this internship?" rows={6} />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleApply} disabled={applying}>{applying ? "Submitting..." : "Submit Application"}</Button>
                      <Button variant="outline" onClick={() => setShowApplyForm(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button size="lg" className="w-full" onClick={() => setShowApplyForm(true)}>Apply Now</Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternshipDetail;
