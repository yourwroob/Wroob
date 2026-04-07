import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, Linkedin, ArrowLeft, MapPin, Users, BadgeCheck, Calendar, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/FollowButton";
import { useAuth } from "@/contexts/AuthContext";

const EmployerProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["public-employer-profile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");

      const [{ data: employer }, { data: internships }] = await Promise.all([
        supabase.from("employer_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("internships").select("id, title, type, location, status, created_at").eq("employer_id", userId).eq("status", "published").order("created_at", { ascending: false }).limit(10),
      ]);

      return { employer, internships: internships || [] };
    },
    enabled: !!userId,
  });

  const ep = data?.employer;
  const internships = data?.internships || [];

  const getInitials = () => {
    const name = ep?.company_name || "";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "C";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-10">
        <Link to="/internships" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Internships
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !ep ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Company profile not found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={ep.logo_url ?? undefined} />
                    <AvatarFallback className="brand-gradient text-white text-xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-2xl font-bold truncate">{ep.company_name || "Company"}</h1>
                      {ep.is_verified && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 gap-1 shrink-0">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                    </div>
                    {ep.industry && (
                      <p className="text-sm text-muted-foreground mt-1">{ep.industry}</p>
                    )}
                    {(ep.city || ep.state) && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5" /> {[ep.city, ep.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {ep.company_description && (
                      <p className="text-sm mt-2 line-clamp-3">{ep.company_description}</p>
                    )}
                    {user && user.id !== userId && (
                      <div className="mt-3">
                        <FollowButton targetUserId={userId!} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Details */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Company Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {ep.company_size && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Company Size: {ep.company_size}</span>
                  </div>
                )}
                {ep.year_established && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Established: {ep.year_established}</span>
                  </div>
                )}
                {ep.funding_stage && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>Funding: {ep.funding_stage}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Links */}
            {(ep.website || ep.linkedin_profile) && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Links</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {ep.website && (
                    <a href={ep.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Globe className="h-4 w-4" /> Website
                    </a>
                  )}
                  {ep.linkedin_profile && (
                    <a href={ep.linkedin_profile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Published Internships */}
            {internships.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Active Internships</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {internships.map((intern: any) => (
                    <Link
                      key={intern.id}
                      to={`/internships/${intern.id}`}
                      className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-sm">{intern.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {intern.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{intern.location}</span>}
                        <span className="capitalize">{intern.type}</span>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerProfile;