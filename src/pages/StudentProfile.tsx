import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, GraduationCap, Briefcase, Globe, Linkedin, ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/FollowButton";
import { ProfileSkeleton } from "@/components/skeletons";
import { useAuth } from "@/contexts/AuthContext";

const StudentProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, role } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["public-student-profile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");

      const [{ data: profile }, { data: studentProfile }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle(),
      ]);

      return { profile, studentProfile };
    },
    enabled: !!userId,
  });

  const profile = data?.profile;
  const sp = data?.studentProfile as any;

  const getInitials = () => {
    const name = profile?.full_name || "";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-10">
        <Link to="/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to LinkUp
        </Link>

        {isLoading ? (
          <ProfileSkeleton />
        ) : !profile ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Profile not found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Header card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback className="brand-gradient text-white text-xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display text-2xl font-bold truncate">{profile.full_name || "Student"}</h1>
                    {sp?.location && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5" /> {sp.location}
                      </p>
                    )}
                    {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
                    {user && user.id !== userId && (
                      <div className="mt-3 flex items-center gap-2">
                        <FollowButton targetUserId={userId!} />
                        {role === "student" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Dispatch custom event to open chat with this student
                              window.dispatchEvent(
                                new CustomEvent("open-dm", {
                                  detail: {
                                    partnerId: userId,
                                    partnerName: profile.full_name || "Student",
                                    partnerAvatar: profile.avatar_url,
                                  },
                                })
                              );
                            }}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic details */}
            {sp && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Student Details</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {sp.university && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{sp.university}</span>
                    </div>
                  )}
                  {sp.profile_role && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Course:</span> {sp.profile_role}
                    </div>
                  )}
                  {sp.preferred_course && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Preferred Course:</span> {sp.preferred_course}
                    </div>
                  )}
                  {sp.experience_years && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Experience:</span> {sp.experience_years} months
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {sp?.skills && sp.skills.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Skills</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sp.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current work */}
            {sp && !sp.not_employed && sp.current_job_title && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Current Work</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{sp.current_job_title}{sp.current_company ? ` at ${sp.current_company}` : ""}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Links */}
            {(sp?.linkedin_url || sp?.website_url) && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Links</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {sp.linkedin_url && (
                    <a href={sp.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Linkedin className="h-4 w-4" /> LinkedIn Profile
                    </a>
                  )}
                  {sp.website_url && (
                    <a href={sp.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Globe className="h-4 w-4" /> Personal Website
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
