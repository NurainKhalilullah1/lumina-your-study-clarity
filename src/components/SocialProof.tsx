import { motion } from "framer-motion";
import abuLogo from "@/assets/logos/abu-logo.png";
import unilagLogo from "@/assets/logos/unilag-logo.png";
import lasuLogo from "@/assets/logos/lasu-logo.png";
import uiLogo from "@/assets/logos/ui-logo.png";
import unilorinLogo from "@/assets/logos/unilorin-logo.png";
import oauLogo from "@/assets/logos/oau-logo.png";

const logos = [
  { src: abuLogo, alt: "ABU" },
  { src: unilagLogo, alt: "UNILAG" },
  { src: lasuLogo, alt: "LASU" },
  { src: uiLogo, alt: "University of Ibadan" },
  { src: unilorinLogo, alt: "UNILORIN" },
  { src: oauLogo, alt: "OAU" },
];

export const SocialProof = () => {
  return (
    <section className="py-16 bg-muted/30 border-y border-border/50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground"
        >
          Trusted by students at top universities
        </motion.p>
      </div>

      {/* Logo Marquee */}
      <div className="relative">
        <div className="flex animate-marquee">
          {/* First set of logos */}
          {[...logos, ...logos].map((logo, index) => (
            <div
              key={index}
              className="flex-shrink-0 mx-8 sm:mx-12 group"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="h-16 sm:h-20 w-auto object-contain grayscale opacity-50 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110"
              />
            </div>
          ))}
        </div>

        {/* Gradient Overlays for smooth edges */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-muted/30 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-muted/30 to-transparent pointer-events-none" />
      </div>
    </section>
  );
};
