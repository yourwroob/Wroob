import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Users } from "lucide-react";

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

  useEffect(() => {
    const fetchData = async () => {
      const { data: intern } = await supabase.from("internships").select("*").eq("id", id!).single();
      setInternship(intern);

      const { data: apps } = await supabase
        .from("applications")
        .select("*, profiles:profiles!applications_student_id_fkey(full_name, avatar_url), student_profiles:student_profiles!applications_student_id_fkey(skills, university, resume_url)")
        .eq("internship_id", id!)
        .order("applied_at", { ascending: false });
      setApplicants(apps || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

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
          <Skeleton className="h-96" />
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
                              <h3 className="font-semibold">{app.profiles?.full_name || "Unknown"}</h3>
                              {score > 0 && (
                                <Badge variant={score >= 70 ? "default" : "secondary"}>{score}% match</Badge>
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
                            {app.student_profiles?.resume_url && (
                              <Button variant="outline" size="sm" className="gap-1" asChild>
                                <a href={app.student_profiles.resume_url} target="_blank" rel="noopener">
                                  <Download className="h-3 w-3" /> Resume
                                </a>
                              </Button>
                            )}
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
