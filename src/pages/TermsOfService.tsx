import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: February 20, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using StudyFlow ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms constitute a legally binding agreement between you and StudyFlow.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              StudyFlow is an AI-powered study companion designed for university students. The Service provides:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>AI tutoring with document-based context</li>
              <li>Automated quiz generation from study materials</li>
              <li>Flashcard creation and spaced repetition</li>
              <li>Pomodoro timer and study session tracking</li>
              <li>Course and assignment management</li>
              <li>Gamification features including XP, levels, streaks, and leaderboards</li>
              <li>Document storage and management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must create an account to use most features of the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account and keep it updated.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Upload malicious, harmful, or copyrighted content without permission</li>
              <li>Attempt to gain unauthorized access to other users' accounts or data</li>
              <li>Use automated tools to scrape, crawl, or extract data from the Service</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Use the AI tutor to generate content that violates academic integrity policies</li>
              <li>Manipulate gamification metrics, XP, or leaderboard rankings</li>
              <li>Share your account credentials with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">5. User Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of all content you upload to the Service, including documents, notes, and study materials ("User Content"). By uploading User Content, you grant us a limited, non-exclusive license to process, store, and display your content solely for the purpose of providing the Service to you. We do not claim ownership of your User Content and will not use it for any purpose other than delivering the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">6. AI-Generated Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service uses AI to generate quiz questions, flashcards, tutoring responses, and other educational content. While we strive for accuracy, AI-generated content may contain errors or inaccuracies. You should not rely solely on AI-generated content for academic purposes. StudyFlow is a study aid, not a replacement for course materials, textbooks, or instructor guidance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">7. Storage Limits</h2>
            <p className="text-muted-foreground leading-relaxed">
              Each user is allocated a storage quota for document uploads. Free accounts receive a limited storage quota. We reserve the right to modify storage limits with reasonable notice. If your storage usage exceeds your quota, you may not be able to upload new documents until existing files are removed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its design, code, logos, and branding, is owned by StudyFlow and protected by intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the Service without our written permission. The StudyFlow name and logo are trademarks of StudyFlow.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">9. Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your use of the Service is also governed by our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which describes how we collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">10. Disclaimers</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or secure. We are not responsible for the accuracy of AI-generated content or any academic outcomes resulting from use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">11. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, StudyFlow shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, academic performance, or profits, arising from your use of or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">12. Account Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms. You may delete your account at any time through the Settings page. Upon account deletion, all your data will be permanently removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">13. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes by posting a notice within the app. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">14. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground">15. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@studyflow.app" className="text-primary hover:underline">legal@studyflow.app</a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default TermsOfService;
