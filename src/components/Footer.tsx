import { Link } from "react-router-dom";
import { Instagram, Linkedin, Github } from "lucide-react";
import wroobeLogo from "@/assets/wroob-logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div>
              <img src={wroobeLogo} alt="Wroob" className="h-14 brightness-0 invert" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-background/80">
              Skills-based internship matching for students and companies.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                { Icon: () => <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, label: "X", href: "https://x.com/yourwroob" },
                { Icon: Instagram, label: "Instagram", href: "https://www.instagram.com/wroob.in/" },
                { Icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/wroob-offcial-2573043b8" },
                { Icon: Github, label: "GitHub", href: "https://github.com/yourwroob" },
              ].map((item, i) => (
                <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="text-background/60 transition-colors hover:text-background" aria-label={item.label}>
                  {typeof item.Icon === 'function' && item.Icon.length === 0 && !item.Icon.prototype ? <item.Icon /> : <item.Icon className="h-4 w-4" />}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-background/90">Explore</h4>
            <ul className="mt-3 space-y-2.5">
              {[
                { label: "Browse Internships", href: "/internships" },
                { label: "For Students", href: "/signup?role=student" },
                { label: "For Companies", href: "/signup?role=employer" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-background/75 transition-colors hover:text-background">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-background/90">Company</h4>
            <ul className="mt-3 space-y-2.5">
              {[
                { label: "About", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Help Center", href: "/help" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-background/75 transition-colors hover:text-background">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-background/90">Legal</h4>
            <ul className="mt-3 space-y-2.5">
              {[
                { label: "Terms of Service", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-background/75 transition-colors hover:text-background">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-background/8">
        <div className="container flex items-center justify-between py-5">
          <p className="text-xs text-background/60">© 2026 Wroob. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
