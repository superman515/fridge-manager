import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Food } from "@/types/food";

export async function addFood(
  groupId: string,
  uid: string,
  data: Omit<Food, "id" | "familyGroupId" | "addedBy" | "addedAt">
): Promise<string> {
  const ref = collection(db, "foods");
  const doc = await addDoc(ref, {
    ...data,
    familyGroupId: groupId,
    addedBy: uid,
    addedAt: serverTimestamp(),
  });
  return doc.id;
}

export async function getFoodList(groupId: string): Promise<Food[]> {
  const ref = collection(db, "foods");
  const q = query(ref, where("familyGroupId", "==", groupId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Food));
}

export async function updateFood(
  foodId: string,
  data: Partial<Omit<Food, "id" | "familyGroupId" | "addedBy" | "addedAt">>
): Promise<void> {
  const ref = doc(db, "foods", foodId);
  await updateDoc(ref, data);
}

export async function deleteFood(foodId: string): Promise<void> {
  const ref = doc(db, "foods", foodId);
  await deleteDoc(ref);
}

export function subscribeToFoodList(
  groupId: string,
  callback: (foods: Food[]) => void
): () => void {
  const ref = collection(db, "foods");
  const q = query(ref, where("familyGroupId", "==", groupId));

  const unsubscribe = onSnapshot(q, snapshot => {
    const foods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Food));
    callback(foods);
  });

  return unsubscribe;
}
