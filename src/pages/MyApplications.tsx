import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Building2 } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewed: "bg-primary/10 text-primary border-primary/20",
  interview: "bg-accent/10 text-accent-foreground border-accent/20",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const MyApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchApplications = async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, internships(title, employer_id, employer_profiles:employer_profiles!internships_employer_id_fkey(company_name))")
        .eq("student_id", user.id)
        .order("applied_at", { ascending: false });
      setApplications(data || []);
      setLoading(false);
    };
    fetchApplications();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-10">
        <h1 className="font-display text-3xl font-bold mb-8">My Applications</h1>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : applications.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-display text-xl font-semibold">No applications yet</h3>
            <p className="mt-2 text-muted-foreground">
              <Link to="/internships" className="text-primary hover:underline">Browse internships</Link> to find your next opportunity
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Link key={app.id} to={`/internships/${app.internship_id}`}>
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <h3 className="font-semibold">{app.internships?.title}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {app.internships?.employer_profiles?.company_name || "Company"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Applied {format(new Date(app.applied_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={statusColors[app.status] || ""} variant="outline">
                      {app.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
