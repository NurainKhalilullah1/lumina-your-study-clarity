import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: February 20, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to StudyFlow ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application and related services (collectively, the "Service").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-foreground mt-4">2.1 Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed">When you create an account, we collect:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Full name and email address</li>
              <li>Profile picture (optional)</li>
              <li>University or institution (optional)</li>
              <li>Authentication credentials</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">2.2 Usage Data</h3>
            <p className="text-muted-foreground leading-relaxed">We automatically collect information about how you interact with the Service, including:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Study session duration and frequency</li>
              <li>Quiz scores and performance metrics</li>
              <li>Flashcard usage and progress</li>
              <li>Pomodoro timer activity</li>
              <li>Course and assignment data you create</li>
              <li>Documents you upload for AI tutoring</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4">2.3 Device & Technical Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              Browser type and version, operating system, device type, IP address, and access timestamps.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Power AI-driven tutoring, quiz generation, and flashcard creation</li>
              <li>Track your study progress, streaks, and gamification metrics</li>
              <li>Display your position on leaderboards (using your display name only)</li>
              <li>Send you notifications related to your account and study goals</li>
              <li>Detect and prevent fraud, abuse, or security incidents</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">4. Data Storage & Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using Supabase infrastructure with Row-Level Security (RLS) policies ensuring that only you can access your personal data. We use industry-standard encryption for data in transit (TLS 1.2+) and at rest. Uploaded documents are stored in private storage buckets accessible only by the uploading user.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">5. AI & Document Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you upload documents or interact with the AI tutor, your content is processed by third-party AI providers (such as Google's Gemini API) to generate responses, quizzes, and flashcards. We do not use your uploaded documents or conversations to train AI models. Document content is processed in real-time and is not retained by AI providers beyond the immediate request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">6. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Service providers:</strong> Supabase (database), Vercel (hosting), Google (AI processing)</li>
              <li><strong>Leaderboard participants:</strong> Your display name, level, and XP are visible to other users on the leaderboard</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Access, update, or delete your personal data</li>
              <li>Export your data (available in Settings)</li>
              <li>Delete your account and all associated data</li>
              <li>Opt out of leaderboard visibility</li>
              <li>Request information about how your data is processed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active. If you delete your account, all personal data, study records, documents, and AI conversation history will be permanently deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              StudyFlow is designed for university students and is not intended for children under 13. We do not knowingly collect information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting a notice within the app or sending you an email. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or your data, please contact us at{" "}
              <a href="mailto:privacy@studyflow.app" className="text-primary hover:underline">privacy@studyflow.app</a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default PrivacyPolicy;
