import { useEffect, useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, FileText, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import LocationCapture from "@/components/groups/LocationCapture";
import AvatarUpload from "@/components/AvatarUpload";
import FollowListDialog from "@/components/FollowListDialog";
import { useFollows } from "@/hooks/useFollows";
import { ReputationScoreCard } from "@/components/reputation/ReputationScoreCard";
import { useReputation } from "@/hooks/useReputation";
import { COURSE_CATEGORIES, SCHOOL_NAMES } from "@/data/courseData";
import CourseSearchSelect from "@/components/CourseSearchSelect";

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "0 months" },
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "9", label: "9 months" },
  { value: "12", label: "12 months" },
  { value: "15", label: "15 months" },
  { value: "18", label: "18 months" },
  { value: "21", label: "21 months" },
  { value: "24", label: "24 months" },
];

const FollowStats = ({ userId }: { userId: string }) => {
  const { followerCount, followingCount } = useFollows(userId);
  return <FollowListDialog userId={userId} followerCount={followerCount} followingCount={followingCount} />;
};


const DRAFT_KEY = "wroob_profile_draft";

const saveDraft = (userId: string, data: Record<string, any>) => {
  try { localStorage.setItem(`${DRAFT_KEY}_${userId}`, JSON.stringify(data)); } catch {}
};

const loadDraft = (userId: string): Record<string, any> | null => {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const clearDraft = (userId: string) => {
  try { localStorage.removeItem(`${DRAFT_KEY}_${userId}`); } catch {}
};

const Profile = () => {
  const { user, role, refreshProfile: refreshAuthProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", bio: "", avatar_url: "" });
  const [studentProfile, setStudentProfile] = useState({
    university: "", skills: [] as string[], resume_url: "",
    school_category: "", profile_role: "", phone_number: "",
    location: "", experience_years: "", is_student: true,
    current_job_title: "", current_company: "", not_employed: false,
    linkedin_url: "", website_url: "", preferred_course: "",
  });
  const [employerProfile, setEmployerProfile] = useState({
    company_name: "", industry: "", company_size: "", website: "",
    company_description: "", year_established: "", logo_url: "",
    head_office_address: "", city: "", state: "", pincode: "",
    head_office_landline: "", head_office_mobile: "",
    hr_contact_name: "", hr_designation: "", hr_email: "", hr_phone: "",
    gstin: "", pan_number: "", cin: "", linkedin_profile: "",
  });
  const { data: reputation, recalculate: recalcReputation } = useReputation(role === "student" ? user?.id : undefined);
  const [allSkills, setAllSkills] = useState<{ name: string; category: string }[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [locationCaptured, setLocationCaptured] = useState(false);
  const initialFetchDone = useRef(false);
  const currentUserId = useRef<string | null>(null);
  const dbFetchDone = useRef(false);

  // Persist draft to localStorage on every form change
  useEffect(() => {
    if (!user || !dbFetchDone.current) return;
    saveDraft(user.id, { profile, studentProfile, employerProfile });
  }, [profile, studentProfile, employerProfile, user]);

  useEffect(() => {
    if (!user || !role) return;
    if (initialFetchDone.current && currentUserId.current === user.id) return;
    currentUserId.current = user.id;
    initialFetchDone.current = true;

    const fetchData = async () => {
      const draft = loadDraft(user.id);

      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (p) {
        const dbProfile = { full_name: p.full_name || "", bio: p.bio || "", avatar_url: p.avatar_url || "" };
        setProfile(draft?.profile ? { ...dbProfile, ...draft.profile } : dbProfile);
      }

      if (role === "student") {
        const { data: sp } = await supabase.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (sp) {
          const d = sp as any;
          const savedRole = d.profile_role || "";
          const derivedCategory = savedRole ? SCHOOL_NAMES.find((s) => COURSE_CATEGORIES[s].includes(savedRole)) || "" : "";
          const dbStudent = {
            university: d.university || "", skills: d.skills || [], resume_url: d.resume_url || "",
            school_category: derivedCategory, profile_role: savedRole, phone_number: d.phone_number || "",
            location: d.location || "", experience_years: d.experience_years || "",
            is_student: d.is_student ?? true,
            current_job_title: d.current_job_title || "", current_company: d.current_company || "",
            not_employed: d.not_employed ?? false,
            linkedin_url: d.linkedin_url || "", website_url: d.website_url || "",
            preferred_course: d.preferred_course || "",
          };
          setStudentProfile(draft?.studentProfile ? { ...dbStudent, ...draft.studentProfile } : dbStudent);
        }
      } else if (role === "employer") {
        const { data: ep } = await supabase.from("employer_profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (ep) {
          const d = ep as any;
          const dbEmployer = {
            company_name: d.company_name || "", industry: d.industry || "",
            company_size: d.company_size || "", website: d.website || "",
            company_description: d.company_description || "",
            year_established: d.year_established ? String(d.year_established) : "",
            logo_url: d.logo_url || "",
            head_office_address: d.head_office_address || "",
            city: d.city || "", state: d.state || "", pincode: d.pincode || "",
            head_office_landline: d.head_office_landline || "",
            head_office_mobile: d.head_office_mobile || "",
            hr_contact_name: d.hr_contact_name || "", hr_designation: d.hr_designation || "",
            hr_email: d.hr_email || "", hr_phone: d.hr_phone || "",
            gstin: d.gstin || "", pan_number: d.pan_number || "",
            cin: d.cin || "", linkedin_profile: d.linkedin_profile || "",
          };
          setEmployerProfile(draft?.employerProfile ? { ...dbEmployer, ...draft.employerProfile } : dbEmployer);
        }
      }

      dbFetchDone.current = true;

      const { data: skills } = await supabase.from("skills").select("name, category").order("category").order("name");
      if (skills) setAllSkills(skills);

      if (role === "student") {
        const { data: sp2 } = await supabase.from("student_profiles").select("lat, lng").eq("user_id", user.id).maybeSingle();
        if (sp2 && (sp2 as any).lat && (sp2 as any).lng) setLocationCaptured(true);
      }
    };
    fetchData();
  }, [user, role]);

  const handleSave = async () => {
    if (!user) return;
    const bioWordCount = profile.bio?.trim().split(/\s+/).filter(Boolean).length || 0;
    if (bioWordCount > 100) {
      toast({ title: "Bio too long", description: "Bio must be 100 words or fewer.", variant: "destructive" });
      return;
    }
    if (role === "student" && studentProfile.phone_number && studentProfile.phone_number.length !== 10) {
      toast({ title: "Invalid phone number", description: "Phone number must be exactly 10 digits.", variant: "destructive" });
      return;
    }
    setLoading(true);
    await supabase.from("profiles").update({ full_name: profile.full_name, bio: profile.bio }).eq("user_id", user.id);

    if (role === "student") {
      await supabase.from("student_profiles").update({
        university: studentProfile.university,
        skills: studentProfile.skills,
        profile_role: studentProfile.profile_role,
        phone_number: studentProfile.phone_number || null,
        location: studentProfile.location,
        experience_years: studentProfile.experience_years,
        is_student: studentProfile.is_student,
        current_job_title: studentProfile.current_job_title,
        current_company: studentProfile.not_employed ? "" : studentProfile.current_company,
        not_employed: studentProfile.not_employed,
        linkedin_url: studentProfile.linkedin_url,
        website_url: studentProfile.website_url,
        preferred_course: studentProfile.preferred_course || null,
      } as any).eq("user_id", user.id);
    } else if (role === "employer") {
      await supabase.from("employer_profiles").update({
        ...employerProfile,
        year_established: employerProfile.year_established ? parseInt(employerProfile.year_established) : null,
      } as any).eq("user_id", user.id);
    }

    setLoading(false);
    clearDraft(user.id);
    toast({ title: "Profile updated!" });
    if (role === "student") recalcReputation();
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

  const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > MAX_RESUME_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 5 MB.", variant: "destructive" });
      e.target.value = "";
      return;
    }
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
    e.target.value = "";
  };

  const handleResumeDelete = async () => {
    if (!user || !studentProfile.resume_url) return;
    // Extract storage path from URL
    const urlParts = studentProfile.resume_url.split("/resumes/");
    if (urlParts.length > 1) {
      const storagePath = decodeURIComponent(urlParts[1]);
      await supabase.storage.from("resumes").remove([storagePath]);
    }
    setStudentProfile((p) => ({ ...p, resume_url: "" }));
    await supabase.from("student_profiles").update({ resume_url: null } as any).eq("user_id", user.id);
    toast({ title: "Resume deleted" });
  };

  const resumeFileName = studentProfile.resume_url
    ? decodeURIComponent(studentProfile.resume_url.split("/").pop() || "Resume")
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-10">
        <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>

        {role === "student" && reputation && (
          <div className="mb-6">
            <ReputationScoreCard score={reputation.reputation_score} breakdown={reputation.breakdown} />
          </div>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {user && (
                <div className="flex items-center gap-4">
                  <AvatarUpload
                    userId={user.id}
                    currentUrl={profile.avatar_url || null}
                    fullName={profile.full_name}
                    onUpload={(url) => { setProfile((p) => ({ ...p, avatar_url: url })); refreshAuthProfile(); }}
                  />
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Profile Photo</p>
                      <p className="text-xs text-muted-foreground">Click to upload or change</p>
                    </div>
                    <FollowStats userId={user.id} />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              {role === "student" && (
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">+91</div>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Enter 10-digit phone number"
                      value={studentProfile.phone_number}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setStudentProfile((p) => ({ ...p, phone_number: v }));
                      }}
                      className="flex-1"
                    />
                  </div>
                  {studentProfile.phone_number && studentProfile.phone_number.length > 0 && studentProfile.phone_number.length !== 10 && (
                    <p className="text-xs text-destructive">Phone number must be exactly 10 digits</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => {
                    const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= 100 || e.target.value.length < (profile.bio?.length || 0)) {
                      setProfile((p) => ({ ...p, bio: e.target.value }));
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const current = profile.bio || "";
                    const combined = current + pasted;
                    const words = combined.trim().split(/\s+/).filter(Boolean);
                    const trimmed = words.slice(0, 100).join(" ");
                    setProfile((p) => ({ ...p, bio: trimmed }));
                  }}
                  placeholder="Tell us about yourself..."
                />
                {(() => {
                  const count = profile.bio?.trim().split(/\s+/).filter(Boolean).length || 0;
                  return (
                    <p className={`text-xs ${count >= 100 ? "text-destructive" : "text-muted-foreground"}`}>
                      {count} / 100 words
                    </p>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {role === "student" && (
            <>
              <Card>
                <CardHeader><CardTitle>Student Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {/* Location */}
                  <div className="space-y-2">
                    <Label>Where are you based?</Label>
                    <LocationAutocomplete
                      value={studentProfile.location}
                      onChange={(v) => setStudentProfile((p) => ({ ...p, location: v }))}
                    />
                  </div>

                  {/* School / Category */}
                  <div className="space-y-2">
                    <Label>School / Category</Label>
                    <Select value={studentProfile.school_category} onValueChange={(v) => setStudentProfile((p) => ({ ...p, school_category: v, profile_role: "" }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your school" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_NAMES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Course / Programme */}
                  <div className="space-y-2">
                    <Label>Course / Programme</Label>
                    <CourseSearchSelect
                      schoolCategory={studentProfile.school_category}
                      value={studentProfile.profile_role}
                      onValueChange={(v) => setStudentProfile((p) => ({ ...p, profile_role: v }))}
                      disabled={!studentProfile.school_category}
                    />
                  </div>

                  {/* Preferred Course */}
                  <div className="space-y-2">
                    <Label>Preferred Course / Program</Label>
                    <p className="text-xs text-muted-foreground">Choose the course you'd ideally like to pursue or are most interested in</p>
                    <CourseSearchSelect
                      schoolCategory={studentProfile.school_category}
                      value={studentProfile.preferred_course}
                      onValueChange={(v) => setStudentProfile((p) => ({ ...p, preferred_course: v }))}
                      disabled={!studentProfile.school_category}
                    />
                  </div>

                  {/* University */}
                  <div className="space-y-2">
                    <Label>Your College or University</Label>
                    <Input value={studentProfile.university} onChange={(e) => setStudentProfile((p) => ({ ...p, university: e.target.value }))} placeholder="e.g., IIT Delhi" />
                  </div>

                  {/* Experience */}
                  <div className="space-y-2">
                    <Label>How many months of experience do you have?</Label>
                    <Select value={studentProfile.experience_years} onValueChange={(v) => setStudentProfile((p) => ({ ...p, experience_years: v }))}>
                      <SelectTrigger className="w-full sm:w-72">
                        <SelectValue placeholder="Select months of experience" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_OPTIONS.map((e) => (
                          <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Undergrad / PG */}
                  <div className="space-y-2">
                    <Label>Are you undergrad or PG?</Label>
                    <div className="flex gap-3">
                      {[
                        { value: true, label: "Undergraduate" },
                        { value: false, label: "Postgraduate" },
                      ].map((opt) => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setStudentProfile((p) => ({ ...p, is_student: opt.value }))}
                          className={`rounded-full px-6 py-2 text-sm font-medium border transition-all ${
                            studentProfile.is_student === opt.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card border-border text-foreground hover:border-muted-foreground/50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <Label>What skills do you currently have?</Label>
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

                  {/* Resume */}
                  <div className="space-y-3">
                    <Label>Resume</Label>
                    {studentProfile.resume_url ? (
                      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{resumeFileName}</p>
                          <p className="text-xs text-muted-foreground">Uploaded ✓</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Resume?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently remove your uploaded resume. You can upload a new one afterwards.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleResumeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium">Click to upload resume</span>
                        <span className="text-xs text-muted-foreground">.pdf, .doc, .docx — Max 5 MB</span>
                        <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Current Work */}
              <Card>
                <CardHeader><CardTitle>Current Work</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">Your company will never see that you're looking for a job</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        placeholder="e.g., Design Director"
                        value={studentProfile.current_job_title}
                        onChange={(e) => setStudentProfile((p) => ({ ...p, current_job_title: e.target.value }))}
                        disabled={studentProfile.not_employed}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        placeholder="e.g., Omnicorp"
                        value={studentProfile.current_company}
                        onChange={(e) => setStudentProfile((p) => ({ ...p, current_company: e.target.value }))}
                        disabled={studentProfile.not_employed}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="profile-not-employed"
                      checked={studentProfile.not_employed}
                      onCheckedChange={(v) => setStudentProfile((p) => ({ ...p, not_employed: !!v }))}
                    />
                    <Label htmlFor="profile-not-employed" className="text-sm">I'm not currently employed</Label>
                  </div>
                </CardContent>
              </Card>


              {/* Links & Community */}
              <Card>
                <CardHeader><CardTitle>Links & Community</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>LinkedIn Profile</Label>
                    <Input
                      placeholder="https://linkedin.com/in/"
                      value={studentProfile.linkedin_url}
                      onChange={(e) => setStudentProfile((p) => ({ ...p, linkedin_url: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Your Website</Label>
                    <Input
                      placeholder="https://mypersonalwebsite.com"
                      value={studentProfile.website_url}
                      onChange={(e) => setStudentProfile((p) => ({ ...p, website_url: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {role === "employer" && (
            <>
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
                    <Label>Company Description</Label>
                    <Textarea value={employerProfile.company_description} onChange={(e) => setEmployerProfile((p) => ({ ...p, company_description: e.target.value }))} placeholder="About your company..." rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input value={employerProfile.website} onChange={(e) => setEmployerProfile((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Year of Establishment</Label>
                      <Input type="number" value={employerProfile.year_established} onChange={(e) => setEmployerProfile((p) => ({ ...p, year_established: e.target.value }))} placeholder="e.g. 2015" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn Company Profile</Label>
                    <Input value={employerProfile.linkedin_profile} onChange={(e) => setEmployerProfile((p) => ({ ...p, linkedin_profile: e.target.value }))} placeholder="https://www.linkedin.com/company/..." />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Head Office Address</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea value={employerProfile.head_office_address} onChange={(e) => setEmployerProfile((p) => ({ ...p, head_office_address: e.target.value }))} placeholder="Full address" rows={2} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={employerProfile.city} onChange={(e) => setEmployerProfile((p) => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input value={employerProfile.state} onChange={(e) => setEmployerProfile((p) => ({ ...p, state: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Pincode</Label>
                      <Input value={employerProfile.pincode} onChange={(e) => setEmployerProfile((p) => ({ ...p, pincode: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Landline</Label>
                      <Input value={employerProfile.head_office_landline} onChange={(e) => setEmployerProfile((p) => ({ ...p, head_office_landline: e.target.value.replace(/\D/g, "") }))} placeholder="e.g. 01112345678" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mobile Number</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center justify-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">+91</div>
                        <Input type="tel" maxLength={10} value={employerProfile.head_office_mobile} onChange={(e) => setEmployerProfile((p) => ({ ...p, head_office_mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))} className="flex-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>HR Contact</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input value={employerProfile.hr_contact_name} onChange={(e) => setEmployerProfile((p) => ({ ...p, hr_contact_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Input value={employerProfile.hr_designation} onChange={(e) => setEmployerProfile((p) => ({ ...p, hr_designation: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={employerProfile.hr_email} onChange={(e) => setEmployerProfile((p) => ({ ...p, hr_email: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center justify-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">+91</div>
                        <Input type="tel" maxLength={10} value={employerProfile.hr_phone} onChange={(e) => setEmployerProfile((p) => ({ ...p, hr_phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} className="flex-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Legal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GSTIN</Label>
                      <Input maxLength={15} value={employerProfile.gstin} onChange={(e) => setEmployerProfile((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))} placeholder="15-character GSTIN" />
                    </div>
                    <div className="space-y-2">
                      <Label>PAN</Label>
                      <Input maxLength={10} value={employerProfile.pan_number} onChange={(e) => setEmployerProfile((p) => ({ ...p, pan_number: e.target.value.toUpperCase() }))} placeholder="10-character PAN" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>CIN (Company Identification Number)</Label>
                    <Input value={employerProfile.cin} onChange={(e) => setEmployerProfile((p) => ({ ...p, cin: e.target.value.toUpperCase() }))} />
                  </div>
                </CardContent>
              </Card>
            </>
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
