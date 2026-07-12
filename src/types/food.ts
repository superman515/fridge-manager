import type { Timestamp } from "firebase/firestore";

export type FoodCategory = "채소" | "과일" | "육류" | "유제품" | "수산" | "기타";
export type FoodLocation = "냉장" | "냉동" | "실온";

export interface Food {
  id: string;
  familyGroupId: string;
  name: string;
  product: string;
  category: FoodCategory;
  location: FoodLocation;
  quantity: string;
  expiryDate: string;
  addedBy: string;
  addedAt: Timestamp;
}
