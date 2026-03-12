import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="py-20">
      <div className="container">
        <motion.div className="mx-auto max-w-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl text-center">Terms of Service</h1>
          <p className="mt-4 text-center text-sm text-muted-foreground">Last updated: March 1, 2026</p>

          <div className="mt-12 space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="mt-2">By accessing or using Wroob, you agree to be bound by these Terms of Service. If you do not agree, you may not use our platform.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">2. Account Registration</h2>
              <p className="mt-2">You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 16 years old to use Wroob.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">3. Use of the Platform</h2>
              <p className="mt-2">Wroob provides a platform for students to discover internship opportunities and for employers to post openings. Users agree not to misuse the platform, submit false information, or engage in any activity that violates applicable laws.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">4. Content & Intellectual Property</h2>
              <p className="mt-2">All content on Wroob, including text, graphics, and software, is owned by Wroob or its licensors. Users retain ownership of content they submit (resumes, cover letters) but grant Wroob a license to display it within the platform.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">5. Limitation of Liability</h2>
              <p className="mt-2">Wroob is provided "as is" without warranties. We do not guarantee employment outcomes. Wroob is not liable for any indirect, incidental, or consequential damages arising from use of the platform.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">6. Termination</h2>
              <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their accounts at any time through their profile settings.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">7. Changes to Terms</h2>
              <p className="mt-2">We may update these terms from time to time. Continued use of Wroob after changes constitutes acceptance of the updated terms.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">8. Contact</h2>
              <p className="mt-2">For questions about these terms, contact us at yourwroob@gmail.com.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </section>
    <Footer />
  </div>
);

export default Terms;
