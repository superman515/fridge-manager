import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { User } from "@/types/user";

export async function getUserProfile(uid: string): Promise<User | null> {
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return {
    uid: snapshot.id,
    ...snapshot.data(),
  } as User;
}
