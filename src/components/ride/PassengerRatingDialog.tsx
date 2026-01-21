import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/star-rating";
import { User, Heart } from "lucide-react";

interface PassengerRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passengerName: string;
  onSubmit: (rating: number, comment?: string) => void;
}

export function PassengerRatingDialog({
  open,
  onOpenChange,
  passengerName,
  onSubmit,
}: PassengerRatingDialogProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    onSubmit(rating, comment.trim() || undefined);
    // Reset for next use
    setRating(5);
    setComment("");
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 3:
        return "Bom";
      case 4:
        return "Muito bom";
      case 5:
        return "Excelente";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <User className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Avaliar Passageiro</DialogTitle>
          <DialogDescription className="text-base">
            Como foi a experiência com <span className="font-medium text-foreground">{passengerName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <StarRating 
              value={rating} 
              onChange={setRating} 
              minRating={3}
              size="lg"
            />
            <div className="flex items-center gap-1.5 text-sm">
              <Heart className="w-4 h-4 text-primary fill-primary" />
              <span className="font-medium text-primary">{getRatingLabel(rating)}</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Mínimo 3 estrelas — nossos passageiros são selecionados 💎
            </p>
          </div>

          {/* Optional Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Comentário (opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi a corrida..."
              className="resize-none h-20"
              maxLength={200}
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full h-12 text-base gap-2"
          >
            Enviar Avaliação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
