import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { LegalPagePanel } from "@/components/ui/legal-page-panel";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        By accessing or using StudyFlow ("the Service"), you agree to be bound by these Terms of
        Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These
        Terms constitute a legally binding agreement between you and StudyFlow.
      </p>
    ),
  },
  {
    title: "2. Description of Service",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-2">
          StudyFlow is an AI-powered study companion designed for university students. The Service provides:
        </p>
        <ul className="space-y-1.5 text-muted-foreground">
          {[
            "AI tutoring with document-based context",
            "Automated quiz generation from study materials",
            "Flashcard creation and spaced repetition",
            "Pomodoro timer and study session tracking",
            "Course and assignment management",
            "Gamification features including XP, levels, streaks, and leaderboards",
            "Document storage and management",
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
    title: "3. User Accounts",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        You must create an account to use most features of the Service. You are responsible for
        maintaining the confidentiality of your account credentials and for all activities that
        occur under your account. You must provide accurate and complete information when creating
        your account and keep it updated.
      </p>
    ),
  },
  {
    title: "4. Acceptable Use",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-2">You agree not to:</p>
        <ul className="space-y-1.5 text-muted-foreground">
          {[
            "Use the Service for any illegal or unauthorized purpose",
            "Upload malicious, harmful, or copyrighted content without permission",
            "Attempt to gain unauthorized access to other users' accounts or data",
            "Use automated tools to scrape, crawl, or extract data from the Service",
            "Interfere with or disrupt the Service or its infrastructure",
            "Use the AI tutor to generate content that violates academic integrity policies",
            "Manipulate gamification metrics, XP, or leaderboard rankings",
            "Share your account credentials with others",
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
    title: "5. User Content",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        You retain ownership of all content you upload to the Service, including documents, notes,
        and study materials ("User Content"). By uploading User Content, you grant us a limited,
        non-exclusive license to process, store, and display your content solely for the purpose of
        providing the Service to you. We do not claim ownership of your User Content and will not
        use it for any purpose other than delivering the Service.
      </p>
    ),
  },
  {
    title: "6. AI-Generated Content",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        The Service uses AI to generate quiz questions, flashcards, tutoring responses, and other
        educational content. While we strive for accuracy, AI-generated content may contain errors
        or inaccuracies. You should not rely solely on AI-generated content for academic purposes.
        StudyFlow is a study aid, not a replacement for course materials, textbooks, or instructor
        guidance.
      </p>
    ),
  },
  {
    title: "7. Storage Limits",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        Each user is allocated a storage quota for document uploads. Free accounts receive a limited
        storage quota. We reserve the right to modify storage limits with reasonable notice. If your
        storage usage exceeds your quota, you may not be able to upload new documents until existing
        files are removed.
      </p>
    ),
  },
  {
    title: "8. Intellectual Property",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        The Service, including its design, code, logos, and branding, is owned by StudyFlow and
        protected by intellectual property laws. You may not copy, modify, distribute, or reverse
        engineer any part of the Service without our written permission.
      </p>
    ),
  },
  {
    title: "9. Privacy",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        Your use of the Service is also governed by our{" "}
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        , which describes how we collect, use, and protect your personal information.
      </p>
    ),
  },
  {
    title: "10. Disclaimers",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        The Service is provided "as is" and "as available" without warranties of any kind. We do
        not guarantee that the Service will be uninterrupted, error-free, or secure. We are not
        responsible for the accuracy of AI-generated content or any academic outcomes resulting from
        use of the Service.
      </p>
    ),
  },
  {
    title: "11. Limitation of Liability",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        To the fullest extent permitted by law, StudyFlow shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages, including loss of data, academic
        performance, or profits, arising from your use of or inability to use the Service.
      </p>
    ),
  },
  {
    title: "12. Account Termination",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        We reserve the right to suspend or terminate your account if you violate these Terms. You
        may delete your account at any time through the Settings page. Upon account deletion, all
        your data will be permanently removed within 30 days.
      </p>
    ),
  },
  {
    title: "13. Changes to Terms",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        We may update these Terms from time to time. We will notify you of material changes by
        posting a notice within the app. Your continued use of the Service after changes constitutes
        acceptance of the updated Terms.
      </p>
    ),
  },
  {
    title: "14. Governing Law",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        These Terms shall be governed by and construed in accordance with the laws of the Federal
        Republic of Nigeria, without regard to its conflict of law provisions.
      </p>
    ),
  },
  {
    title: "15. Contact",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        For questions about these Terms, contact us at{" "}
        <a href="mailto:legal@studyflow.app" className="text-primary hover:underline">
          legal@studyflow.app
        </a>
        .
      </p>
    ),
  },
];

const TermsOfService = () => {
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

              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1">Terms of Service</h1>
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
            <LegalPagePanel type="terms" />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default TermsOfService;
