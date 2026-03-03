import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Search, CheckCircle, ArrowDown, Briefcase } from "lucide-react";
import Navbar from "@/components/Navbar";
import ScrollProgress from "@/components/ScrollProgress";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const FLOATING_TAGS = [
  { label: "Frontend", top: "12%", left: "8%", delay: 0, scale: 1.02 },
  { label: "AI / ML", top: "18%", right: "12%", delay: 0.5, scale: 0.97 },
  { label: "Remote", top: "35%", left: "5%", delay: 1.2, scale: 1.0 },
  { label: "React", bottom: "28%", left: "12%", delay: 0.8, scale: 1.04 },
  { label: "Fintech", top: "8%", left: "32%", delay: 1.5, scale: 0.96 },
  { label: "Web3", bottom: "18%", right: "8%", delay: 0.3, scale: 1.01 },
  { label: "Data Science", top: "42%", right: "6%", delay: 1.8, scale: 0.98 },
  { label: "San Francisco", bottom: "35%", right: "15%", delay: 0.7, scale: 1.03 },
  { label: "Product Design", bottom: "12%", left: "25%", delay: 1.1, scale: 0.99 },
  { label: "Backend", top: "6%", right: "30%", delay: 1.4, scale: 1.0 },
  { label: "Marketing", bottom: "22%", left: "3%", delay: 2.0, scale: 1.02 },
  { label: "New York", top: "25%", left: "18%", delay: 0.6, scale: 0.97 },
];

const HOW_STEPS = [
  { icon: Users, title: "Create your profile", desc: "Sign up, add your skills, experience, and what you're looking for." },
  { icon: Search, title: "Discover matches", desc: "Our skills-based matching surfaces the best opportunities for you." },
  { icon: CheckCircle, title: "Apply & connect", desc: "Apply with one click. Companies review candidates with match scores." },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const Landing = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden py-28 md:py-40">
        {/* Background glow */}
        <div className="hero-glow left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

        {/* Floating tags with parallax */}
        <div className="absolute inset-0 pointer-events-none">
          {FLOATING_TAGS.map((tag, i) => {
            const speed = 0.3 + (i % 4) * 0.15;
            return (
              <motion.div
                key={tag.label}
                className="absolute hidden md:block"
                style={{
                  top: tag.top,
                  left: tag.left,
                  right: tag.right,
                  bottom: tag.bottom,
                  y: useTransform(scrollYProgress, [0, 1], [0, -80 * speed]),
                }}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: tag.scale }}
                transition={{ delay: tag.delay, duration: 0.6 }}
              >
                <motion.div
                  className="glass rounded-full px-4 py-2 text-sm text-muted-foreground shadow-sm"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4 + tag.delay, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.08, y: -4 }}
                >
                  {tag.label}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        <div className="container relative">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            style={{ scale: heroScale, opacity: heroOpacity }}
          >
            <motion.h1
              className="font-display text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Find Your Perfect{" "}
              <span className="brand-gradient-text">Internship</span>
            </motion.h1>
            <motion.p
              className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              The platform where ambitious students and innovative companies connect through skills-based internship matching.
            </motion.p>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown className="h-5 w-5 text-muted-foreground/50" />
        </motion.div>
      </section>

      {/* CTA section */}
      <motion.section
        className="border-t py-24 section-alt"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Where students and companies connect
            </h2>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="min-w-[200px] gap-2 rounded-full text-base h-14 px-8 brand-gradient border-0 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]" asChild>
                <Link to="/signup?role=employer">
                  Find your next hire
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="min-w-[200px] gap-2 rounded-full text-base h-14 px-8 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200" asChild>
                <Link to="/signup?role=student">
                  Find your next internship
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* How it works — sticky scroll storytelling */}
      <motion.section
        className="border-t py-24"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">Three simple steps to get started.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_STEPS.map((step, i) => (
              <motion.div
                key={i}
                className="group card-depth p-8 text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient text-white shadow-lg shadow-primary/20">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step {i + 1}</div>
                <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Social proof */}
      <motion.section
        className="border-t py-24 section-blue"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-8 text-muted-foreground">
              {[
                { value: "2,500+", label: "Active Students" },
                { value: "500+", label: "Companies" },
                { value: "10k+", label: "Internships Posted" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <div className="font-display text-4xl font-bold brand-gradient-text">{stat.value}</div>
                  <div className="mt-1 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        className="border-t py-24"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to get started?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Join thousands already on InternHub.</p>
            <div className="mt-8">
              <div className="inline-block animated-border rounded-full">
                <Button size="lg" className="gap-2 rounded-full h-14 px-10 text-base brand-gradient border-0 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]" asChild>
                  <Link to="/signup">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg brand-gradient text-white">
              <Briefcase className="h-4 w-4" />
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
