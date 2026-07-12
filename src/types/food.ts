import type { Timestamp } from "firebase/firestore";

export type FoodCategory = "채소" | "육류" | "유제품" | "기타";

export interface Food {
  id: string;
  familyGroupId: string;
  name: string;
  category: FoodCategory;
  expiryDate: string;
  addedBy: string;
  addedAt: Timestamp;
}
