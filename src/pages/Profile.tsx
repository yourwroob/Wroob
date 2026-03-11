import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import LocationCapture from "@/components/groups/LocationCapture";
import AvatarUpload from "@/components/AvatarUpload";

const Profile = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", bio: "", avatar_url: "" });
  const [studentProfile, setStudentProfile] = useState({ university: "", major: "", graduation_year: "", skills: [] as string[], resume_url: "" });
  const [employerProfile, setEmployerProfile] = useState({ company_name: "", industry: "", company_size: "", website: "" });
  const [allSkills, setAllSkills] = useState<{ name: string; category: string }[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [locationCaptured, setLocationCaptured] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (p) setProfile({ full_name: p.full_name || "", bio: p.bio || "", avatar_url: p.avatar_url || "" });

      if (role === "student") {
        const { data: sp } = await supabase.from("student_profiles").select("*").eq("user_id", user.id).single();
        if (sp) setStudentProfile({ university: sp.university || "", major: sp.major || "", graduation_year: sp.graduation_year?.toString() || "", skills: sp.skills || [], resume_url: sp.resume_url || "" });
      } else if (role === "employer") {
        const { data: ep } = await supabase.from("employer_profiles").select("*").eq("user_id", user.id).single();
        if (ep) setEmployerProfile({ company_name: ep.company_name || "", industry: ep.industry || "", company_size: ep.company_size || "", website: ep.website || "" });
      }

      const { data: skills } = await supabase.from("skills").select("name, category").order("category").order("name");
      if (skills) setAllSkills(skills);

      if (role === "student") {
        const { data: sp2 } = await supabase.from("student_profiles").select("lat, lng").eq("user_id", user.id).single();
        if (sp2 && (sp2 as any).lat && (sp2 as any).lng) setLocationCaptured(true);
      }
    };
    fetchData();
  }, [user, role]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from("profiles").update({ full_name: profile.full_name, bio: profile.bio }).eq("user_id", user.id);

    if (role === "student") {
      await supabase.from("student_profiles").update({
        university: studentProfile.university,
        major: studentProfile.major,
        graduation_year: studentProfile.graduation_year ? parseInt(studentProfile.graduation_year) : null,
        skills: studentProfile.skills,
      }).eq("user_id", user.id);
    } else if (role === "employer") {
      await supabase.from("employer_profiles").update(employerProfile).eq("user_id", user.id);
    }

    setLoading(false);
    toast({ title: "Profile updated!" });
  };

  const addSkill = (skill: string) => {
    if (!studentProfile.skills.includes(skill)) {
      setStudentProfile((p) => ({ ...p, skills: [...p.skills, skill] }));
    }
    setSkillSearch("");
  };

  const removeSkill = (skill: string) => {
    setStudentProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  };

  const filteredSkills = allSkills.filter(
    (s) => s.name.toLowerCase().includes(skillSearch.toLowerCase()) && !studentProfile.skills.includes(s.name)
  );

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/${file.name}`;
    const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(path);
      setStudentProfile((p) => ({ ...p, resume_url: publicUrl }));
      await supabase.from("student_profiles").update({ resume_url: publicUrl }).eq("user_id", user.id);
      toast({ title: "Resume uploaded!" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-10">
        <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              {user && (
                <div className="flex items-center gap-4">
                  <AvatarUpload
                    userId={user.id}
                    currentUrl={profile.avatar_url || null}
                    fullName={profile.full_name}
                    onUpload={(url) => setProfile((p) => ({ ...p, avatar_url: url }))}
                  />
                  <div>
                    <p className="text-sm font-medium">Profile Photo</p>
                    <p className="text-xs text-muted-foreground">Click to upload or change</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." />
              </div>
            </CardContent>
          </Card>

          {role === "student" && (
            <Card>
              <CardHeader><CardTitle>Student Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>University</Label>
                    <Input value={studentProfile.university} onChange={(e) => setStudentProfile((p) => ({ ...p, university: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Major</Label>
                    <Input value={studentProfile.major} onChange={(e) => setStudentProfile((p) => ({ ...p, major: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input type="number" value={studentProfile.graduation_year} onChange={(e) => setStudentProfile((p) => ({ ...p, graduation_year: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {studentProfile.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="gap-1">
                        {s} <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(s)} />
                      </Badge>
                    ))}
                  </div>
                  <Input placeholder="Search skills..." value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} />
                  {skillSearch && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-md border p-2">
                      {filteredSkills.map((s) => (
                        <button key={s.name} className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent" onClick={() => addSkill(s.name)}>
                          {s.name} <span className="text-xs text-muted-foreground">({s.category})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Resume</Label>
                  <Input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                  {studentProfile.resume_url && <p className="text-sm text-muted-foreground">Resume uploaded ✓</p>}
                </div>
                <div className="space-y-2">
                  <Label>Local Community Group</Label>
                  <LocationCapture
                    captured={locationCaptured}
                    onCapture={async (lat, lng) => {
                      if (!user) return;
                      setLocationCaptured(true);
                      await supabase.functions.invoke("geo-group-assign", {
                        body: { user_id: user.id, lat, lng },
                      });
                      toast({ title: "Location saved! You've been added to a local group." });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {role === "employer" && (
            <Card>
              <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={employerProfile.company_name} onChange={(e) => setEmployerProfile((p) => ({ ...p, company_name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Input value={employerProfile.industry} onChange={(e) => setEmployerProfile((p) => ({ ...p, industry: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Size</Label>
                    <Input value={employerProfile.company_size} onChange={(e) => setEmployerProfile((p) => ({ ...p, company_size: e.target.value }))} placeholder="e.g. 50-100" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={employerProfile.website} onChange={(e) => setEmployerProfile((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
