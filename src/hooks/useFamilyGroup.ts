"use client";

import { useState, useEffect } from "react";
import { subscribeToFamilyGroup } from "@/lib/firebase/family";
import type { FamilyGroup } from "@/types/familyGroup";

export function useFamilyGroup(groupId: string | null) {
  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToFamilyGroup(
      groupId,
      g => {
        setGroup(g);
        setLoading(false);
      },
      err => {
        setError(err.message);
        setGroup(null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [groupId]);

  return { group, loading, error };
}
