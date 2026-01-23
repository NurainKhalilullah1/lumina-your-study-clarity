import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { SocialProof } from "@/components/SocialProof";
import { ProblemSection } from "@/components/ProblemSection";
import { SolutionSection } from "@/components/SolutionSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      {/* Standalone Theme Toggle - Fixed Position, before nav links */}
      <div className="fixed top-4 right-32 md:right-48 z-[60]">
        <ThemeToggle />
      </div>
      
      <Navbar />
      <HeroSection />
      <SocialProof />
      <ProblemSection />
      <SolutionSection />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
