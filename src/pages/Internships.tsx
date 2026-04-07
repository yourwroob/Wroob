import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileLink from "@/components/ProfileLink";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Building2, Search, Briefcase, IndianRupee, CalendarDays, BadgeCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { InternshipListSkeleton } from "@/components/skeletons";
import { motion } from "framer-motion";

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
  stipend_type: string | null;
  stipend_amount: number | null;
  duration_months: number | null;
  employer_profiles?: { company_name: string; logo_url: string; is_verified: boolean | null } | null;
}

const Internships = () => {
  const { user, role } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stipendRange, setStipendRange] = useState<[number]>([0]);
  const [durationFilter, setDurationFilter] = useState("all");
  const [studentSkills, setStudentSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("internships")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      const internshipsRaw = (data as any[]) || [];

      // Batch-fetch employer profiles
      const employerIds = [...new Set(internshipsRaw.map((i) => i.employer_id))];
      let employerMap: Record<string, any> = {};
      if (employerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("employer_profiles")
          .select("user_id, company_name, logo_url, is_verified")
          .in("user_id", employerIds);
        if (profiles) {
          for (const p of profiles) employerMap[p.user_id] = p;
        }
      }

      setInternships(internshipsRaw.map((i) => ({
        ...i,
        employer_profiles: employerMap[i.employer_id] || null,
      })));

      if (user && role === "student") {
        const { data: sp } = await supabase.from("student_profiles").select("skills").eq("user_id", user.id).maybeSingle();
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
      const matchesCategory = categoryFilter === "all" || (i as any).internship_category === categoryFilter;
      const matchesStipend = stipendRange[0] === 0 || (i.stipend_amount != null && i.stipend_amount >= stipendRange[0]);
      const matchesDuration = durationFilter === "all" || (i.duration_months != null && String(i.duration_months) === durationFilter);
      return matchesSearch && matchesType && matchesCategory && matchesStipend && matchesDuration;
    })
    .sort((a, b) => {
      if (studentSkills.length) return calcMatchScore(b.skills_required) - calcMatchScore(a.skills_required);
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters sidebar */}
          <aside className="w-full shrink-0 lg:w-64">
            <div className="sticky top-24 space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold">Discover</h1>
                <p className="mt-1 text-sm text-muted-foreground">Find internships matching your skills</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>

                {/* Category filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="micro-internship">Micro-Internships</SelectItem>
                  </SelectContent>
                </Select>

                {/* Stipend filter */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Min Stipend: {stipendRange[0] === 0 ? "Any" : `₹${stipendRange[0].toLocaleString("en-IN")}/mo`}
                  </Label>
                  <Slider
                    value={stipendRange}
                    onValueChange={(v) => setStipendRange(v as [number])}
                    min={0}
                    max={50000}
                    step={1000}
                    className="py-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Any</span>
                    <span>₹50k</span>
                  </div>
                </div>

                {/* Duration filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Duration
                  </Label>
                  <Select value={durationFilter} onValueChange={setDurationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Durations</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 9, 12].map((m) => (
                        <SelectItem key={m} value={String(m)}>{m} month{m > 1 ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <InternshipListSkeleton />
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 font-display text-xl font-semibold">No internships found</h3>
                <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((intern, idx) => {
                  const score = calcMatchScore(intern.skills_required);
                  return (
                    <motion.div
                      key={intern.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <Link to={`/internships/${intern.id}`}>
                        <div className="group card-depth p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors truncate">
                                {intern.title}
                              </h3>
                              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                <ProfileLink userId={intern.employer_id} type="employer">
                                  {(intern as any).employer_profiles?.company_name || "Company"}
                                </ProfileLink>
                                {(intern as any).employer_profiles?.is_verified && (
                                  <span className="inline-flex items-center gap-0.5 text-green-600" title="Verified Company">
                                    <BadgeCheck className="h-3.5 w-3.5" />
                                  </span>
                                )}
                              </p>
                            </div>
                            {studentSkills.length > 0 && score > 0 && (
                              <Badge className={`shrink-0 font-medium border-0 text-white ${score >= 70 ? "brand-gradient shadow-md shadow-primary/20" : ""}`} variant={score >= 70 ? "default" : "secondary"}>
                                {score}% match
                              </Badge>
                            )}
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{intern.description}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex flex-wrap gap-1.5">
                              {intern.skills_required.slice(0, 4).map((s) => (
                                <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">{s}</span>
                              ))}
                              {intern.skills_required.length > 4 && (
                                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">+{intern.skills_required.length - 4}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              {intern.stipend_amount != null && intern.stipend_amount > 0 && (
                                <span className="flex items-center gap-1 font-medium text-foreground"><IndianRupee className="h-3 w-3" />₹{intern.stipend_amount.toLocaleString("en-IN")}/mo</span>
                              )}
                              {intern.stipend_type === "unpaid" && <span className="text-muted-foreground">Unpaid</span>}
                              {intern.duration_months && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{intern.duration_months}mo</span>}
                              {intern.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{intern.location}</span>}
                              <span className="flex items-center gap-1 capitalize"><Clock className="h-3 w-3" />{intern.type}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Internships;
