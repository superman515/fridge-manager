"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types/user";

interface UseUserFamilyReturn {
  familyGroupId: string | null;
  loading: boolean;
  error: string | null;
}

export function useUserFamily(): UseUserFamilyReturn {
  const { firebaseUser } = useAuth();
  const [familyGroupId, setFamilyGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setFamilyGroupId(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", firebaseUser.uid);
    const unsubscribe = onSnapshot(
      ref,
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data() as User;
          setFamilyGroupId(data.familyGroupId ?? null);
        }
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  return { familyGroupId, loading, error };
}
