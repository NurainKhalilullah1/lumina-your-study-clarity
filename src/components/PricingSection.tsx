import { motion } from "framer-motion";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { TIER_CONFIG } from "@/hooks/useSubscription";

const tiers = [
  {
    key: "free" as const,
    icon: Zap,
    badge: null,
    cta: "Get Started",
    popular: false,
  },
  {
    key: "pro" as const,
    icon: Sparkles,
    badge: "Most Popular",
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    key: "premium" as const,
    icon: Crown,
    badge: "Best Value",
    cta: "Upgrade to Premium",
    popular: false,
  },
];

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 relative bg-glow">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
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

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier, i) => {
            const config = TIER_CONFIG[tier.key];
            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`relative h-full flex flex-col ${
                    tier.popular
                      ? "border-primary shadow-lg glow-primary scale-[1.02]"
                      : "border-border"
                  }`}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-primary text-primary-foreground px-3">
                        {tier.badge}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-3 w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <tier.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{config.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">
                        {config.price === 0 ? "Free" : `₦${config.price.toLocaleString()}`}
                      </span>
                      {config.price > 0 && (
                        <span className="text-muted-foreground text-sm">/month</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      {config.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${tier.popular ? "gradient-primary text-primary-foreground" : ""}`}
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => {
                        if (tier.key === "free") {
                          navigate("/auth");
                        } else {
                          navigate("/upgrade");
                        }
                      }}
                    >
                      {tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
