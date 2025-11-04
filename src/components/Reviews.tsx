
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  rating: number;
  createdAt: any;
}

interface ReviewsProps {
  itemId: string;
  itemType: 'service' | 'product';
}

export const Reviews = ({ itemId, itemType }: ReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!itemId) return;

    const reviewsRef = collection(db, `${itemType}s`, itemId, 'reviews');
    const q = query(reviewsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reviewsData: Review[] = [];
      querySnapshot.forEach((doc) => {
        reviewsData.push({ id: doc.id, ...doc.data() } as Review);
      });
      setReviews(reviewsData);
    });

    return () => unsubscribe();
  }, [itemId, itemType]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Reviews</h3>
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="flex gap-4">
            <Avatar>
              <AvatarImage src={review.userPhotoURL} />
              <AvatarFallback>{review.userName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{review.userName}</p>
                <Rating rating={review.rating} size={16} />
              </div>
              <p className="text-sm text-muted-foreground">{review.createdAt?.toDate?.().toLocaleDateString()}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
