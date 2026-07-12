import { collection, doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { FamilyGroup } from "@/types/familyGroup";
import { updateUserProfile } from "@/lib/firebase/auth";

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const code1 = Array(3)
    .fill(0)
    .map(() => chars[Math.floor(Math.random() * 26)])
    .join("");
  const code2 = Array(4)
    .fill(0)
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
  return `${code1}-${code2}`;
}

export async function createFamilyGroup(uid: string, groupName: string): Promise<FamilyGroup> {
  const ref = collection(db, "familyGroups");
  const groupId = doc(ref).id;
  const inviteCode = generateInviteCode();

  const groupData: FamilyGroup = {
    id: groupId,
    name: groupName,
    createdBy: uid,
    members: [uid],
    inviteCode,
    createdAt: serverTimestamp() as any,
  };

  await setDoc(doc(db, "familyGroups", groupId), groupData);
  await updateDoc(doc(db, "users", uid), { familyGroupId: groupId });

  return groupData;
}

export async function getFamilyGroup(groupId: string): Promise<FamilyGroup | null> {
  const ref = doc(db, "familyGroups", groupId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as FamilyGroup;
}
