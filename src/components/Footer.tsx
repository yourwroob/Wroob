import { Link } from "react-router-dom";
import { Twitter, Instagram, Linkedin, Github } from "lucide-react";
import wroobeLogo from "@/assets/wroobe-logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <img src={wroobeLogo} alt="Wroobe" className="h-7 w-7 invert" />
              <span className="font-display font-semibold tracking-tight" style={{ fontSize: "16px", letterSpacing: "-0.02em" }}>
                wroobe
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-background/50">
              Skills-based internship matching for students and companies.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="text-background/30 transition-colors hover:text-background/70" aria-label="social">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-background/70">Explore</h4>
            <ul className="mt-3 space-y-2.5">
              {[
                { label: "Browse Internships", href: "/internships" },
                { label: "For Students", href: "/signup?role=student" },
                { label: "For Companies", href: "/signup?role=employer" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-background/45 transition-colors hover:text-background/80">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-background/70">Company</h4>
            <ul className="mt-3 space-y-2.5">
              {[
                { label: "About", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Help Center", href: "/help" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-background/45 transition-colors hover:text-background/80">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-background/70">Legal</h4>
            <ul className="mt-3 space-y-2.5">
              {[
                { label: "Terms of Service", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-background/45 transition-colors hover:text-background/80">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-background/8">
        <div className="container flex items-center justify-between py-5">
          <p className="text-xs text-background/30">© 2026 Wroobe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
