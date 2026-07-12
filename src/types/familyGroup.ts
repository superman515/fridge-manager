import type { Timestamp } from "firebase/firestore";

export interface FamilyGroup {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  inviteCode: string;
  createdAt: Timestamp;
}
