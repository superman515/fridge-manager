# Issue #10: Family Group Member Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement family group member management — remove members, edit group name, delete groups with cascading food deletion.

**Architecture:** Fix Firestore rules to allow profile reads across family members, extend family.ts with three new functions (member removal, group update, group delete with cascade), update Family page UI with admin controls and confirmation dialogs.

**Tech Stack:** Next.js 14, React, Firebase Firestore (rules + SDK), TypeScript

## Global Constraints

- All commit messages in Korean (project standard)
- User who created the group (createdBy) is admin; only admin can remove members/edit/delete
- Group deletion must cascade: delete all foods in group + invites document
- Removed members' familyGroupId must be reset to null
- No test suite; manual verification in dev server only

---

## Task 1: Fix Firestore Rules for Profile Reads

**Files:**
- Modify: `firestore.rules:16-18`

**Interfaces:**
- Consumes: Nothing
- Produces: Updated users/{uid} read rule allowing any signed-in user to read (displayName, photoURL are public profile fields)

**Why:** Current rule `allow read: if isOwner(uid)` blocks non-owners from reading member profiles. Issue #9 noted this as "알려진 문제". Need all family group members to read each other's profiles for member list display.

- [ ] **Step 1: Update users read rule in firestore.rules**

Replace line 17:
```
      allow read, write: if isOwner(uid);
```

With:
```
      allow read: if isSignedIn();
      allow write: if isOwner(uid);
```

This allows any authenticated user to read user docs (displayName, photoURL) but only the owner can write.

- [ ] **Step 2: Deploy rules to Firebase (manual step)**

In Firebase Console → Firestore → Rules tab, paste updated rules and click "Publish". Or run:
```bash
firebase deploy --only firestore:rules
```

Expected: "Deployed firestore.rules to cloud.firestore"

---

## Task 2: Add Firebase Functions for Member Removal

**Files:**
- Modify: `src/lib/firebase/family.ts`

**Interfaces:**
- Consumes: `updateDoc`, `arrayRemove` from firebase/firestore; existing `db` and `doc` references
- Produces: `removeMemberFromGroup(groupId: string, uid: string): Promise<void>`

**What it does:** Remove uid from familyGroups/{groupId}.members array AND set users/{uid}.familyGroupId to null atomically (two separate updates; Firestore doesn't support transactions in SDK v11 easily, so two sequential updates with error handling).

- [ ] **Step 1: Add import for arrayRemove at top of family.ts**

Add to existing imports from "firebase/firestore":
```typescript
import { collection, doc, getDoc, setDoc, serverTimestamp, updateDoc, where, query, getDocs, arrayUnion, arrayRemove } from "firebase/firestore";
```

- [ ] **Step 2: Add removeMemberFromGroup function to family.ts**

Add after the `addMemberToGroup` function (end of file):

```typescript
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
```

- [ ] **Step 3: Verify function signature in IDE**

Type check:
```bash
npx tsc --noEmit
```

Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/firebase/family.ts firestore.rules
git commit -m "fix: Firestore 규칙 수정 및 멤버 제거 함수 추가"
```

---

## Task 3: Add Firebase Functions for Group Update & Delete

**Files:**
- Modify: `src/lib/firebase/family.ts`

**Interfaces:**
- Consumes: `updateDoc`, `deleteDoc`, `getDocs`, `query`, `where` from firebase/firestore
- Produces:
  - `updateFamilyGroupName(groupId: string, newName: string): Promise<void>`
  - `deleteFamilyGroup(groupId: string): Promise<void>` (calls deleteAllFoodsInGroup internally)
  - `deleteAllFoodsInGroup(groupId: string): Promise<void>`

**What it does:** Update group name (creator only, enforced in UI), delete group with cascade (delete all foods in group first, then delete group doc, then delete invites doc).

- [ ] **Step 1: Add deleteAllFoodsInGroup helper function**

Add to end of family.ts before the export block:

```typescript
async function deleteAllFoodsInGroup(groupId: string): Promise<void> {
  const foodsRef = collection(db, "foods");
  const q = query(foodsRef, where("familyGroupId", "==", groupId));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map((doc) =>
    deleteDoc(doc.ref)
  );

  await Promise.all(deletePromises);
}
```

Note: This function is internal (no export) because it's called by deleteFamilyGroup.

- [ ] **Step 2: Add updateFamilyGroupName function**

Add to end of family.ts before deleteAllFoodsInGroup:

```typescript
export async function updateFamilyGroupName(groupId: string, newName: string): Promise<void> {
  const groupRef = doc(db, "familyGroups", groupId);

  try {
    await updateDoc(groupRef, {
      name: newName,
    });
  } catch (err) {
    console.error("Failed to update group name:", err);
    throw err;
  }
}
```

- [ ] **Step 3: Add deleteFamilyGroup function**

Add to end of family.ts after deleteAllFoodsInGroup:

```typescript
export async function deleteFamilyGroup(groupId: string): Promise<void> {
  // Step 1: Delete all foods in group
  try {
    await deleteAllFoodsInGroup(groupId);
  } catch (err) {
    console.error("Failed to delete foods:", err);
    throw err;
  }

  // Step 2: Get group to find inviteCode
  let inviteCode: string | null = null;
  try {
    const groupRef = doc(db, "familyGroups", groupId);
    const snapshot = await getDoc(groupRef);
    if (snapshot.exists()) {
      inviteCode = snapshot.data().inviteCode;
    }
  } catch (err) {
    console.error("Failed to fetch group for inviteCode:", err);
  }

  // Step 3: Delete group doc
  try {
    const groupRef = doc(db, "familyGroups", groupId);
    await deleteDoc(groupRef);
  } catch (err) {
    console.error("Failed to delete group:", err);
    throw err;
  }

  // Step 4: Delete invites doc
  if (inviteCode) {
    try {
      const inviteRef = doc(db, "invites", inviteCode.toUpperCase());
      await deleteDoc(inviteRef);
    } catch (err) {
      console.error("Failed to delete invite code:", err);
      // Non-critical, don't throw
    }
  }
}
```

Need to add missing import: `deleteDoc` from "firebase/firestore".

- [ ] **Step 4: Add deleteDoc to imports**

Update firebase/firestore import to include `deleteDoc`:

```typescript
import { collection, doc, getDoc, setDoc, serverTimestamp, updateDoc, where, query, getDocs, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
```

- [ ] **Step 5: Type check**

```bash
npx tsc --noEmit
```

Expected: No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/firebase/family.ts
git commit -m "feat: 그룹명 수정 및 그룹 삭제 함수 추가"
```

---

## Task 4: Update Firestore Rules for Member & Group Deletion

**Files:**
- Modify: `firestore.rules:26-30`

**Interfaces:**
- Consumes: Nothing
- Produces: Updated familyGroups update/delete rules to allow member removal and group admin updates

**Why:** Current rules allow update if `members.size() < request.resource.data.members.size()` (adding members). Need to allow:
1. Creator can update group (change name)
2. Creator can delete group
3. Members can be removed (members.size() decreases)

- [ ] **Step 1: Update familyGroups rules in firestore.rules**

Replace lines 26-30:
```
      allow update: if isSignedIn() && (
        resource.data.createdBy == request.auth.uid ||
        (resource.data.members.size() < request.resource.data.members.size())
      );
      allow delete: if isSignedIn() && resource.data.createdBy == request.auth.uid;
```

With:
```
      allow update: if isSignedIn() && (
        resource.data.createdBy == request.auth.uid ||
        (resource.data.members.size() < request.resource.data.members.size()) ||
        (resource.data.members.size() > request.resource.data.members.size())
      );
      allow delete: if isSignedIn() && resource.data.createdBy == request.auth.uid;
```

This adds: `(resource.data.members.size() > request.resource.data.members.size())` for member removal.

- [ ] **Step 2: Deploy rules to Firebase**

```bash
firebase deploy --only firestore:rules
```

Expected: "Deployed firestore.rules to cloud.firestore"

---

## Task 5: Update Family Page UI — Member List & Admin Controls

**Files:**
- Modify: `src/app/app/family/page.tsx`

**Interfaces:**
- Consumes: `removeMemberFromGroup`, `updateFamilyGroupName`, `deleteFamilyGroup` from family.ts; existing `useUserFamily`, `useAuth`, `useUserProfile` hooks
- Produces: Updated Family page with:
  - Enhanced member list (show createdBy badge, current user "(나)" label)
  - Remove member button (admin only, with confirmation)
  - Edit group name form (admin only)
  - Delete group button (admin only, with confirmation)

**What it does:** Read the Family page component, add state for edit mode, add remove/update/delete handlers with error toast messaging, update JSX to show admin controls and confirmation dialogs.

- [ ] **Step 1: Read current Family page to understand structure**

```bash
head -100 /Users/suwonlee/Documents/fridge-manager/src/app/app/family/page.tsx
```

(Inspect the existing JSX structure, note hooks used, understand how group/members are loaded)

- [ ] **Step 2: Add admin control handlers and edit state**

After imports and before the component function body, add state variables:

```typescript
const [isEditingName, setIsEditingName] = useState(false);
const [editedName, setEditedName] = useState("");
const [isDeleting, setIsDeleting] = useState(false);

const handleUpdateGroupName = async () => {
  if (!group || editedName.trim() === "") return;
  try {
    await updateFamilyGroupName(group.id, editedName.trim());
    setIsEditingName(false);
  } catch (err) {
    console.error("Failed to update group name:", err);
    alert("그룹명 수정 실패: " + (err instanceof Error ? err.message : ""));
  }
};

const handleRemoveMember = async (uid: string) => {
  if (!group || !confirm("이 멤버를 제거하시겠습니까?")) return;
  try {
    await removeMemberFromGroup(group.id, uid);
  } catch (err) {
    console.error("Failed to remove member:", err);
    alert("멤버 제거 실패: " + (err instanceof Error ? err.message : ""));
  }
};

const handleDeleteGroup = async () => {
  if (!group || !confirm("그룹을 삭제하시겠습니까? 모든 음식 데이터도 삭제됩니다.")) return;
  try {
    setIsDeleting(true);
    await deleteFamilyGroup(group.id);
    router.push("/app/dashboard"); // Redirect after deletion
  } catch (err) {
    console.error("Failed to delete group:", err);
    alert("그룹 삭제 실패: " + (err instanceof Error ? err.message : ""));
    setIsDeleting(false);
  }
};
```

- [ ] **Step 3: Add imports at top of family/page.tsx**

Add to existing imports:
```typescript
import { removeMemberFromGroup, updateFamilyGroupName, deleteFamilyGroup } from "@/lib/firebase/family";
import { useState } from "react";
```

- [ ] **Step 4: Update member list JSX to include remove button**

Find the member card rendering section. Update each member card to include:

```typescript
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
}}>
  <div>
    {/* existing member display code */}
  </div>
  {isAdmin && uid !== currentUser.uid && (
    <button
      onClick={() => handleRemoveMember(uid)}
      style={{
        padding: "4px 8px",
        fontSize: "12px",
        backgroundColor: "#DC2626",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      제거
    </button>
  )}
</div>
```

Where `isAdmin = currentUser.uid === group.createdBy`.

- [ ] **Step 5: Add group name edit section after invite code display**

Add after the existing invite code section:

```typescript
{isAdmin && (
  <div style={{
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#F3F4F6",
    borderRadius: "8px",
  }}>
    {isEditingName ? (
      <div>
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          placeholder="그룹명"
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "8px",
            border: "1px solid #D1D5DB",
            borderRadius: "4px",
          }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleUpdateGroupName}
            style={{
              flex: 1,
              padding: "8px",
              backgroundColor: "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            저장
          </button>
          <button
            onClick={() => setIsEditingName(false)}
            style={{
              flex: 1,
              padding: "8px",
              backgroundColor: "#D1D5DB",
              color: "#111827",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            취소
          </button>
        </div>
      </div>
    ) : (
      <button
        onClick={() => {
          setEditedName(group.name);
          setIsEditingName(true);
        }}
        style={{
          width: "100%",
          padding: "8px",
          backgroundColor: "#6B7280",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "8px",
        }}
      >
        그룹명 수정
      </button>
    )}
  </div>
)}
```

- [ ] **Step 6: Add delete group button**

Add below the name edit section:

```typescript
{isAdmin && (
  <button
    onClick={handleDeleteGroup}
    disabled={isDeleting}
    style={{
      width: "100%",
      padding: "8px",
      marginTop: "12px",
      backgroundColor: "#DC2626",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: isDeleting ? "not-allowed" : "pointer",
      opacity: isDeleting ? 0.6 : 1,
    }}
  >
    {isDeleting ? "삭제 중..." : "그룹 삭제"}
  </button>
)}
```

- [ ] **Step 7: Type check**

```bash
npx tsc --noEmit
```

Expected: No TypeScript errors.

- [ ] **Step 8: Test in dev server**

Start dev server if not already running:
```bash
npm run dev
```

Navigate to `/app/family`, verify:
1. Group created, members listed
2. Admin sees "그룹명 수정" and "그룹 삭제" buttons
3. Non-admin does not see these buttons
4. Click "그룹명 수정" → input appears → change name → save → UI updates
5. Click remove button next to a member → confirm → member removed from list
6. Click "그룹 삭제" → confirm → redirected to dashboard

- [ ] **Step 9: Commit**

```bash
git add src/app/app/family/page.tsx firestore.rules
git commit -m "feat: Issue #10 가족 그룹 멤버 관리 기능 완성"
```

---

## Task 6: Integration Test & Verify All Acceptance Criteria

**Files:**
- None (manual verification only)

**Interfaces:**
- Consumes: All updated functions and UI from Tasks 1-5
- Produces: Manual test checklist completion

- [ ] **Step 1: Clear cache and rebuild**

```bash
npm run build
```

Expected: No build errors, all routes compile.

- [ ] **Step 2: Start fresh dev session**

```bash
npm run dev
```

Expected: Dev server starts on localhost:3000.

- [ ] **Step 3: Test member list display**

1. Create a new family group via /app/family
2. Open another browser/incognito with different Firebase account
3. Join the group using the invite code
4. Return to first browser → /app/family
5. Verify second user displays in member list with displayName and avatar

**Expected:** Both users visible in member list.

- [ ] **Step 4: Test member removal**

1. As group creator, click remove button next to non-creator member
2. Confirm deletion
3. Verify member disappears from list
4. Switch to the removed member's browser → they should see "no group" state

**Expected:** Member removed successfully.

- [ ] **Step 5: Test group name edit**

1. As creator, click "그룹명 수정"
2. Change name to "테스트 그룹 수정됨"
3. Click 저장
4. Verify name updates in UI immediately

**Expected:** Group name changes live.

- [ ] **Step 6: Test group deletion**

1. As creator, click "그룹 삭제"
2. Confirm deletion
3. Verify redirect to dashboard
4. Check Firestore Console → familyGroups and foods collections should be empty for that group

**Expected:** Group and all associated foods deleted.

- [ ] **Step 7: Verify all Acceptance Criteria met**

From Issue #10:
- ✅ 멤버 목록이 올바르게 표시됨 → Task 5 Step 3
- ✅ 대표자만 멤버 제거 버튼이 활성화됨 → Task 5 Step 4 (isAdmin check)
- ✅ 멤버 제거 시 확인 대화상자 표시 → Task 5 Step 4 (confirm())
- ✅ 제거 후 members 배열에서 uid 제거됨 → Task 2 (arrayRemove)
- ✅ 제거된 사용자의 familyGroupId 초기화됨 → Task 2 (set to null)
- ✅ 그룹명 수정 가능 → Task 5 Step 5
- ✅ 그룹 삭제 시 음식 데이터 처리 로직 구현 → Task 3 (deleteAllFoodsInGroup cascade)

---

## Summary

**Total Tasks:** 6
- **Task 1:** Firestore rules — users read permission
- **Task 2:** Remove member function
- **Task 3:** Update/delete group functions
- **Task 4:** Firestore rules — update/delete permissions
- **Task 5:** Family page UI with admin controls
- **Task 6:** Integration test

**Files Changed:**
- `firestore.rules` (2 edits: users read, familyGroups update)
- `src/lib/firebase/family.ts` (4 new functions + imports)
- `src/app/app/family/page.tsx` (state, handlers, JSX updates)

**No new files created.**

All tasks commit frequently; manual verification only (no test suite).
