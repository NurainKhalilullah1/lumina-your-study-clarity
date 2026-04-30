import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TIER_CONFIG } from "@/hooks/useSubscription";
import { PricingContainer, PricingPlan } from "@/components/ui/pricing-container";
import { Badge } from "@/components/ui/badge";

const ACCENT_MAP = {
  free: "bg-violet-500",
  pro: "bg-indigo-500",
  premium: "bg-purple-600",
};

export const PricingSection = () => {
  const navigate = useNavigate();

  const plans: PricingPlan[] = [
    {
      name: TIER_CONFIG.free.name,
      monthlyPrice: TIER_CONFIG.free.price,
      yearlyPrice: TIER_CONFIG.free.price,
      features: [...TIER_CONFIG.free.features],
      isPopular: false,
      accent: ACCENT_MAP.free,
      cta: "Get Started Free",
      onCtaClick: () => navigate("/auth"),
    },
    {
      name: TIER_CONFIG.pro.name,
      monthlyPrice: TIER_CONFIG.pro.price,
      yearlyPrice: Math.floor(TIER_CONFIG.pro.price * 10), // ~2 months free yearly
      features: [...TIER_CONFIG.pro.features],
      isPopular: true,
      accent: ACCENT_MAP.pro,
      cta: "Upgrade to Pro",
      onCtaClick: () => navigate("/upgrade"),
    },
    {
      name: TIER_CONFIG.premium.name,
      monthlyPrice: TIER_CONFIG.premium.price,
      yearlyPrice: Math.floor(TIER_CONFIG.premium.price * 10),
      features: [...TIER_CONFIG.premium.features],
      isPopular: false,
      accent: ACCENT_MAP.premium,
      cta: "Upgrade to Premium",
      onCtaClick: () => navigate("/upgrade"),
    },
  ];

  return (
    <section className="py-20 px-4 relative bg-glow">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your <span className="gradient-text">Study Plan</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start free and upgrade when you need more power. Pay via bank transfer.
          </p>
        </motion.div>

        <PricingContainer
          title=""
          plans={plans}
          className="bg-transparent py-4"
        />
      </div>
    </section>
  );
};
