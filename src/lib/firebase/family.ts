import { collection, doc, getDoc, setDoc, serverTimestamp, updateDoc, where, query, getDocs, arrayUnion, arrayRemove } from "firebase/firestore";
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

  // Create invite mapping for non-members to resolve the code
  await setDoc(doc(db, "invites", inviteCode.toUpperCase()), {
    groupId,
  });

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

export async function resolveInviteCode(code: string): Promise<string | null> {
  const ref = doc(db, "invites", code.toUpperCase());
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) return null;

  return (snapshot.data() as { groupId: string }).groupId;
}

export async function addMemberToGroup(groupId: string, uid: string): Promise<void> {
  const groupRef = doc(db, "familyGroups", groupId);

  try {
    // Add uid to members array (if not already present)
    console.log("Step 1: Adding uid to members array", { groupId, uid });
    await updateDoc(groupRef, {
      members: arrayUnion(uid),
    });
    console.log("Step 1: Success - uid added to members");
  } catch (err) {
    console.error("Step 1 failed:", err);
    throw err;
  }

  try {
    // Update user doc with familyGroupId
    console.log("Step 2: Updating user doc with familyGroupId", { uid, groupId });
    await updateDoc(doc(db, "users", uid), {
      familyGroupId: groupId,
    });
    console.log("Step 2: Success - user doc updated");
  } catch (err) {
    console.error("Step 2 failed:", err);
    throw err;
  }
}

export async function removeMemberFromGroup(groupId: string, uid: string): Promise<void> {
  const groupRef = doc(db, "familyGroups", groupId);

  try {
    // Remove uid from members array
    await updateDoc(groupRef, {
      members: arrayRemove(uid),
    });
  } catch (err) {
    console.error("Failed to remove member from group:", err);
    throw err;
  }

  try {
    // Reset user's familyGroupId to null
    await updateDoc(doc(db, "users", uid), {
      familyGroupId: null,
    });
  } catch (err) {
    console.error("Failed to reset user familyGroupId:", err);
    throw err;
  }
}
