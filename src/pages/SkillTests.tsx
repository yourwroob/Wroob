import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ReputationScoreCard } from "@/components/reputation/ReputationScoreCard";
import { useReputation } from "@/hooks/useReputation";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import LocalCommunityGroups from "@/components/LocalCommunityGroups";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface TestInfo {
  skill_name: string;
  question_count: number;
  completed: boolean;
  passed: boolean;
  score: number | null;
}

interface Question {
  index: number;
  question: string;
  options: string[];
}

const SkillTests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reputation, recalculate } = useReputation(user?.id);
  const [tests, setTests] = useState<TestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTests();
  }, [user]);

  const fetchTests = async () => {
    const { data, error } = await supabase.functions.invoke("skill-tests", {
      body: { action: "list_tests" },
    });
    if (data?.tests) setTests(data.tests);
    setLoading(false);
  };

  const startTest = async (skillName: string) => {
    const { data, error } = await supabase.functions.invoke("skill-tests", {
      body: { action: "get_test", skill_name: skillName },
    });
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Failed to load test", variant: "destructive" });
      return;
    }
    setActiveTest(skillName);
    setQuestions(data.questions);
    setAnswers(new Array(data.questions.length).fill(-1));
    setCurrentQ(0);
    setResult(null);
  };

  const selectAnswer = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = optionIndex;
      return next;
    });
  };

  const submitTest = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("skill-tests", {
      body: { action: "submit_test", skill_name: activeTest, answers },
    });
    setSubmitting(false);
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Submission failed", variant: "destructive" });
      return;
    }
    setResult(data);
    recalculate();
    fetchTests();
  };

  const exitTest = () => {
    setActiveTest(null);
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setCurrentQ(0);
  };

  if (activeTest && result) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-lg py-10">
          <Card>
            <CardContent className="pt-8 text-center space-y-4">
              {result.passed ? (
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              )}
              <h2 className="font-display text-2xl font-bold">
                {result.passed ? "Congratulations!" : "Keep Practicing"}
              </h2>
              <p className="text-muted-foreground">
                You scored <span className="font-bold text-foreground">{result.correct}/{result.total}</span> ({result.score}%)
              </p>
              <p className={cn("font-medium", result.passed ? "text-emerald-600" : "text-red-600")}>
                {result.passed ? "✓ Test Passed" : "✗ Score 60% or higher to pass"}
              </p>
              <Button onClick={exitTest} className="w-full mt-4">Back to Tests</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeTest && questions.length > 0) {
    const q = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-lg py-10">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-xl font-bold">{activeTest} Test</h2>
              <span className="text-sm text-muted-foreground">{currentQ + 1}/{questions.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="font-medium text-lg">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    className={cn(
                      "w-full text-left rounded-lg border-2 p-3 text-sm transition-all",
                      answers[currentQ] === i
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                {currentQ > 0 && (
                  <Button variant="outline" onClick={() => setCurrentQ((c) => c - 1)}>Previous</Button>
                )}
                <div className="flex-1" />
                {currentQ < questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQ((c) => c + 1)}
                    disabled={answers[currentQ] === -1}
                  >
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={submitTest}
                    disabled={answers.some((a) => a === -1) || submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Test"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <Button variant="ghost" className="mt-4" onClick={exitTest}>Cancel Test</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-10">
        <h1 className="font-display text-3xl font-bold mb-2">Skill Tests</h1>
        <p className="text-muted-foreground mb-8">Pass skill tests to boost your reputation score</p>

        {reputation && (
          <div className="mb-8">
            <ReputationScoreCard score={reputation.reputation_score} breakdown={reputation.breakdown} compact />
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading tests...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tests.map((test) => (
              <Card key={test.skill_name}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold">{test.skill_name}</h3>
                    {test.completed && (
                      <Badge variant={test.passed ? "default" : "secondary"}>
                        {test.passed ? `✓ ${test.score}%` : `✗ ${test.score}%`}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{test.question_count} questions · 60% to pass</p>
                  {test.passed ? (
                    <Button variant="outline" size="sm" disabled className="w-full">
                      <CheckCircle2 className="mr-1 h-4 w-4 text-emerald-500" /> Passed
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => startTest(test.skill_name)}>
                      {test.completed ? <><RotateCcw className="mr-1 h-4 w-4" /> Retake</> : "Start Test"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Local Community Groups */}
        <div className="mt-12 pt-8 border-t">
          <LocalCommunityGroups />
        </div>
      </div>
    </div>
  );
};

export default SkillTests;
