import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrackStudyEvent } from "@/hooks/useStudyStats";
import { useAuth } from "@/contexts/AuthContext";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  cards: Flashcard[];
  onClose?: () => void;
  trackReviews?: boolean;
}

export const FlashcardViewer = ({ cards, onClose, trackReviews = true }: FlashcardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState(cards);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  
  const { user } = useAuth();
  const trackEvent = useTrackStudyEvent();

  const currentCard = shuffledCards[currentIndex];

  // Track when a card is flipped (reviewed)
  useEffect(() => {
    if (isFlipped && currentCard && !reviewedCards.has(currentCard.id) && trackReviews && user) {
      setReviewedCards(prev => new Set(prev).add(currentCard.id));
      trackEvent.mutate({
        userId: user.id,
        eventType: 'flashcard_reviewed',
        metadata: { cardId: currentCard.id }
      });
    }
  }, [isFlipped, currentCard, reviewedCards, trackReviews, user, trackEvent]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledCards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + shuffledCards.length) % shuffledCards.length);
    }, 150);
  };

  const handleShuffle = () => {
    const shuffled = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setShuffledCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No flashcards yet.</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Generate flashcards from your documents!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Progress */}
      <div className="text-sm text-muted-foreground">
        Card {currentIndex + 1} of {shuffledCards.length}
      </div>

      {/* Flashcard */}
      <div 
        className="perspective-1000 w-full max-w-md h-64 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={cn(
            "relative w-full h-full transition-transform duration-500 transform-style-preserve-3d",
            isFlipped && "rotate-y-180"
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <Card 
            className="absolute inset-0 p-6 flex items-center justify-center text-center backface-hidden bg-gradient-to-br from-primary/10 to-accent/10 border-2"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Question</p>
              <p className="text-lg font-medium">{currentCard?.front}</p>
            </div>
          </Card>

          {/* Back */}
          <Card 
            className="absolute inset-0 p-6 flex items-center justify-center text-center backface-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">Answer</p>
              <p className="text-lg font-medium">{currentCard?.back}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Tap hint */}
      <p className="text-xs text-muted-foreground/60">
        Tap card to flip
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={shuffledCards.length <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={shuffledCards.length <= 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleShuffle}
          title="Shuffle"
        >
          <Shuffle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
