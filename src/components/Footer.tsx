import { Link } from "react-router-dom";
import { StudyFlowLogo } from "./StudyFlowLogo";

const footerLinks = [
  { label: "Features", href: "/features" },
  { label: "About", href: "/about" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export const Footer = () => {
  return (
    <footer className="py-12 bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <StudyFlowLogo size="md" variant="purple" className="transition-transform group-hover:scale-110" />
            <span className="text-lg font-bold text-foreground">StudyFlow</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            Copyright © 2026 StudyFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
