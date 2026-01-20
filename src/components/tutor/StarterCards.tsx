import { Card } from "@/components/ui/card";
import { MessageCircle, BookOpen, BrainCircuit, NotebookPen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyFlowLogo } from "@/components/StudyFlowLogo";

interface StarterCardsProps {
  onCardClick: (text: string) => void;
}

export const StarterCards = ({ onCardClick }: StarterCardsProps) => {
  const starters = [
    {
      icon: BookOpen,
      title: "Summarize",
      text: "Create a bullet-point summary of any document",
      prompt: "Summarize this document into bullet points.",
      gradient: "from-primary/20 to-accent/20",
      iconColor: "text-primary",
      hoverBorder: "hover:border-primary/40"
    },
    {
      icon: BrainCircuit,
      title: "Quiz me",
      text: "Generate MCQs to test your knowledge",
      prompt: "Generate a quiz based on this text.",
      gradient: "from-accent/20 to-primary/20",
      iconColor: "text-accent",
      hoverBorder: "hover:border-accent/40"
    },
    {
      icon: MessageCircle,
      title: "Explain Terms",
      text: "Define complex terms in simple words",
      prompt: "Identify and define key terms from this document.",
      gradient: "from-secondary/30 to-muted/30",
      iconColor: "text-secondary-foreground",
      hoverBorder: "hover:border-secondary/40"
    },
    {
      icon: NotebookPen,
      title: "Study Notes",
      text: "Create organized study notes",
      prompt: "Create detailed study notes from this document.",
      gradient: "from-muted/30 to-secondary/30",
      iconColor: "text-muted-foreground",
      hoverBorder: "hover:border-muted-foreground/40"
    },
    {
      icon: Layers,
      title: "Flashcards",
      text: "Generate flashcards for revision",
      prompt: "Create flashcards with questions and answers from this document.",
      gradient: "from-primary/15 to-accent/15",
      iconColor: "text-primary",
      hoverBorder: "hover:border-primary/40"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Hero Section */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6 glow-primary">
          <StudyFlowLogo size="xl" variant="purple" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Hi! I'm <span className="gradient-text">StudyFlow</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Your AI study companion. Upload a document, image, or ask me anything!
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 w-full max-w-5xl">
        {starters.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card 
              key={i} 
              className={cn(
                "group relative p-5 cursor-pointer transition-all duration-300",
                "border-2 border-transparent bg-card/80 backdrop-blur-sm",
                "hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1",
                card.hoverBorder
              )}
              onClick={() => onCardClick(card.prompt)}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Gradient background on hover */}
              <div className={cn(
                "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "bg-gradient-to-br",
                card.gradient
              )} />

              <div className="relative flex flex-col gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br",
                  card.gradient
                )}>
                  <Icon className={cn("w-6 h-6", card.iconColor)} />
                </div>
                <h3 className="font-semibold text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.text}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Hint */}
      <p className="mt-8 text-sm text-muted-foreground/60 text-center">
        💡 Tip: Upload a PDF, image, or paste text to get started
      </p>
    </div>
  );
};
