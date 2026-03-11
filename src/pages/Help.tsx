import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const FAQS = [
  { q: "How do I create an account?", a: "Click 'Sign Up' in the top navigation, choose whether you're a student or employer, and fill in your details. You'll receive a verification email to confirm your account." },
  { q: "How does skills-based matching work?", a: "When you add skills to your profile, our algorithm compares them against the requirements of posted internships. You'll see a match percentage on each listing showing how well your skills align." },
  { q: "Is Wroobe free for students?", a: "Yes! Wroobe is completely free for students. You can browse internships, apply, and track your applications at no cost." },
  { q: "How do I apply for an internship?", a: "Navigate to any internship listing and click 'Apply'. You can include a cover letter and your resume. The employer will be notified and can review your application." },
  { q: "Can I edit my application after submitting?", a: "Once submitted, applications cannot be edited. Make sure to review your cover letter and resume before applying." },
  { q: "How do employers post internships?", a: "Employers can sign up, complete their company profile, and post internships through the dashboard. Each posting includes details like skills required, location, and type." },
  { q: "How do I contact support?", a: "Use the contact form below or email us at support@wroobe.com. We typically respond within 24 hours." },
];

const Help = () => {
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Message sent! We'll get back to you soon.");
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-20">
        <div className="container">
          <motion.div className="mx-auto max-w-2xl text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Help Center</h1>
            <p className="mt-4 text-lg text-muted-foreground">Find answers to common questions or reach out to our team.</p>
          </motion.div>
        </div>
      </section>

      <section className="border-t py-16 section-alt">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-2xl font-bold">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="mt-6">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="border-t py-16">
        <div className="container">
          <div className="mx-auto max-w-lg">
            <h2 className="font-display text-2xl font-bold text-center">Still need help?</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">Send us a message and we'll get back to you within 24 hours.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <Input placeholder="Your email" type="email" required />
              <Input placeholder="Subject" required />
              <Textarea placeholder="Describe your issue..." rows={5} required />
              <Button type="submit" className="w-full brand-gradient border-0 text-white" disabled={sending}>
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Help;
