import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Search, CheckCircle, ArrowDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

const FLOATING_TAGS = [
  { label: "Frontend", top: "12%", left: "8%", delay: 0 },
  { label: "AI / ML", top: "18%", right: "12%", delay: 0.5 },
  { label: "Remote", top: "35%", left: "5%", delay: 1.2 },
  { label: "React", bottom: "28%", left: "12%", delay: 0.8 },
  { label: "Fintech", top: "8%", left: "32%", delay: 1.5 },
  { label: "Web3", bottom: "18%", right: "8%", delay: 0.3 },
  { label: "Data Science", top: "42%", right: "6%", delay: 1.8 },
  { label: "San Francisco", bottom: "35%", right: "15%", delay: 0.7 },
  { label: "Product Design", bottom: "12%", left: "25%", delay: 1.1 },
  { label: "Backend", top: "6%", right: "30%", delay: 1.4 },
  { label: "Marketing", bottom: "22%", left: "3%", delay: 2.0 },
  { label: "New York", top: "25%", left: "18%", delay: 0.6 },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-28 md:py-40">
        {/* Floating tags */}
        <div className="absolute inset-0 pointer-events-none">
          {FLOATING_TAGS.map((tag) => (
            <motion.div
              key={tag.label}
              className="absolute hidden md:block"
              style={{ top: tag.top, left: tag.left, right: tag.right, bottom: tag.bottom }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tag.delay, duration: 0.6 }}
            >
              <motion.div
                className="rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5 + tag.delay, repeat: Infinity, ease: "easeInOut" }}
              >
                {tag.label}
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1
              className="font-display text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Find what's next
            </motion.h1>
            <motion.p
              className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              The platform where ambitious students and innovative companies connect through skills-based internship matching.
            </motion.p>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown className="h-5 w-5 text-muted-foreground/50" />
        </motion.div>
      </section>

      {/* CTA section - Wellfound style */}
      <section className="border-t py-24">
        <div className="container">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Where students and companies connect
            </h2>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="min-w-[200px] gap-2 rounded-full text-base h-14 px-8" asChild>
                <Link to="/signup?role=employer">
                  Find your next hire
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="min-w-[200px] gap-2 rounded-full text-base h-14 px-8" asChild>
                <Link to="/signup?role=student">
                  Find your next internship
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t py-24">
        <div className="container">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">Three simple steps to get started.</p>
          </motion.div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { icon: Users, title: "Create your profile", desc: "Sign up, add your skills, experience, and what you're looking for." },
              { icon: Search, title: "Discover matches", desc: "Our skills-based matching surfaces the best opportunities for you." },
              { icon: CheckCircle, title: "Apply & connect", desc: "Apply with one click. Companies review candidates with match scores." },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="group rounded-2xl border bg-card p-8 text-center hover-lift"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {i + 1}</div>
                <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t py-24">
        <div className="container">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-8 text-muted-foreground">
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-foreground">2,500+</div>
                <div className="mt-1 text-sm">Active Students</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-foreground">500+</div>
                <div className="mt-1 text-sm">Companies</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-foreground">10k+</div>
                <div className="mt-1 text-sm">Internships Posted</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t py-24">
        <div className="container">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to get started?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Join thousands already on InternHub.</p>
            <div className="mt-8">
              <Button size="lg" className="gap-2 rounded-full h-14 px-10 text-base" asChild>
                <Link to="/signup">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-display font-bold text-[10px]">
              IH
            </div>
            <span className="font-display font-bold">InternHub</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 InternHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
