import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap, MapPin, Users } from "lucide-react";
import FollowButton from "@/components/FollowButton";
import { motion } from "framer-motion";

interface StudentCard {
  user_id: string;
  university: string | null;
  major: string | null;
  skills: string[] | null;
  location: string | null;
  graduation_year: number | null;
  full_name: string | null;
  avatar_url: string | null;
}

const StudentDiscovery = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["student-discovery"],
    queryFn: async () => {
      // Fetch student profiles
      const { data: studentProfiles } = await supabase
        .from("student_profiles")
        .select("user_id, university, major, skills, location, graduation_year")
        .eq("onboarding_status", "completed")
        .limit(100);

      if (!studentProfiles || studentProfiles.length === 0) return [];

      const userIds = studentProfiles.map((s) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      return studentProfiles.map((s) => ({
        ...s,
        full_name: profileMap.get(s.user_id)?.full_name ?? null,
        avatar_url: profileMap.get(s.user_id)?.avatar_url ?? null,
      })) as StudentCard[];
    },
    enabled: !!user,
  });

  const filtered = students.filter((s) => {
    if (!search) return s.user_id !== user?.id;
    const q = search.toLowerCase();
    return (
      s.user_id !== user?.id &&
      (s.full_name?.toLowerCase().includes(q) ||
        s.university?.toLowerCase().includes(q) ||
        s.major?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.skills?.some((sk) => sk.toLowerCase().includes(q)))
    );
  });

  const getInitials = (name: string | null) =>
    (name || "?")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Discover Students
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse student profiles, connect, and grow your network.
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, university, skills, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No students found</p>
            <p className="text-sm">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((student, i) => (
              <motion.div
                key={student.user_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 shrink-0">
                        <AvatarImage src={student.avatar_url ?? undefined} />
                        <AvatarFallback className="brand-gradient text-white text-sm font-semibold">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {student.full_name || "Student"}
                            </h3>
                            {student.university && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {student.major ? `${student.major} · ` : ""}
                                  {student.university}
                                </span>
                              </p>
                            )}
                            {student.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{student.location}</span>
                              </p>
                            )}
                          </div>
                          <FollowButton targetUserId={student.user_id} />
                        </div>
                        {student.skills && student.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {student.skills.slice(0, 4).map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {student.skills.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{student.skills.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDiscovery;
