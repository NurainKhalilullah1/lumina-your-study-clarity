import React from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { Link } from "react-router-dom";
import { StudyFlowLogo } from "@/components/StudyFlowLogo";

interface Footer7Props {
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string; internal?: boolean }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    href: string;
    internal?: boolean;
  }>;
}

const defaultSections = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/features", internal: true },
      { name: "Pricing", href: "/#pricing", internal: true },
      { name: "Download App", href: "/download", internal: true },
      { name: "About", href: "/about", internal: true },
    ],
  },
  {
    title: "Learn",
    links: [
      { name: "AI Tutor", href: "/auth", internal: true },
      { name: "Flashcards", href: "/auth", internal: true },
      { name: "Quiz Generator", href: "/auth", internal: true },
      { name: "Leaderboard", href: "/auth", internal: true },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Help Center", href: "#", internal: false },
      { name: "Community", href: "/auth", internal: true },
      { name: "Privacy Policy", href: "/privacy", internal: true },
      { name: "Terms of Service", href: "/terms", internal: true },
    ],
  },
];

const defaultSocialLinks = [
  { icon: <FaInstagram className="size-5" />, href: "https://instagram.com", label: "Instagram" },
  { icon: <FaFacebook className="size-5" />, href: "https://facebook.com", label: "Facebook" },
  { icon: <FaTwitter className="size-5" />, href: "https://twitter.com", label: "Twitter" },
  { icon: <FaLinkedin className="size-5" />, href: "https://linkedin.com", label: "LinkedIn" },
];

const defaultLegalLinks = [
  { name: "Terms of Service", href: "/terms", internal: true },
  { name: "Privacy Policy", href: "/privacy", internal: true },
];

export const Footer7 = ({
  sections = defaultSections,
  description = "The AI-powered student OS that organizes your deadlines, generates quizzes from your slides, and explains anything you don't understand.",
  socialLinks = defaultSocialLinks,
  copyright = `© ${new Date().getFullYear()} StudyFlow. All rights reserved. Built for Nigerian Students.`,
  legalLinks = defaultLegalLinks,
}: Footer7Props) => {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex w-full flex-col justify-between gap-12 lg:flex-row lg:items-start lg:text-left">
          {/* Brand Column */}
          <div className="flex w-full max-w-sm flex-col gap-6 lg:items-start">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <StudyFlowLogo size="lg" variant="purple" className="transition-transform group-hover:scale-110" />
              <span className="text-xl font-bold font-heading text-foreground tracking-tight">StudyFlow</span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>

            {/* Social Links */}
            <ul className="flex items-center gap-5 text-muted-foreground">
              {socialLinks.map((social, idx) => (
                <li key={idx}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="hover:text-primary transition-colors duration-200"
                  >
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Grid */}
          <div className="grid w-full gap-8 sm:grid-cols-3 lg:gap-12">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      {link.internal ? (
                        <Link
                          to={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                        >
                          {link.name}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-border/40 pt-8 text-xs text-muted-foreground md:flex-row md:items-center">
          <p className="order-2 md:order-1">{copyright}</p>
          <ul className="order-1 flex flex-wrap gap-4 md:order-2">
            {legalLinks.map((link, idx) => (
              <li key={idx}>
                {link.internal ? (
                  <Link to={link.href} className="hover:text-primary transition-colors duration-200">
                    {link.name}
                  </Link>
                ) : (
                  <a href={link.href} className="hover:text-primary transition-colors duration-200">
                    {link.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};
