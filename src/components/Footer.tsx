import { Link } from "react-router-dom";
import { Briefcase, Twitter, Instagram, Linkedin } from "lucide-react";

const FOOTER_LINKS = {
  "For Students": [
    { label: "Browse Internships", href: "/internships" },
    { label: "Remote Opportunities", href: "/internships" },
    { label: "Skills Matching", href: "/signup?role=student" },
    { label: "Application Tracker", href: "/my-applications" },
    { label: "Build Your Profile", href: "/profile" },
  ],
  "For Employers": [
    { label: "Post Internships", href: "/post-internship" },
    { label: "Review Applicants", href: "/my-internships" },
    { label: "Talent Discovery", href: "/signup?role=employer" },
    { label: "Company Dashboard", href: "/my-internships" },
    { label: "Pricing", href: "/" },
  ],
  Company: [
    { label: "About", href: "/" },
    { label: "Help", href: "/" },
    { label: "Blog", href: "/" },
    { label: "Terms & Conditions", href: "/" },
    { label: "Privacy Policy", href: "/" },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-gradient text-white">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold text-background">
                Intern<span className="brand-gradient-text">Hub</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-background/60">
              The platform where ambitious students and innovative companies connect through skills-based internship matching.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a href="#" className="text-background/40 transition-colors hover:text-background/80" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/40 transition-colors hover:text-background/80" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/40 transition-colors hover:text-background/80" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-display text-sm font-semibold text-background">{heading}</h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-background/50 transition-colors hover:text-background/90"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-background/40 sm:flex-row">
          <p>Copyright © 2026 InternHub. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Browse by:</span>
            {["Internships", "Remote", "Companies", "Industries", "Skills"].map((item, i) => (
              <Link key={item} to="/internships" className="underline-offset-2 hover:text-background/70 hover:underline">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
