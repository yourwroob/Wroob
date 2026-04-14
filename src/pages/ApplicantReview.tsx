import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProfileLink from "@/components/ProfileLink";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicantListSkeleton } from "@/components/skeletons";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, MessageCircle, Users } from "lucide-react";
import { CandidateScoreBadge } from "@/components/reputation/ReputationScoreCard";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewed: "bg-primary/10 text-primary border-primary/20",
  interview: "bg-accent/10 text-accent-foreground border-accent/20",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const ApplicantReview = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [internship, setInternship] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // FIX (HIGH-resume-private): signed URLs generated at fetch time (1-hour TTL).
  const [resumeSignedUrls, setResumeSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: intern } = await supabase.from("internships").select("*").eq("id", id!).maybeSingle();

      // SECURITY: Verify this employer owns the internship before showing applicants.
      // RLS enforces this at the DB level, but an explicit UI check provides
      // defence-in-depth and a clean redirect rather than an empty applicant list.
      if (!intern || intern.employer_id !== user.id) {
        navigate("/my-internships", { replace: true });
        return;
      }

      setInternship(intern);

      const { data: apps } = await supabase
        .from("applications")
        .select("*, profiles:profiles!applications_student_id_fkey(full_name, avatar_url), student_profiles:student_profiles!applications_student_id_fkey(skills, university, resume_url, reputation_score)")
        .eq("internship_id", id!)
        .order("applied_at", { ascending: false });
      const appsData = apps || [];
      setApplicants(appsData);

      // Generate 1-hour signed URLs for each applicant's resume.
      // The resumes bucket is private; public URLs return 403 when opened in the browser.
      const urlMap: Record<string, string> = {};
      await Promise.all(
        appsData.map(async (app: any) => {
          const stored = app.student_profiles?.resume_url;
          if (!stored) return;
          // Support both new (path) and legacy (full URL) storage formats.
          const storagePath = stored.startsWith("http")
            ? decodeURIComponent(stored.split("/resumes/")[1] || "")
            : stored;
          if (!storagePath) return;
          const { data } = await supabase.storage.from("resumes").createSignedUrl(storagePath, 3600);
          if (data?.signedUrl) urlMap[app.id] = data.signedUrl;
        })
      );
      setResumeSignedUrls(urlMap);
      setLoading(false);
    };
    fetchData();
  }, [id, user, navigate]);

  const updateStatus = async (appId: string, status: "pending" | "reviewed" | "interview" | "accepted" | "rejected") => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", appId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
      toast({ title: `Status updated to ${status}` });
    }
  };

  const calcMatch = (studentSkills: string[]) => {
    if (!internship?.skills_required?.length || !studentSkills?.length) return 0;
    const matched = internship.skills_required.filter((s: string) => studentSkills.includes(s)).length;
    return Math.round((matched / internship.skills_required.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-10">
        <Button variant="ghost" className="mb-6 gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {loading ? (
          <ApplicantListSkeleton />
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold">{internship?.title}</h1>
              <p className="mt-2 text-muted-foreground">{applicants.length} applicants</p>
            </div>

            {applicants.length === 0 ? (
              <div className="py-20 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-display text-xl font-semibold">No applicants yet</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {applicants.map((app) => {
                  const score = calcMatch(app.student_profiles?.skills || []);
                  return (
                    <Card key={app.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <ProfileLink userId={app.student_id} type="student" className="font-semibold">{app.profiles?.full_name || "Unknown"}</ProfileLink>
                              {score > 0 && (
                                <Badge variant={score >= 70 ? "default" : "secondary"}>{score}% match</Badge>
                              )}
                              {(app.student_profiles as any)?.reputation_score > 0 && (
                                <CandidateScoreBadge score={Number((app.student_profiles as any).reputation_score)} />
                              )}
                            </div>
                            {app.student_profiles?.university && (
                              <p className="mt-1 text-sm text-muted-foreground">{app.student_profiles.university}</p>
                            )}
                            {app.student_profiles?.skills?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {app.student_profiles.skills.slice(0, 5).map((s: string) => (
                                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                                ))}
                              </div>
                            )}
                            {app.cover_letter && (
                              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{app.cover_letter}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Select value={app.status} onValueChange={(v: "pending" | "reviewed" | "interview" | "accepted" | "rejected") => updateStatus(app.id, v)}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="interview">Interview</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                            {app.student_profiles?.resume_url && resumeSignedUrls[app.id] && (
                              <Button variant="outline" size="sm" className="gap-1" asChild>
                                <a href={resumeSignedUrls[app.id]} target="_blank" rel="noopener">
                                  <Download className="h-3 w-3" /> Resume
                                </a>
                              </Button>
                            )}
                            {/* FIX (HIGH-employer-dm): Employers can now initiate DMs
                                directly from the applicant card without visiting the
                                student's public profile page first. */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() =>
                                window.dispatchEvent(
                                  new CustomEvent("open-dm", {
                                    detail: {
                                      partnerId: app.student_id,
                                      partnerName: app.profiles?.full_name || "Applicant",
                                      partnerAvatar: app.profiles?.avatar_url ?? null,
                                      partnerRole: "student",
                                    },
                                  })
                                )
                              }
                            >
                              <MessageCircle className="h-3 w-3" /> Message
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicantReview;
