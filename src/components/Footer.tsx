import { Sparkles } from "lucide-react";

const footerLinks = [
  { label: "Features", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

export const Footer = () => {
  return (
    <footer className="py-12 bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <Sparkles className="w-6 h-6 text-primary transition-transform group-hover:scale-110 group-hover:rotate-12" />
            <span className="text-lg font-bold text-foreground">StudyFlow</span>
          </a>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
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
