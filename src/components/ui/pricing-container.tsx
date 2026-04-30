"use client"
import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion'
import { cn } from '@/lib/utils';

export interface PricingPlan {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isPopular?: boolean;
  accent: string;
  cta: string;
  onCtaClick?: () => void;
}

interface PricingProps {
  title?: string;
  plans: PricingPlan[];
  className?: string;
}

// Counter Component
const Counter = ({ from, to }: { from: number; to: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const controls = animate(from, to, {
      duration: 1,
      onUpdate(value) {
        node.textContent = value.toFixed(0);
      },
    });
    return () => controls.stop();
  }, [from, to]);
  return <span ref={nodeRef} />;
};

// Toggle Component
const PricingToggle = ({ isYearly, onToggle }: { isYearly: boolean; onToggle: () => void }) => (
  <div className="flex justify-center items-center gap-4 mb-8 relative z-10">
    <span className={cn("font-medium transition-colors", !isYearly ? 'text-foreground' : 'text-muted-foreground')}>Monthly</span>
    <motion.button
      className="w-16 h-8 flex items-center bg-muted rounded-full p-1 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]"
      onClick={onToggle}
      aria-label="Toggle billing period"
    >
      <motion.div
        className="w-6 h-6 bg-background rounded-full border-2 border-border"
        animate={{ x: isYearly ? 32 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </motion.button>
    <span className={cn("font-medium transition-colors", isYearly ? 'text-foreground' : 'text-muted-foreground')}>Yearly</span>
    {isYearly && (
      <motion.span
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-green-500 font-medium text-sm"
      >
        Save 20%
      </motion.span>
    )}
  </div>
);

// Background Effects Component
const BackgroundEffects = () => (
  <>
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary/10 rounded-full"
          style={{
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, ((i % 2 === 0 ? 1 : -1) * 10), 0],
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + (i % 3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
    <div className="absolute inset-0 opacity-30" style={{
      backgroundImage: "linear-gradient(hsl(var(--primary)/0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.04) 1px, transparent 1px)",
      backgroundSize: "24px 24px"
    }} />
  </>
);

// Pricing Card Component
const PricingCard = ({
  plan,
  isYearly,
  index,
}: {
  plan: PricingPlan;
  isYearly: boolean;
  index: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 15, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springConfig);

  const currentPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const previousPrice = !isYearly ? plan.yearlyPrice : plan.monthlyPrice;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2 }}
      style={{ rotateX, rotateY, perspective: 1000 }}
      onMouseMove={(e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        mouseX.set((e.clientX - centerX) / rect.width);
        mouseY.set((e.clientY - centerY) / rect.height);
      }}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      className={cn(
        `relative w-full bg-card rounded-xl p-6 border-2 border-border`,
        `shadow-[6px_6px_0px_0px_hsl(var(--border))]`,
        `hover:shadow-[8px_8px_0px_0px_hsl(var(--primary)/0.4)]`,
        `transition-all duration-200`,
        plan.isPopular && "border-primary shadow-[6px_6px_0px_0px_hsl(var(--primary)/0.5)]"
      )}
    >
      {/* Price Badge */}
      <motion.div
        className={cn(
          `absolute -top-4 -right-4 w-20 h-20`,
          `rounded-full flex items-center justify-center border-2 border-border`,
          `shadow-[3px_3px_0px_0px_hsl(var(--border))]`,
          plan.accent
        )}
        animate={{
          rotate: [0, 10, 0, -10, 0],
          scale: [1, 1.1, 0.9, 1.1, 1],
          y: [0, -5, 5, -3, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="text-center text-white px-1">
          {currentPrice === 0 ? (
            <div className="text-base font-black leading-tight">Free</div>
          ) : (
            <>
              <div className="text-[10px] font-bold leading-tight">₦</div>
              <div className="text-base font-black leading-tight">
                <Counter from={previousPrice} to={currentPrice} />
              </div>
              <div className="text-[9px] font-bold leading-tight">/{isYearly ? 'yr' : 'mo'}</div>
            </>
          )}
        </div>
      </motion.div>

      {/* Plan Name and Popular Badge */}
      <div className="mb-4 pr-12">
        <h3 className="text-xl font-black text-foreground mb-2">{plan.name}</h3>
        {plan.isPopular && (
          <motion.span
            className={cn(
              `inline-block px-3 py-1 text-white font-bold rounded-md text-xs border-2 border-border`,
              `shadow-[2px_2px_0px_0px_hsl(var(--border))]`,
              plan.accent
            )}
            animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            MOST POPULAR
          </motion.span>
        )}
      </div>

      {/* Features List */}
      <div className="space-y-2 mb-5">
        {plan.features.map((feature, i) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{
              x: 5,
              scale: 1.02,
              transition: { type: "spring", stiffness: 400 },
            }}
            className={cn(
              `flex items-center gap-2 p-2 bg-muted/60 rounded-md border border-border/60`,
              `shadow-[2px_2px_0px_0px_hsl(var(--border)/0.5)]`
            )}
          >
            <motion.span
              whileHover={{ scale: 1.2, rotate: 360 }}
              className={cn(
                `w-5 h-5 rounded-md flex items-center justify-center`,
                `text-white font-bold text-xs border border-border/60`,
                plan.accent
              )}
            >
              ✓
            </motion.span>
            <span className="text-foreground font-medium text-sm">{feature}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA Button */}
      <motion.button
        className={cn(
          `w-full py-2.5 rounded-lg text-white font-black text-sm`,
          `border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))]`,
          `hover:shadow-[6px_6px_0px_0px_hsl(var(--border))]`,
          `active:shadow-[2px_2px_0px_0px_hsl(var(--border))]`,
          `transition-all duration-200`,
          plan.accent
        )}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.95, rotate: [-1, 1, 0] }}
        onClick={plan.onCtaClick}
      >
        {plan.cta} →
      </motion.button>
    </motion.div>
  );
};

// Main Container Component
export const PricingContainer = ({ title = "Pricing Plans", plans, className = "" }: PricingProps) => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className={cn(`relative overflow-hidden rounded-[12px] bg-background/50 py-12 px-4 sm:px-8`, className)}>
      <div className="text-center mb-8 sm:mb-12 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-2"
        >
          {title}
        </motion.h2>
        <motion.div
          className="h-1 w-24 mx-auto bg-gradient-to-r from-primary to-accent rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4 }}
        />
      </div>

      <PricingToggle isYearly={isYearly} onToggle={() => setIsYearly(!isYearly)} />
      <BackgroundEffects />

      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {plans.map((plan, index) => (
          <PricingCard
            key={plan.name}
            plan={plan}
            isYearly={isYearly}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};
