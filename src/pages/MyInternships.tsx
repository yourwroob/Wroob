import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MyInternshipsSkeleton } from "@/components/skeletons";
import { Plus, Users, Briefcase, Pencil, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success/10 text-success border-success/20",
  closed: "bg-destructive/10 text-destructive border-destructive/20",
};

const MyInternships = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("internships")
        .select("*, applications(count)")
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false });
      setInternships(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleClose = async (id: string) => {
    setClosingId(id);
    const { error } = await supabase
      .from("internships")
      .update({ status: "closed" as any })
      .eq("id", id);
    setClosingId(null);
    if (error) {
      toast.error("Failed to close internship");
    } else {
      toast.success("Internship closed successfully");
      setInternships((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "closed" } : i))
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">My Internships</h1>
          <Button onClick={() => navigate("/post-internship")} className="gap-2">
            <Plus className="h-4 w-4" /> Post New
          </Button>
        </div>

        {loading ? (
          <MyInternshipsSkeleton />
        ) : internships.length === 0 ? (
          <div className="py-20 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-display text-xl font-semibold">No internships yet</h3>
            <p className="mt-2 text-muted-foreground">Post your first internship to start finding talent</p>
            <Button className="mt-4" onClick={() => navigate("/post-internship")}>Post Internship</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {internships.map((intern) => (
              <Card key={intern.id} className="transition-all hover:shadow-md">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <h3 className="font-semibold">{intern.title}</h3>
                    <div className="mt-2 flex items-center gap-3">
                      <Badge variant="outline" className={statusColors[intern.status]}>{intern.status}</Badge>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {intern.applications?.[0]?.count || 0} applicants
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/internships/${intern.id}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/internships/${intern.id}/applicants`}>View Applicants</Link>
                    </Button>
                    {intern.status !== "closed" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={closingId === intern.id}>
                            <XCircle className="h-3.5 w-3.5 mr-1" />Close
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Close this internship?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will stop accepting new applications for <strong>{intern.title}</strong>. Existing applications will not be affected. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleClose(intern.id)}>
                              Yes, close internship
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInternships;
