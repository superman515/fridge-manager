# Issue #9: Family Group Invitation & Membership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users without a family group to join an existing group by entering an invite code, with full error handling and real-time UI update.

**Architecture:** 
- Add two Firebase functions: find group by invite code, add member to group with user profile sync
- Extend Family page with tab UI (생성/참여) and invite code input form
- Client-side format validation, server-side existence/duplicate check
- On success, page rerenders with group data via useUserFamily hook

**Tech Stack:** Next.js (client component), Firebase Firestore (query + update), React hooks

## Global Constraints

- Commit messages: Korean language, format `feat:`, `fix:` prefixes
- UI style: Follow existing `.family-container`, `.group-card`, `.form-input`, `.btn-primary` CSS classes
- Error messages: Korean, max 1 line, red color `#DC2626`
- All code changes in `src/` directory only
- Manual testing only (no test suite)

---

## File Structure

### Modified Files
- `src/lib/firebase/family.ts` — Add `findFamilyGroupByInviteCode()`, `addMemberToGroup()`
- `src/app/app/family/page.tsx` — Add tab UI, invite form logic, state management
- `src/app/globals.css` — Add `.tab-group`, `.tab-button.active` styles (if needed)

---

## Task 1: Add Firebase Functions for Group Lookup & Member Addition

**Files:**
- Modify: `src/lib/firebase/family.ts` (end of file)

**Interfaces:**
- Produces: 
  - `findFamilyGroupByInviteCode(code: string): Promise<FamilyGroup | null>`
  - `addMemberToGroup(groupId: string, uid: string): Promise<void>`

- [ ] **Step 1: Read current family.ts to understand existing patterns**

Already done above.

- [ ] **Step 2: Add findFamilyGroupByInviteCode function**

Add to end of `src/lib/firebase/family.ts`:

```typescript
export async function findFamilyGroupByInviteCode(code: string): Promise<FamilyGroup | null> {
  const ref = collection(db, "familyGroups");
  const q = query(ref, where("inviteCode", "==", code.toUpperCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as FamilyGroup;
}
```

Add imports at top: `where, query, getDocs` from `"firebase/firestore"`

- [ ] **Step 3: Add addMemberToGroup function**

Add to end of `src/lib/firebase/family.ts`:

```typescript
export async function addMemberToGroup(groupId: string, uid: string): Promise<void> {
  const groupRef = doc(db, "familyGroups", groupId);
  
  // Add uid to members array (if not already present)
  await updateDoc(groupRef, {
    members: arrayUnion(uid),
  });
  
  // Update user doc with familyGroupId
  await updateDoc(doc(db, "users", uid), {
    familyGroupId: groupId,
  });
}
```

Add import: `arrayUnion` from `"firebase/firestore"`

- [ ] **Step 4: Verify imports are complete**

Full import line should be:
```typescript
import { collection, doc, getDoc, setDoc, serverTimestamp, updateDoc, where, query, getDocs, arrayUnion } from "firebase/firestore";
```

- [ ] **Step 5: Run build to check for TypeScript errors**

```bash
npm run build
```

Expected: No TypeScript errors, build completes.

- [ ] **Step 6: Commit**

```bash
git add src/lib/firebase/family.ts
git commit -m "feat: 초대 코드로 그룹 조회 및 멤버 추가 함수"
```

---

## Task 2: Add Tab UI & Invite Form State to Family Page

**Files:**
- Modify: `src/app/app/family/page.tsx` (top, state section)

**Interfaces:**
- Consumes: 
  - `findFamilyGroupByInviteCode(code: string)`
  - `addMemberToGroup(groupId: string, uid: string)`
- Produces: Two-tab UI state management

- [ ] **Step 1: Import new functions**

Add to imports at top of Family page component:

```typescript
import { getFamilyGroup, createFamilyGroup, findFamilyGroupByInviteCode, addMemberToGroup } from "@/lib/firebase/family";
```

- [ ] **Step 2: Add state for tab & invite form**

After existing state declarations (after `error` and `memberProfiles` state), add:

```typescript
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
```

- [ ] **Step 3: Run dev server to check no runtime errors**

```bash
npm run dev
```

Navigate to `/app/family` in browser. Should render (group creation form still visible, no errors in console).

- [ ] **Step 4: Commit**

```bash
git add src/app/app/family/page.tsx
git commit -m "feat: 참여 탭 상태 추가"
```

---

## Task 3: Implement Invite Code Validation & Join Logic

**Files:**
- Modify: `src/app/app/family/page.tsx` (after state, before JSX return)

**Interfaces:**
- Consumes: `findFamilyGroupByInviteCode()`, `addMemberToGroup()`
- Produces: `handleJoinGroup()` function

- [ ] **Step 1: Add handleJoinGroup function**

After `handleCreateGroup` function, add:

```typescript
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !inviteCode.trim()) return;

    setJoining(true);
    setJoinError(null);

    try {
      const code = inviteCode.trim().toUpperCase();
      
      // Validate format (XXX-XXXX)
      if (!/^[A-Z0-9]{3}-[A-Z0-9]{4}$/.test(code)) {
        setJoinError("코드 형식이 올바르지 않습니다");
        setJoining(false);
        return;
      }

      // Find group by invite code
      const foundGroup = await findFamilyGroupByInviteCode(code);
      if (!foundGroup) {
        setJoinError("코드를 확인하세요");
        setJoining(false);
        return;
      }

      // Check if already member
      if (foundGroup.members.includes(firebaseUser.uid)) {
        setJoinError("이미 가입된 그룹입니다");
        setJoining(false);
        return;
      }

      // Add user to group
      await addMemberToGroup(foundGroup.id, firebaseUser.uid);
      setInviteCode("");
      
      // Page will auto-refresh via useUserFamily hook
    } catch (err) {
      setJoinError("네트워크 오류. 다시 시도하세요");
    } finally {
      setJoining(false);
    }
  };
```

- [ ] **Step 2: Run dev server to verify function syntax**

```bash
npm run dev
```

Check console for TypeScript errors. Should be none.

- [ ] **Step 3: Commit**

```bash
git add src/app/app/family/page.tsx
git commit -m "feat: 그룹 참여 로직 구현"
```

---

## Task 4: Add Tab UI & Invite Form Markup

**Files:**
- Modify: `src/app/app/family/page.tsx` (JSX section, replace group creation form)

**Interfaces:**
- Consumes: `activeTab`, `inviteCode`, `joining`, `joinError`, `handleJoinGroup()`
- Produces: Tab UI with dynamic form display

- [ ] **Step 1: Replace group creation/join section**

Find the JSX section starting with `{!group ? (`:

Replace the entire `<div className="family-container">` block (lines 79-103) with:

```typescript
        {!group ? (
          <div className="family-container">
            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #E2E8F0" }}>
              <button
                onClick={() => {
                  setActiveTab("create");
                  setJoinError(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderBottom: activeTab === "create" ? "2px solid #2563EB" : "none",
                  color: activeTab === "create" ? "#2563EB" : "#64748B",
                  fontWeight: activeTab === "create" ? "600" : "400",
                  fontSize: "14px",
                }}
              >
                생성
              </button>
              <button
                onClick={() => {
                  setActiveTab("join");
                  setJoinError(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderBottom: activeTab === "join" ? "2px solid #2563EB" : "none",
                  color: activeTab === "join" ? "#2563EB" : "#64748B",
                  fontWeight: activeTab === "join" ? "600" : "400",
                  fontSize: "14px",
                }}
              >
                참여
              </button>
            </div>

            {/* Create Tab */}
            {activeTab === "create" && (
              <div className="group-card">
                <div className="group-label">새 그룹 생성</div>
                <form onSubmit={handleCreateGroup} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="그룹명 입력 (예: 우리 가족)"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    className="form-input"
                    disabled={creating}
                  />
                  {error && <div style={{ fontSize: "12px", color: "#DC2626" }}>{error}</div>}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!groupName.trim() || creating}
                    style={{ width: "100%" }}
                  >
                    {creating ? "생성 중..." : "그룹 생성"}
                  </button>
                </form>
              </div>
            )}

            {/* Join Tab */}
            {activeTab === "join" && (
              <div className="group-card">
                <div className="group-label">초대 코드 입력</div>
                <form onSubmit={handleJoinGroup} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="초대 코드 (예: ABC-1234)"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    className="form-input"
                    disabled={joining}
                    maxLength={8}
                  />
                  {joinError && <div style={{ fontSize: "12px", color: "#DC2626" }}>{joinError}</div>}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!inviteCode.trim() || joining}
                    style={{ width: "100%" }}
                  >
                    {joining ? "참여 중..." : "그룹 참여"}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
```

- [ ] **Step 2: Run dev server & test tab switching**

```bash
npm run dev
```

In browser:
- Navigate to `/app/family`
- Should see "생성" / "참여" tabs
- Click each tab — forms should toggle
- Verify input placeholder text is correct

- [ ] **Step 3: Commit**

```bash
git add src/app/app/family/page.tsx
git commit -m "feat: 탭 UI 및 초대 코드 입력 폼 추가"
```

---

## Task 5: Test Invite Code Join Flow (Manual)

**Files:**
- No files modified (testing only)

**Interfaces:**
- Tests: `findFamilyGroupByInviteCode()`, `addMemberToGroup()`, `handleJoinGroup()` logic

- [ ] **Step 1: Create a test group**

In browser at `/app/family`:
- Ensure you're logged in as User A
- Go to "생성" tab
- Enter group name "Test Family"
- Click "그룹 생성"
- Verify group card appears with invite code (e.g., ABC-1234)
- Copy the invite code

- [ ] **Step 2: Test valid invite code (same browser, different user)**

- Logout (go to `/app/profile`, click logout)
- Create new account as User B
- Navigate to `/app/family`
- Go to "참여" tab
- Paste invite code from Step 1
- Click "그룹 참여"
- **Expected:** Group card appears showing group name, members (both User A & B)

- [ ] **Step 3: Test duplicate membership error**

- Stay logged in as User B
- Go to "참여" tab
- Enter same invite code again
- Click "그룹 참여"
- **Expected:** Error message "이미 가입된 그룹입니다"

- [ ] **Step 4: Test invalid code error**

- Logout and create/login as User C
- Navigate to `/app/family`
- Go to "참여" tab
- Enter non-existent code (e.g., ZZZ-9999)
- Click "그룹 참여"
- **Expected:** Error message "코드를 확인하세요"

- [ ] **Step 5: Test format validation**

- In "참여" tab
- Enter malformed code (e.g., "invalid")
- Click "그룹 참여"
- **Expected:** Error message "코드 형식이 올바르지 않습니다"

---

## Task 6: Verify Integration & Polish

**Files:**
- Modify: None (verification only, may need minor fixes)

**Interfaces:**
- Tests: Full join flow, error states, UI consistency

- [ ] **Step 1: Build and check for TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds, all routes compile.

- [ ] **Step 2: Test page reload after join**

- Login as User A, create group
- Copy invite code
- Login as User B in incognito window
- Join group via code
- Refresh page (`Cmd+R` / `Ctrl+R`)
- **Expected:** Group info persists (useUserFamily hook reloaded from Firestore)

- [ ] **Step 3: Verify tab styling & UX**

- Check active tab has blue underline
- Check form hides when tab switches
- Check error messages display in red
- Verify loading states ("생성 중...", "참여 중...")

- [ ] **Step 4: Commit if any fixes needed**

```bash
git add .
git commit -m "fix: 초대 코드 참여 기능 마무리"
```

(Only if changes made)

---

## Task 7: Update Issue Diary & Summary

**Files:**
- Modify: `issue-diary.md`

**Interfaces:**
- Documents: Completion status, key decisions, next steps

- [ ] **Step 1: Add Issue #9 completion section**

Add to `issue-diary.md` after Issue #8 section:

```markdown
## Issue #9 — Family Group Invitation & Membership
**날짜:** 2026-01-17

### 구현 내용
초대 코드로 기존 가족 그룹에 참여하는 기능 완성.

- Firebase 함수 (`src/lib/firebase/family.ts`)
  - `findFamilyGroupByInviteCode(code)`: 초대 코드로 그룹 조회 (대소문자 무시)
  - `addMemberToGroup(groupId, uid)`: 멤버 배열에 사용자 추가, familyGroupId 동기화

- Family 페이지 재설계 (`src/app/app/family/page.tsx`)
  - 그룹 없을 때: "생성 / 참여" 탭 UI
  - 참여 탭: 초대 코드 입력 폼 (XXX-XXXX 포맷)
  - 클라이언트 포맷 검증 + Firestore 존재 여부 검증
  - 성공 시 현재 페이지에서 그룹 렌더링 (useUserFamily 자동 갱신)

- 에러 처리 (모두 한글 메시지)
  - "코드 형식이 올바르지 않습니다" (클라이언트 포맷 검증)
  - "코드를 확인하세요" (존재하지 않는 코드)
  - "이미 가입된 그룹입니다" (중복 멤버)
  - "네트워크 오류. 다시 시도하세요" (기타 에러)

### Acceptance Criteria 달성
- ✅ 초대 코드 입력 폼이 유효성 검사 수행 (포맷)
- ✅ 유효한 코드 입력 시 그룹 조회 성공
- ✅ 멤버 배열에 현재 사용자 uid 추가됨
- ✅ 사용자의 familyGroupId 업데이트됨
- ✅ 그룹 참여 후 해당 그룹의 음식 목록 조회됨 (자동)
- ✅ 잘못된 코드 입력 시 에러 메시지 표시

### 검증 완료
- `npm run build` — 타입 에러 없음
- `npm run dev` — localhost:3000 정상 실행
- 수동 테스트: 그룹 생성 → 초대 코드 복사 → 다른 사용자로 참여 → 성공
- 에러 테스트: 중복 참여, 잘못된 코드, 포맷 오류 모두 처리됨

### 변경 파일
- `src/lib/firebase/family.ts` (findFamilyGroupByInviteCode, addMemberToGroup 함수)
- `src/app/app/family/page.tsx` (탭 UI, 참여 폼, 로직)

### 다음 단계
- (Issue #9 완료)
- 향후 기능: 그룹 관리 (멤버 삭제, 그룹명 변경 등)
```

- [ ] **Step 2: Commit**

```bash
git add issue-diary.md
git commit -m "docs: Issue #9 완료 기록"
```

---

## Plan Summary

**Total Tasks:** 7
- Task 1: Firebase functions (2 commits)
- Task 2-3: State & logic (2 commits)
- Task 4: UI markup (1 commit)
- Task 5: Manual testing (no commit)
- Task 6: Integration & polish (conditional commit)
- Task 7: Documentation (1 commit)

**Estimated effort:** ~45 minutes

**Testing:** Manual only (existing project scope)

**Next:** After completion, dashboard will auto-sync with family group membership via `useFoodList` hook
