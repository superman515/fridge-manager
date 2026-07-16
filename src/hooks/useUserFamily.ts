"use client";

import { useUserProfile } from "@/hooks/useUserProfile";

interface UseUserFamilyReturn {
  familyGroupId: string | null;
  loading: boolean;
  error: string | null;
}

export function useUserFamily(): UseUserFamilyReturn {
  const { profile, loading, error } = useUserProfile();
  return {
    familyGroupId: profile?.familyGroupId ?? null,
    loading,
    error,
  };
}
