import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Target, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

const VALUES = [
  { icon: Target, title: "Mission-Driven", desc: "We believe every student deserves access to meaningful career opportunities, regardless of background." },
  { icon: Users, title: "Community First", desc: "We're building a network where students and companies grow together through genuine connections." },
  { icon: Zap, title: "Skills Over Pedigree", desc: "Our matching algorithm focuses on what you can do — not where you went to school." },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="py-20">
      <div className="container">
        <motion.div className="mx-auto max-w-2xl text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            About <span className="brand-gradient-text">Wroobe</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Wroobe is a skills-based internship platform connecting ambitious students with innovative companies. We make the hiring process smarter, faster, and fairer for everyone.
          </p>
        </motion.div>
      </div>
    </section>

    <section className="border-t py-20 section-alt">
      <div className="container">
        <h2 className="font-display text-2xl font-bold text-center md:text-3xl">Our Story</h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-4 text-muted-foreground leading-relaxed">
          <p>Founded in 2026, Wroobe was born from a simple observation: the internship search is broken. Students spend countless hours applying to roles that don't match their skills, while companies struggle to find the right talent in a sea of generic resumes.</p>
          <p>We set out to change that. By building a platform centered on skills-based matching, we help students discover opportunities they're genuinely qualified for — and help employers find candidates who can make an impact from day one.</p>
          <p>Today, Wroobe serves thousands of students and hundreds of companies across industries from fintech to AI, connecting talent with opportunity through technology and thoughtful design.</p>
        </div>
      </div>
    </section>

    <section className="border-t py-20">
      <div className="container">
        <h2 className="font-display text-2xl font-bold text-center md:text-3xl">What We Stand For</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <motion.div key={i} className="card-depth p-8 text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}>
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl brand-gradient text-white">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default About;
