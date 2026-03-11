import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="py-20">
      <div className="container">
        <motion.div className="mx-auto max-w-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl text-center">Privacy Policy</h1>
          <p className="mt-4 text-center text-sm text-muted-foreground">Last updated: March 1, 2026</p>

          <div className="mt-12 space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p className="mt-2">We collect information you provide directly: name, email, profile details, skills, education, and uploaded documents (resumes, cover letters). We also collect usage data such as pages visited, interactions, and device information.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
              <p className="mt-2">Your information is used to provide and improve our services, match students with relevant internships, communicate platform updates, and ensure account security.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">3. Information Sharing</h2>
              <p className="mt-2">We share your profile information with employers only when you apply to their internships. We do not sell personal data to third parties. We may share anonymized, aggregated data for analytics purposes.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">4. Data Security</h2>
              <p className="mt-2">We use industry-standard encryption and security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">5. Cookies</h2>
              <p className="mt-2">We use essential cookies for authentication and session management. We may use analytics cookies to understand how users interact with our platform.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">6. Your Rights</h2>
              <p className="mt-2">You have the right to access, correct, or delete your personal data. You can export your data or request account deletion through your profile settings or by contacting support.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">7. Data Retention</h2>
              <p className="mt-2">We retain your data for as long as your account is active. Upon deletion, your data will be removed within 30 days, except where required by law.</p>
            </section>
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">8. Contact</h2>
              <p className="mt-2">For privacy-related inquiries, contact us at privacy@wroobe.com.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </section>
    <Footer />
  </div>
);

export default Privacy;
