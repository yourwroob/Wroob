import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import InternshipForm, { InternshipFormData } from "@/components/internship/InternshipForm";
import { useToast } from "@/hooks/use-toast";

const PostInternship = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form: InternshipFormData, status: "draft" | "published") => {
    if (!user) return;
    setLoading(true);

    const appCap = form.slots * 2;
    const { error } = await supabase.from("internships").insert({
      title: form.title,
      department: form.department,
      slots: form.slots,
      internship_category: form.internship_category,
      industry: form.industry,
      type: form.type,
      location: form.location || null,
      duration_months: form.duration_months,
      start_date: form.start_date || null,
      working_days: form.working_days,
      working_hours: form.working_hours,
      stipend_type: form.stipend_type,
      stipend_amount: form.stipend_amount ? parseFloat(form.stipend_amount) : null,
      benefits: form.benefits,
      skills_required: form.skills_required,
      eligibility: form.eligibility.length > 0 ? form.eligibility : null,
      description: form.description,
      roles_responsibilities: form.roles_responsibilities,
      day_to_day_tasks: form.day_to_day_tasks || null,
      projects: form.projects || null,
      requirements: form.requirements || null,
      resume_screening: form.resume_screening,
      interview_required: form.interview_required,
      test_assignment: form.test_assignment || null,
      deadline: form.deadline || null,
      joining_process: form.joining_process || null,
      employer_id: user.id,
      status,
      app_cap: appCap,
      application_count: 0,
    } as any);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: status === "published" ? "Internship published!" : "Draft saved!" });
      navigate("/my-internships");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-10">
        <h1 className="font-display text-3xl font-bold mb-8">Post Internship</h1>
        <InternshipForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default PostInternship;
