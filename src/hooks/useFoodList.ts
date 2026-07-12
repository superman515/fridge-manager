import { useState, useEffect } from "react";
import { subscribeToFoodList } from "@/lib/firebase/food";
import type { Food } from "@/types/food";

export function useFoodList(groupId: string | null) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setFoods([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToFoodList(groupId, foods => {
      setFoods(foods);
      setLoading(false);
    });

    return unsubscribe;
  }, [groupId]);

  return { foods, loading, error };
}
