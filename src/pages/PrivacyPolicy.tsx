import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { LegalPagePanel } from "@/components/ui/legal-page-panel";

const sections = [
  {
    title: "1. Introduction",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        Welcome to StudyFlow ("we," "our," or "us"). We are committed to protecting your personal
        information and your right to privacy. This Privacy Policy explains how we collect, use,
        disclose, and safeguard your information when you use our web application and related
        services (collectively, the "Service").
      </p>
    ),
  },
  {
    title: "2. Information We Collect",
    content: (
      <>
        <h3 className="text-base font-semibold text-foreground mt-4 mb-1">2.1 Personal Information</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">When you create an account, we collect:</p>
        <ul className="space-y-1.5 text-muted-foreground">
          {["Full name and email address", "Profile picture (optional)", "University or institution (optional)", "Authentication credentials"].map((i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {i}
            </li>
          ))}
        </ul>
        <h3 className="text-base font-semibold text-foreground mt-4 mb-1">2.2 Usage Data</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">We automatically collect information about how you interact with the Service, including:</p>
        <ul className="space-y-1.5 text-muted-foreground">
          {["Study session duration and frequency", "Quiz scores and performance metrics", "Flashcard usage and progress", "Pomodoro timer activity", "Course and assignment data you create", "Documents you upload for AI tutoring"].map((i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {i}
            </li>
          ))}
        </ul>
        <h3 className="text-base font-semibold text-foreground mt-4 mb-1">2.3 Device & Technical Information</h3>
        <p className="text-muted-foreground leading-relaxed">Browser type and version, operating system, device type, IP address, and access timestamps.</p>
      </>
    ),
  },
  {
    title: "3. How We Use Your Information",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-2">We use the information we collect to:</p>
        <ul className="space-y-1.5 text-muted-foreground">
          {[
            "Provide, maintain, and improve the Service",
            "Power AI-driven tutoring, quiz generation, and flashcard creation",
            "Track your study progress, streaks, and gamification metrics",
            "Display your position on leaderboards (using your display name only)",
            "Send you notifications related to your account and study goals",
            "Detect and prevent fraud, abuse, or security incidents",
            "Comply with legal obligations",
          ].map((i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {i}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    title: "4. Data Storage & Security",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        Your data is stored securely using Supabase infrastructure with Row-Level Security (RLS)
        policies ensuring that only you can access your personal data. We use industry-standard
        encryption for data in transit (TLS 1.2+) and at rest. Uploaded documents are stored in
        private storage buckets accessible only by the uploading user.
      </p>
    ),
  },
  {
    title: "5. AI & Document Processing",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        When you upload documents or interact with the AI tutor, your content is processed by
        third-party AI providers (such as Google's Gemini API) to generate responses, quizzes, and
        flashcards. We do not use your uploaded documents or conversations to train AI models.
        Document content is processed in real-time and is not retained by AI providers beyond the
        immediate request.
      </p>
    ),
  },
  {
    title: "6. Data Sharing",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-2">We do not sell your personal information. We may share data with:</p>
        <ul className="space-y-1.5 text-muted-foreground">
          {[
            { label: "Service providers:", text: "Supabase (database), Vercel (hosting), Google (AI processing)" },
            { label: "Leaderboard participants:", text: "Your display name, level, and XP are visible to other users on the leaderboard" },
            { label: "Legal requirements:", text: "When required by law or to protect our rights" },
          ].map((i) => (
            <li key={i.label} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span><strong className="text-foreground font-medium">{i.label}</strong> {i.text}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    title: "7. Your Rights",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-2">You have the right to:</p>
        <ul className="space-y-1.5 text-muted-foreground">
          {["Access, update, or delete your personal data", "Export your data (available in Settings)", "Delete your account and all associated data", "Opt out of leaderboard visibility", "Request information about how your data is processed"].map((i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {i}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    title: "8. Data Retention",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        We retain your data for as long as your account is active. If you delete your account, all
        personal data, study records, documents, and AI conversation history will be permanently
        deleted within 30 days.
      </p>
    ),
  },
  {
    title: "9. Children's Privacy",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        StudyFlow is designed for university students and is not intended for children under 13. We
        do not knowingly collect information from children under 13.
      </p>
    ),
  },
  {
    title: "10. Changes to This Policy",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        We may update this Privacy Policy from time to time. We will notify you of material changes
        by posting a notice within the app or sending you an email. Your continued use of the
        Service after changes constitutes acceptance of the updated policy.
      </p>
    ),
  },
  {
    title: "11. Contact Us",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        If you have questions about this Privacy Policy or your data, please contact us at{" "}
        <a href="mailto:privacy@studyflow.app" className="text-primary hover:underline">
          privacy@studyflow.app
        </a>
        .
      </p>
    ),
  },
];

const PrivacyPolicy = () => {
  return (
    <main className="min-h-screen bg-muted/30">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_320px]">
            {/* Left: scrollable content */}
            <div className="p-8 sm:p-10 lg:p-12">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors mb-8 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>

              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground mb-10">Last Updated: February 20, 2026</p>

              <div className="space-y-8 text-sm">
                {sections.map((s) => (
                  <section key={s.title}>
                    <h2 className="text-base font-bold text-foreground mb-3">{s.title}</h2>
                    {s.content}
                  </section>
                ))}
              </div>
            </div>

            {/* Right: decorative panel */}
            <LegalPagePanel type="privacy" />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default PrivacyPolicy;
