import { BookOpen, BrainCircuit, FileText, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface StarterCardsProps {
  onSelect: (prompt: string) => void;
}

const starters = [
  {
    icon: FileText,
    title: "Summarize a PDF",
    prompt: "Can you summarize the key points from my uploaded document?",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: BrainCircuit,
    title: "Create a Quiz",
    prompt: "Create a practice quiz based on my course materials.",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    icon: BookOpen,
    title: "Explain a Topic",
    prompt: "Explain the concept in simple terms with examples.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Calendar,
    title: "Study Plan",
    prompt: "Help me create a study plan for my upcoming exam.",
    color: "bg-orange-500/10 text-orange-600",
  },
];

const StarterCards = ({ onSelect }: StarterCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
      {starters.map((starter, index) => (
        <motion.button
          key={starter.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelect(starter.prompt)}
          className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left group"
        >
          <div className={`p-2 rounded-lg ${starter.color}`}>
            <starter.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
              {starter.title}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {starter.prompt}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default StarterCards;
