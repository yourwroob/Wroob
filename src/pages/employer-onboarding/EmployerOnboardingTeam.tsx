import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEmployerOnboardingStatus } from "@/hooks/useEmployerOnboardingStatus";
import EmployerOnboardingLayout from "@/components/onboarding/EmployerOnboardingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, UserPlus, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email();

interface Invite {
  email: string;
  role: string;
}

const EmployerOnboardingTeam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStep, completeOnboarding } = useEmployerOnboardingStatus();

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("recruiter");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);

  const addInvite = () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    try {
      emailSchema.parse(trimmed);
    } catch {
      toast({ title: "Invalid email address", variant: "destructive" });
      return;
    }

    if (invites.some((inv) => inv.email === trimmed)) {
      toast({ title: "Already added", variant: "destructive" });
      return;
    }

    setInvites((prev) => [...prev, { email: trimmed, role: inviteRole }]);
    setEmail("");
  };

  const removeInvite = (emailToRemove: string) => {
    setInvites((prev) => prev.filter((inv) => inv.email !== emailToRemove));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    // Save invitations to DB
    if (invites.length > 0) {
      const payload = invites.map((inv) => ({
        inviter_id: user.id,
        email: inv.email,
        invitation_role: inv.role,
      }));

      const { error } = await supabase
        .from("employer_invitations" as any)
        .insert(payload as any);

      if (error) {
        toast({ title: "Error saving invitations", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
    }

    await completeOnboarding();
    setLoading(false);
    navigate("/employer/onboarding/done");
  };

  const handleSkip = async () => {
    await completeOnboarding();
    navigate("/employer/onboarding/done");
  };

  return (
    <EmployerOnboardingLayout currentStep={2}>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Invite your team
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
        Add teammates to help you manage job postings and review candidates. You can always invite more people later.
      </p>

      <div className="mt-8 space-y-6">
        {/* Add invite form */}
        <div className="space-y-3">
          <Label className="font-semibold">Add teammate</Label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInvite())}
              />
            </div>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addInvite} variant="outline" className="gap-1">
              <UserPlus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        {/* Invite list */}
        {invites.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Pending invitations</Label>
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.email} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{inv.email}</span>
                    <Badge variant="secondary" className="text-xs capitalize">{inv.role}</Badge>
                  </div>
                  <button onClick={() => removeInvite(inv.email)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-12 flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="h-14 px-10 text-base bg-foreground text-background hover:bg-foreground/90 rounded-lg"
        >
          {loading ? "Saving..." : invites.length > 0 ? "Send invites & continue" : "Continue"}
        </Button>
        {invites.length === 0 && (
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="h-14 px-6 text-muted-foreground"
          >
            Skip for now
          </Button>
        )}
      </div>
    </EmployerOnboardingLayout>
  );
};

export default EmployerOnboardingTeam;
