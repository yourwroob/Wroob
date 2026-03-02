import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Building2, Search, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Internship {
  id: string;
  title: string;
  description: string;
  skills_required: string[];
  location: string;
  type: string;
  deadline: string;
  industry: string;
  employer_id: string;
  created_at: string;
  employer_profiles?: { company_name: string; logo_url: string } | null;
}

const Internships = () => {
  const { user, role } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [studentSkills, setStudentSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("internships")
        .select("*, employer_profiles!internships_employer_id_fkey(company_name, logo_url)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      setInternships((data as any) || []);

      if (user && role === "student") {
        const { data: sp } = await supabase.from("student_profiles").select("skills").eq("user_id", user.id).single();
        if (sp?.skills) setStudentSkills(sp.skills);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, role]);

  const calcMatchScore = (required: string[]) => {
    if (!studentSkills.length || !required.length) return 0;
    const matched = required.filter((s) => studentSkills.includes(s)).length;
    return Math.round((matched / required.length) * 100);
  };

  const filtered = internships
    .filter((i) => {
      const matchesSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || i.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (studentSkills.length) return calcMatchScore(b.skills_required) - calcMatchScore(a.skills_required);
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Browse Internships</h1>
          <p className="mt-2 text-muted-foreground">Discover opportunities that match your skills</p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search internships..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-40" /></CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-display text-xl font-semibold">No internships found</h3>
            <p className="mt-2 text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((intern) => {
              const score = calcMatchScore(intern.skills_required);
              return (
                <Link key={intern.id} to={`/internships/${intern.id}`}>
                  <Card className="group h-full transition-all hover:border-primary/20 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-display text-lg group-hover:text-primary transition-colors">{intern.title}</CardTitle>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {(intern as any).employer_profiles?.company_name || "Company"}
                          </p>
                        </div>
                        {studentSkills.length > 0 && score > 0 && (
                          <Badge variant={score >= 70 ? "default" : "secondary"} className="shrink-0">
                            {score}% match
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{intern.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {intern.skills_required.slice(0, 3).map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                        {intern.skills_required.length > 3 && <Badge variant="outline" className="text-xs">+{intern.skills_required.length - 3}</Badge>}
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        {intern.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{intern.location}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{intern.type}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Internships;
