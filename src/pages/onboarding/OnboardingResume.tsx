import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ACCEPTED_TYPES = [".pdf", ".doc", ".docx", ".rtf", ".txt"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const OnboardingResume = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeOnboarding } = useOnboardingStatus();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED_TYPES.join(",");
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !user) return;

      if (file.size > MAX_SIZE) {
        toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !ACCEPTED_TYPES.some((t) => t.endsWith(ext))) {
        toast({ title: "Invalid file type", description: `Accepted: ${ACCEPTED_TYPES.join(", ")}`, variant: "destructive" });
        return;
      }

      setUploading(true);
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });

      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(path);
      await supabase.from("student_profiles").update({ resume_url: publicUrl } as any).eq("user_id", user.id);

      setUploading(false);
      setUploaded(true);
      toast({ title: "Resume uploaded successfully!" });

      await completeOnboarding();
      setTimeout(() => navigate("/onboarding/done"), 500);
    };
    input.click();
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigate("/onboarding/done");
  };

  return (
    <OnboardingLayout
      currentStep={3}
      title="Upload a recent resume or CV"
      subtitle="Autocomplete your profile in just a few seconds by uploading a resume. This step is optional."
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 px-8">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-6" />
          <p className="text-center text-muted-foreground mb-8">
            Click the button below to upload your resume as a .pdf, .doc, .docx, .rtf or .txt file
          </p>
          <Button
            onClick={handleUpload}
            disabled={uploading || uploaded}
            size="lg"
            className="rounded-full h-14 px-12 text-lg brand-gradient border-0 text-white shadow-lg shadow-primary/20"
          >
            {uploading ? "Uploading..." : uploaded ? "Uploaded ✓" : "Upload Resume"}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/onboarding/culture")}
          size="lg"
          className="rounded-full h-14 px-12 text-lg"
        >
          Back
        </Button>
        <Button
          variant="outline"
          onClick={handleSkip}
          size="lg"
          className="rounded-full h-14 px-12 text-lg"
        >
          Skip for now
        </Button>
      </div>
    </OnboardingLayout>
  );
};

export default OnboardingResume;
