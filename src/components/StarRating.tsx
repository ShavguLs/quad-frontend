import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  interactive = false,
  size = 'md',
  onChange
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  // Ensure rating is a number
  const numericRating = Number(rating) || 0;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`
            ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} 
            transition-transform
          `}
        >
          <Star
            className={`
              ${sizeClasses[size]} 
              ${star <= (hoverRating || numericRating) 
                ? 'fill-[#FFFF2E] text-[#FFFF2E]' 
                : 'fill-none text-gray-600'}
              transition-colors
            `}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
