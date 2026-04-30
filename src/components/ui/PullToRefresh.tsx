import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);

  const pullDistance = Math.max(0, currentY - startY);
  const threshold = 80;
  const isThresholdMet = pullDistance >= threshold;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling || refreshing || window.scrollY > 0) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = useCallback(async () => {
    if (!pulling || refreshing) return;
    setPulling(false);

    if (isThresholdMet) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setStartY(0);
    setCurrentY(0);
  }, [pulling, refreshing, isThresholdMet, onRefresh]);

  useEffect(() => {
    const handleMouseUp = () => handleTouchEnd();
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleTouchEnd]);

  return (
    <div
      className="relative w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute top-0 left-0 w-full flex justify-center items-center transition-transform duration-300"
        style={{
          transform: `translateY(${refreshing ? 20 : Math.min(pullDistance - 40, 20)}px)`,
          opacity: refreshing || pulling ? 1 : 0,
          zIndex: 50,
        }}
      >
        <div className="bg-background border border-border rounded-full shadow-md p-2 flex items-center justify-center">
          {refreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <ArrowDown
              className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                isThresholdMet ? "rotate-180 text-primary" : ""
              }`}
            />
          )}
        </div>
      </div>

      <div
        className="transition-transform duration-300"
        style={{
          transform: `translateY(${refreshing ? 60 : Math.min(pullDistance, 80)}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
