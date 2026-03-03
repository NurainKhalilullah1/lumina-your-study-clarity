import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashcardViewer } from "@/components/tutor/FlashcardViewer";
import { useAuth } from "@/contexts/AuthContext";
import { useFlashcards, useDeleteFlashcard } from "@/hooks/useFlashcards";
import { Layers, Trash2, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Flashcards() {
  const { user } = useAuth();
  const { data: flashcards, isLoading } = useFlashcards(user?.id);
  const deleteFlashcard = useDeleteFlashcard();
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);

  // Group flashcards by deck_name
  const decks = flashcards?.reduce((acc, card) => {
    const deckName = card.deck_name || 'General';
    if (!acc[deckName]) {
      acc[deckName] = [];
    }
    acc[deckName].push(card);
    return acc;
  }, {} as Record<string, typeof flashcards>) || {};

  const deckNames = Object.keys(decks);
  const selectedCards = selectedDeck ? decks[selectedDeck] || [] : [];

  const handleDeleteCard = async (id: string) => {
    try {
      await deleteFlashcard.mutateAsync(id);
      toast.success("Flashcard deleted");
    } catch {
      toast.error("Failed to delete flashcard");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Layers className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Flashcards</h1>
            <p className="text-muted-foreground">
              {flashcards?.length || 0} cards across {deckNames.length} deck{deckNames.length !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>

        {deckNames.length === 0 ? (
          /* Empty state */
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                Generate flashcards from your study sessions in the AI Tutor to see them here.
              </p>
              <Button asChild>
                <a href="/tutor">Go to AI Tutor</a>
              </Button>
            </CardContent>
          </Card>
        ) : selectedDeck ? (
          /* Flashcard viewer */
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedDeck(null)}
              className="mb-4"
            >
              ← Back to decks
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>{selectedDeck}</CardTitle>
                <CardDescription>{selectedCards.length} cards</CardDescription>
              </CardHeader>
              <CardContent>
                <FlashcardViewer cards={selectedCards} />
                
                {/* Card list for management */}
                <div className="mt-8 border-t pt-6">
                  <h4 className="font-medium mb-4">All Cards in Deck</h4>
                  <div className="space-y-3">
                    {selectedCards.map((card) => (
                      <div 
                        key={card.id}
                        className="flex items-start justify-between p-4 rounded-lg bg-muted/50 border"
                      >
                        <div className="flex-1 mr-4">
                          <p className="font-medium text-sm mb-1">{card.front}</p>
                          <p className="text-sm text-muted-foreground">{card.back}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCard(card.id)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Deck grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deckNames.map((deckName) => {
              const cards = decks[deckName];
              return (
                <Card 
                  key={deckName}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1",
                    "hover:border-primary/40"
                  )}
                  onClick={() => setSelectedDeck(deckName)}
                >
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-2">
                      <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{deckName}</CardTitle>
                    <CardDescription>
                      {cards.length} card{cards.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {cards[0]?.front}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
