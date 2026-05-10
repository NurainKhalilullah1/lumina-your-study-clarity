import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { SocialProof } from "@/components/SocialProof";
import { ProblemSection } from "@/components/ProblemSection";
import { SolutionSection } from "@/components/SolutionSection";
import { StatsSection } from "@/components/StatsSection";
import { PricingSection } from "@/components/PricingSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";


const Index = () => {
  return (
    <main className="min-h-screen bg-background">

      
      <Navbar />
      <HeroSection />
      <SocialProof />
      <ProblemSection />
      <SolutionSection />
      <StatsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
