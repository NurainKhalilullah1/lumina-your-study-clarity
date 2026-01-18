import { Card } from "@/components/ui/card";
import { MessageCircle, BookOpen, BrainCircuit } from "lucide-react";

interface StarterCardsProps {
  onCardClick: (text: string) => void;
}

// Named export to match Tutor.tsx import { StarterCards }
export const StarterCards = ({ onCardClick }: StarterCardsProps) => {
  const starters = [
    {
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      title: "Summarize this topic",
      text: "Create a bullet-point summary of the attached document.",
      prompt: "Summarize this document into bullet points."
    },
    {
      icon: <BrainCircuit className="w-5 h-5 text-purple-500" />,
      title: "Quiz me",
      text: "Generate 5 MCQs to test my knowledge.",
      prompt: "Generate a quiz based on this text."
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-green-500" />,
      title: "Explain Key Terms",
      text: "Find complex terms and define them simply.",
      prompt: "Identify and define key terms from this document."
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {starters.map((card, i) => (
        <Card 
          key={i} 
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20"
          onClick={() => onCardClick(card.prompt)}
        >
          <div className="flex flex-col gap-2">
            <div className="mb-2">{card.icon}</div>
            <h3 className="font-semibold">{card.title}</h3>
            <p className="text-sm text-muted-foreground">{card.text}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};
