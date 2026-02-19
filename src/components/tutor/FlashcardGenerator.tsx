import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Sparkles, Check } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateFlashcards } from "@/hooks/useFlashcards";
import { FlashcardViewer } from "./FlashcardViewer";
import { toast } from "sonner";

interface FlashcardGeneratorProps {
  content: string;
  sessionId?: string;
  deckName?: string;
  onComplete?: () => void;
  triggerGenerate?: boolean;
  onTriggerHandled?: () => void;
}

interface GeneratedCard {
  front: string;
  back: string;
}

export const FlashcardGenerator = ({
  content,
  sessionId,
  deckName = "Study Session",
  onComplete,
  triggerGenerate,
  onTriggerHandled,
}: FlashcardGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  const { user } = useAuth();
  const createFlashcards = useCreateFlashcards();

  // Handle external trigger
  useEffect(() => {
    if (triggerGenerate) {
      generateFlashcards();
      onTriggerHandled?.();
    }
  }, [triggerGenerate]);

  const generateFlashcards = async () => {
    if (!content.trim()) {
      toast.error("No content to generate flashcards from");
      return;
    }

    setIsGenerating(true);
    setGeneratedCards([]);
    setIsSaved(false);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        toast.error("API key not configured");
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Based on the following content, generate 5-10 flashcards for studying. Each flashcard should have a clear question (front) and a concise answer (back).

Content:
${content.slice(0, 8000)}

Respond ONLY with a valid JSON array in this exact format, no other text:
[
  {"front": "Question here?", "back": "Answer here"},
  {"front": "Another question?", "back": "Another answer"}
]

Make the questions test understanding, not just recall. Keep answers concise but complete.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Could not parse flashcards from response");
      }

      const cards: GeneratedCard[] = JSON.parse(jsonMatch[0]);
      setGeneratedCards(cards);
      setIsOpen(true);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error("Failed to generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveFlashcards = async () => {
    if (!user || generatedCards.length === 0) return;

    try {
      const flashcardsToSave = generatedCards.map((card) => ({
        user_id: user.id,
        session_id: sessionId || null,
        front: card.front,
        back: card.back,
        deck_name: deckName,
      }));

      await createFlashcards.mutateAsync(flashcardsToSave);
      setIsSaved(true);
      toast.success(`${generatedCards.length} flashcards saved!`);
      onComplete?.();
    } catch (error) {
      console.error("Error saving flashcards:", error);
      toast.error("Failed to save flashcards");
    }
  };

  const flashcardsWithIds = generatedCards.map((card, idx) => ({
    id: `temp-${idx}`,
    ...card,
  }));

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={generateFlashcards}
        disabled={isGenerating || !content.trim()}
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Flashcards
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generated Flashcards
            </DialogTitle>
            <DialogDescription>{generatedCards.length} flashcards created from your content</DialogDescription>
          </DialogHeader>

          <FlashcardViewer cards={flashcardsWithIds} />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button onClick={saveFlashcards} disabled={isSaved || createFlashcards.isPending} className="gap-2">
              {isSaved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : createFlashcards.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save to My Flashcards"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
