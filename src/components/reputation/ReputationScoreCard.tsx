import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Briefcase, GraduationCap, MessageSquare, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReputationBreakdown {
  internship_score: number;
  skill_score: number;
  feedback_score: number;
  profile_score: number;
}

interface ReputationScoreCardProps {
  score: number;
  breakdown?: ReputationBreakdown;
  compact?: boolean;
}

function getBadgeTier(score: number): { bg: string; text: string; border: string; label: string } {
  if (score >= 71) return { bg: "bg-emerald-500/15", text: "text-emerald-600", border: "border-emerald-500/30", label: "Excellent" };
  if (score >= 41) return { bg: "bg-amber-500/15", text: "text-amber-600", border: "border-amber-500/30", label: "Good" };
  return { bg: "bg-red-500/15", text: "text-red-600", border: "border-red-500/30", label: "Building" };
}

function getProgressColor(score: number) {
  if (score >= 71) return "[&>div]:bg-emerald-500";
  if (score >= 41) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

export const WroobScoreBadge = ({ score, className }: { score: number; className?: string }) => {
  const tier = getBadgeTier(score);
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5", tier.bg, tier.border, className)}>
      <Trophy className={cn("h-4 w-4", tier.text)} />
      <span className={cn("text-sm font-bold", tier.text)}>{Math.round(score)}</span>
      <span className="text-[10px] font-medium text-muted-foreground">/ 100</span>
    </div>
  );
};

export const ReputationScoreCard = ({ score, breakdown, compact = false }: ReputationScoreCardProps) => {
  const tier = getBadgeTier(score);

  if (compact) {
    return <WroobScoreBadge score={score} />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-5 w-5 text-primary" />
          Wroob Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-3">
          <WroobScoreBadge score={score} />
          <span className={cn("text-sm font-semibold", tier.text)}>{tier.label}</span>
        </div>
        <Progress value={score} className={cn("h-2 mb-6", getProgressColor(score))} />

        {breakdown && <ScoreBreakdown breakdown={breakdown} />}
      </CardContent>
    </Card>
  );
};

export const ScoreBreakdown = ({ breakdown }: { breakdown: ReputationBreakdown }) => {
  const items = [
    { label: "Internship Completion", value: breakdown.internship_score, max: 40, icon: Briefcase },
    { label: "Skill Tests", value: breakdown.skill_score, max: 25, icon: GraduationCap },
    { label: "Company Feedback", value: breakdown.feedback_score, max: 25, icon: MessageSquare },
    { label: "Profile Strength", value: breakdown.profile_score, max: 10, icon: UserCheck },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score Breakdown</p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{Math.round(item.value)}/{item.max}</span>
            </div>
            <Progress value={(item.value / item.max) * 100} className="h-1.5" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const CandidateScoreBadge = ({ score, className }: { score: number; className?: string }) => {
  const tier = getBadgeTier(score);
  const percentile = score >= 90 ? "Top 5%" : score >= 80 ? "Top 10%" : score >= 70 ? "Top 25%" : score >= 60 ? "Top 40%" : null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <WroobScoreBadge score={score} />
      {percentile && (
        <span className="text-[10px] font-medium text-muted-foreground">{percentile}</span>
      )}
    </div>
  );
};
