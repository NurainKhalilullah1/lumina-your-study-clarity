import { motion } from "framer-motion";
import { Sparkles, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";

const suggestedQuestions = [
  "Explain Newton's Second Law of Motion",
  "How do I solve integration by parts?",
  "What are the key themes in this essay?",
  "Summarize Chapter 5 of my textbook",
];

const Tutor = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 h-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">AI Tutor</h1>
          <p className="text-muted-foreground mt-1">Ask questions about your course materials.</p>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 bg-card rounded-xl shadow-sm border border-border flex flex-col"
        >
          {/* Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">How can I help you today?</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Upload your course materials and ask me anything. I can explain concepts, summarize chapters, and help you study.
            </p>

            {/* Suggested Questions */}
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  {question}
                </Button>
              ))}
            </div>

            {/* Upload Hint */}
            <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>No documents uploaded yet. Upload PDFs to get started.</span>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question about your materials..."
                className="flex-1"
              />
              <Button size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Tutor;
