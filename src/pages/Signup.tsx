import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Building2 } from "lucide-react";
import wroobeLogo from "@/assets/wroobe-logo.png";
import { cn } from "@/lib/utils";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "employer">(
    (searchParams.get("role") as "student" | "employer") || "student"
  );
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
      navigate(role === "student" ? "/onboarding/profile" : "/employer/onboarding/company");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={wroobeLogo} alt="Wroobe" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-2xl font-bold">Wroobe</span>
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Create an account</CardTitle>
            <CardDescription>Choose your role to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-2 gap-3">
              {[
                { value: "student" as const, label: "Student", icon: GraduationCap, desc: "Find internships" },
                { value: "employer" as const, label: "Employer", icon: Building2, desc: "Post internships" },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                    role === r.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <r.icon className="h-6 w-6" />
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-xs text-muted-foreground">{r.desc}</span>
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : `Sign Up as ${role === "student" ? "Student" : "Employer"}`}
              </Button>
            </form>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
            </div>
            <GoogleSignInButton />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
