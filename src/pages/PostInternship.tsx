import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const PostInternship = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allSkills, setAllSkills] = useState<{ name: string; category: string }[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", requirements: "", location: "",
    type: "remote" as "remote" | "onsite" | "hybrid",
    skills_required: [] as string[], deadline: "", industry: "",
  });

  useEffect(() => {
    supabase.from("skills").select("name, category").order("category").order("name").then(({ data }) => {
      if (data) setAllSkills(data);
    });
  }, []);

  const addSkill = (skill: string) => {
    if (!form.skills_required.includes(skill)) setForm((f) => ({ ...f, skills_required: [...f.skills_required, skill] }));
    setSkillSearch("");
  };

  const removeSkill = (skill: string) => {
    setForm((f) => ({ ...f, skills_required: f.skills_required.filter((s) => s !== skill) }));
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("internships").insert({
      ...form,
      employer_id: user.id,
      status,
      deadline: form.deadline || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "published" ? "Internship published!" : "Draft saved!" });
      navigate("/my-internships");
    }
  };

  const filteredSkills = allSkills.filter((s) => s.name.toLowerCase().includes(skillSearch.toLowerCase()) && !form.skills_required.includes(s.name));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-10">
        <h1 className="font-display text-3xl font-bold mb-8">Post Internship</h1>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Frontend Developer Intern" required />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the role, responsibilities..." rows={6} />
            </div>
            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} placeholder="What qualifications are needed?" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. San Francisco, CA" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} placeholder="e.g. Technology" />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.skills_required.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">{s} <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(s)} /></Badge>
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
            <div className="flex gap-3">
              <Button onClick={() => handleSubmit("published")} disabled={loading || !form.title}>
                {loading ? "Publishing..." : "Publish"}
              </Button>
              <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={loading || !form.title}>
                Save as Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostInternship;
