import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Search, Users, ArrowRight, CheckCircle, Zap, Target } from "lucide-react";
import Navbar from "@/components/Navbar";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              AI-Powered Internship Matching
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Find Your Perfect{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Internship
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Connect with top companies through skills-based matching. Whether you're a student seeking your first opportunity or an employer looking for fresh talent.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 px-8" asChild>
                <Link to="/signup">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link to="/internships">Browse Internships</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">How It Works</h2>
            <p className="mt-4 text-muted-foreground">Three simple steps to launch your career or find great talent.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { icon: Users, title: "Create Profile", desc: "Sign up, add your skills and experience. Students upload resumes, employers share company info." },
              { icon: Search, title: "Discover & Match", desc: "Our skills-based matching shows the best opportunities based on your profile and requirements." },
              { icon: CheckCircle, title: "Apply & Connect", desc: "Students apply with one click. Employers review candidates with match scores and manage applications." },
            ].map((step, i) => (
              <Card key={i} className="group border-2 bg-card transition-all hover:border-primary/20 hover:shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div className="mb-2 text-sm font-semibold text-primary">Step {i + 1}</div>
                  <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground md:px-16">
            <Target className="mx-auto mb-6 h-12 w-12 opacity-80" />
            <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to Get Started?</h2>
            <p className="mt-4 text-lg opacity-90">Join thousands of students and employers already on InternHub.</p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" variant="secondary" className="gap-2" asChild>
                <Link to="/signup?role=student">I'm a Student</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2" asChild>
                <Link to="/signup?role=employer">I'm an Employer</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="font-display font-bold">InternHub</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 InternHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
