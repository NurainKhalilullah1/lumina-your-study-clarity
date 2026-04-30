import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TIER_CONFIG, useSubscription } from "@/hooks/useSubscription";
import UpgradeDialog, { UpgradeRequestStatus } from "@/components/UpgradeDialog";
import DashboardLayout from "@/components/DashboardLayout";

const tiers = [
  {
    key: "free" as const,
    icon: Zap,
    badge: null,
    cta: "Current Plan",
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

const UpgradePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tier, requests: upgradeRequests } = useSubscription();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"pro" | "premium">("pro");

  const handleTierClick = (tierKey: "free" | "pro" | "premium") => {
    if (tierKey === "free") return;
    if (!user) {
      navigate("/auth");
      return;
    }
    setSelectedTier(tierKey);
    setUpgradeDialogOpen(true);
  };

  const content = (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {user && (
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Choose Your <span className="gradient-text">Study Plan</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Start free and upgrade when you need more power. Pay via bank transfer.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t, i) => {
          const config = TIER_CONFIG[t.key];
          const isCurrent = tier === t.key;
          const isDowngrade = (tier === "premium") || (tier === "pro" && t.key === "free");
          return (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={`relative h-full flex flex-col ${
                  t.popular
                    ? "border-primary shadow-lg scale-[1.02]"
                    : "border-border"
                }`}
              >
                {t.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary text-primary-foreground px-3">
                      {t.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <t.icon className="w-6 h-6 text-primary-foreground" />
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
                    className={`w-full ${t.popular && !isCurrent ? "gradient-primary text-primary-foreground" : ""}`}
                    variant={isCurrent ? "secondary" : t.popular ? "default" : "outline"}
                    disabled={isCurrent || (isDowngrade && t.key !== tier)}
                    onClick={() => handleTierClick(t.key)}
                  >
                    {isCurrent ? "Current Plan" : t.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent upgrade requests */}
      {upgradeRequests.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Your Upgrade Requests</h2>
            <div className="space-y-3">
              {upgradeRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {req.requested_tier} — ₦{req.amount.toLocaleString()} — {new Date(req.created_at).toLocaleDateString()}
                  </span>
                  <UpgradeRequestStatus status={req.status} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        selectedTier={selectedTier}
      />
    </div>
  );

  // Wrap in DashboardLayout if authenticated
  if (user) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  // Simple layout for unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12">
        {content}
      </div>
    </div>
  );
};

export default UpgradePage;
