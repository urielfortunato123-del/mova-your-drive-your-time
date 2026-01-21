import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  minRating?: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function StarRating({
  value,
  onChange,
  minRating = 3,
  maxRating = 5,
  size = "lg",
  disabled = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleClick = (rating: number) => {
    if (disabled) return;
    // Ensure minimum rating
    const finalRating = Math.max(rating, minRating);
    onChange(finalRating);
  };

  const handleMouseEnter = (rating: number) => {
    if (disabled) return;
    setHoverRating(Math.max(rating, minRating));
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  const displayRating = hoverRating ?? value;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => {
        const isFilled = star <= displayRating;
        const isMinimum = star <= minRating;

        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            className={cn(
              "transition-all duration-150 focus:outline-none",
              disabled ? "cursor-default" : "cursor-pointer hover:scale-110",
              sizeClasses[size]
            )}
            aria-label={`Avaliar ${star} estrelas`}
          >
            <Star
              className={cn(
                "w-full h-full transition-colors duration-150",
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : isMinimum
                  ? "fill-yellow-400/30 text-yellow-400/50"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
