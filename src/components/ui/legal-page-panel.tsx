import { Shield, Lock, Eye, UserCheck, Server, FileText } from "lucide-react";

const privacyHighlights = [
  { icon: Lock, title: "End-to-End Encrypted", desc: "Your data is encrypted in transit and at rest using TLS 1.2+" },
  { icon: Eye, title: "We Never Sell Your Data", desc: "Your personal information is never sold to third parties" },
  { icon: UserCheck, title: "You Stay in Control", desc: "Access, export, or delete your data anytime from Settings" },
  { icon: Server, title: "Stored Securely", desc: "Powered by Supabase with Row-Level Security policies" },
];

const termsHighlights = [
  { icon: FileText, title: "You Own Your Content", desc: "All documents and notes you upload remain 100% yours" },
  { icon: Shield, title: "Academic Integrity", desc: "StudyFlow is a study aid, not a replacement for coursework" },
  { icon: UserCheck, title: "Fair Use Policy", desc: "Use the platform responsibly and in good faith" },
  { icon: Lock, title: "Privacy Backed by Law", desc: "Governed by the laws of the Federal Republic of Nigeria" },
];

interface LegalPagePanelProps {
  type: "privacy" | "terms";
}

export const LegalPagePanel = ({ type }: LegalPagePanelProps) => {
  const items = type === "privacy" ? privacyHighlights : termsHighlights;
  const badge = type === "privacy" ? "Privacy First" : "Fair & Transparent";
  const badgeDesc =
    type === "privacy"
      ? "Built with your trust in mind from day one."
      : "Our terms are written to be clear and student-friendly.";

  return (
    <div className="hidden lg:flex flex-col h-full bg-gradient-to-b from-primary/5 via-primary/[0.03] to-background border-l border-border/40">
      {/* Sticky inner */}
      <div className="sticky top-24 p-10 flex flex-col gap-6">
        {/* Top decorative badge */}
        <div className="flex flex-col items-center text-center px-2 py-6 rounded-2xl bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 mb-3">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">{badge}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{badgeDesc}</p>
        </div>

        {/* Highlight cards */}
        <div className="flex flex-col gap-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 bg-background rounded-xl border border-border/50 px-4 py-3 shadow-sm hover:border-primary/30 transition-colors duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">{title}</p>
                <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative gradient blob */}
        <div className="relative h-28 rounded-2xl overflow-hidden mt-2">
          <div className="absolute inset-0 gradient-primary opacity-80" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-5 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Questions?</p>
            <p className="text-sm font-semibold leading-snug">
              {type === "privacy"
                ? "Email us at privacy@studyflow.app"
                : "Email us at legal@studyflow.app"}
            </p>
          </div>
          <div className="absolute top-3 left-3 w-12 h-12 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-3 right-3 w-16 h-16 rounded-full bg-white/5 blur-2xl" />
        </div>
      </div>
    </div>
  );
};
