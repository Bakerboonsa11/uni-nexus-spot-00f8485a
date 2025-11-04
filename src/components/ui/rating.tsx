
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
  fill?: boolean;
  className?: string;
}

export const Rating = ({ rating, totalStars = 5, size = 20, fill = true, className }: RatingProps) => {
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1;
  const emptyStars = totalStars - fullStars - (partialStar > 0 ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={size} className="text-yellow-400 fill-yellow-400" />
      ))}
      {partialStar > 0 && (
        <div className="relative">
          <Star size={size} className="text-yellow-400" />
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{ width: `${partialStar * 100}%` }}
          >
            <Star size={size} className="text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-gray-300" />
      ))}
    </div>
  );
};
