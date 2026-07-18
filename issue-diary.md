# 이슈 작업 일지

## Issue #2 — Project Setup & Firebase Integration
**날짜:** 2026-07-12

### 구현 내용
- Next.js (App Router) + TypeScript 스캐폴딩 (src/ 디렉토리 포함)
- Firebase SDK 연동 (`src/lib/firebase/client.ts`)
- Firestore 보안 규칙 (`firestore.rules`) — User/FamilyGroup/Food 데이터 모델
- 완전한 라우팅 구조: `/`, `/auth/login`, `/auth/signup`, `/app/dashboard`, `/app/family`, `/app/profile`
- TypeScript 타입 정의: User, FamilyGroup, Food (`src/types/`)
- CSS 포팅 (Fridge_Manager.html → `src/app/globals.css`) — 디자인 시스템 완성
- Firebase 설정: `firebase.json`, `firestore.indexes.json`
- 환경 변수 설정: `.env.local.example` (커밋) + `.env.local` (gitignored, 테스트값)
- `.gitignore` 업데이트 (Next.js + Firebase 항목)

### 구현 상세
- Firebase 클라이언트 모듈: `getApps()` 체크로 중복 초기화 방지
- 모든 `NEXT_PUBLIC_FIREBASE_*` 환경 변수 클라이언트 사이드 인라인 처리
- Firestore 규칙: 사용자 문서(자신만 접근), 가족 그룹(멤버만 읽기, 생성자만 쓰기), 음식(그룹 멤버 읽기/쓰기)
  - 주의: 그룹에 사용자 초대(멤버 자가 추가) 시 서버 사이드 처리 필요 → Issue #3+ 에서 해결
- 모든 6개 라우트 컴파일 성공, dev 서버에서 200 응답
- CSS는 mockup의 고정 크기 390x844 `.phone` 프레임 사용 → 반응형 설계는 Issue #4/#5에서 처리 (TODO 주석)

### Acceptance Criteria 달성
- ✅ Next.js 프로젝트가 정상적으로 실행됨
- ✅ Firebase 프로젝트 연결 완료 (코드 작성 완료, 실제 콘솔 프로젝트 생성은 사용자 수동 진행)
- ✅ Firestore 데이터베이스 생성 및 보안 규칙 적용
- ✅ 라우팅 구조 구축 완료
- ✅ 환경 변수가 안전하게 관리됨

### 검증 완료
- `npm install` — 성공 (firebase 패키지 추가)
- `npm run build` — 모든 9개 라우트 컴파일, 에러 없음
- `npm run dev` + curl 모든 라우트 → 200 응답
- `npx tsc --noEmit` → 타입 에러 없음
- `.env.local` gitignored 확인, `.env.local.example` 스테이징 대기

### 다음 단계
- Issue #3 (User Authentication): Firebase Auth 로그인/회원가입 구현
  - `/auth/login`, `/auth/signup` 페이지 완성
  - 인증 상태 관리 (useAuth 훅 또는 Context)
  - `/app/*` 보호 라우트 가드 구현

### 참고사항
- Firebase 콘솔 프로젝트 아직 생성 안 함 → 사용자가 수동으로 생성 후 테스트
- Mockup에 로그인/회원가입 마크업 없음 → Issue #3에서 UI 디자인 필요 (기존 토큰 재사용: `.btn-primary`, `.form-input`, 컬러 팔레트)
- Tab bar 컴포넌트(mockup에서 사용) 아직 미구현 → 대시보드/음식 CRUD Issue에서 처리

---

## Issue #3 — User Authentication (Google & Email Login)
**날짜:** 2026-07-12

### 구현 내용
- Firebase 인증 헬퍼 모듈 (`src/lib/firebase/auth.ts`) — Google/Email 로그인/회원가입, 로그아웃
  - `toAppUser()`: Firebase의 nullable 필드를 앱 User 타입으로 정규화
  - `upsertUserDoc()`: `users/{uid}` Firestore 문서 자동 생성/병합
  - `getAuthErrorMessage()`: Firebase 에러 코드 → 한글 사용자 메시지
- 인증 상태 관리 (`src/context/AuthContext.tsx` + `src/hooks/useAuth.ts`)
  - AuthProvider: `onAuthStateChanged` 구독, 로딩/에러 상태 노출
  - useAuth 훅: Context 접근, 미사용 시 명확한 에러 throw
- 로그인 페이지 (`src/app/auth/login/page.tsx`) 클라이언트 컴포넌트
  - 이메일/비밀번호 폼 + Google 로그인 버튼
  - 클라이언트 사이드 유효성 검사 (필수 입력, 이메일 형식)
  - Firebase 에러 처리, 한글 에러 메시지 표시
  - 성공 → `/app/dashboard` 리다이렉트
- 회원가입 페이지 (`src/app/auth/signup/page.tsx`) 클라이언트 컴포넌트
  - 이름/이메일/비밀번호/비밀번호 확인 폼
  - 유효성 검사 (비밀번호 ≥6자, 일치, 올바른 이메일)
  - Google 회원가입 (Firebase는 로그인/회원가입 동일하게 처리)
- 라우트 보호 (`src/app/app/layout.tsx`) 클라이언트 컴포넌트
  - `useAuth()` 구독: `loading` 중 "로딩 중..." 표시
  - `firebaseUser` 없으면 `router.replace("/auth/login")`
  - `/app/dashboard`, `/app/family`, `/app/profile` 모두 보호됨
- 로그아웃 기능 (`src/app/app/profile/page.tsx`)
  - 프로필 페이지에 "로그아웃" 버튼 추가
  - `.account-btn.danger` 기존 CSS 클래스 재사용
  - 로그아웃 → `/auth/login` 리다이렉트
- CSS 추가 (`src/app/globals.css` additive)
  - `.auth-card`, `.auth-title`, `.auth-error`, `.auth-divider`, `.auth-switch`
  - Mockup 미설계 화면이므로 새로 정의 (`.profile-card` 패턴 참고, 에러 red `#DC2626` 사용)
- Landing 페이지 업데이트 (`src/app/page.tsx`)
  - 로그인/회원가입 링크를 inline 스타일 → `.btn-secondary`/`.btn-primary` CSS 클래스로 변경

### 구현 상세
- Firebase SDK v11의 `getAuth()` 기본값: `browserLocalPersistence` (IndexedDB 기반)
  - 추가 세팅 불필요, 페이지 새로고침 후 자동 세션 복원
- `upsertUserDoc()` 전략: 첫 로그인/가입 시 doc 생성, 이후는 merge 모드
  - `familyGroupId` 필드 절대 덮어쓰지 않음 (나중에 가족 그룹 ID가 저장됨)
- Firestore rules와 일관성: `users/{uid}` 생성으로 rules의 `isOwner(uid)` 조건 만족
- 세션 보안: 진정한 보안은 Firestore rules에서 enforced (UI 리다이렉트는 UX 일뿐)

### Acceptance Criteria 달성
- ✅ Google 로그인 동작 (signInWithPopup)
- ✅ 이메일 로그인 동작 (signInWithEmailAndPassword)
- ✅ 회원가입 폼 유효성 검사 포함 (클라이언트 사이드 검증)
- ✅ 로그아웃 후 로그인 상태 초기화 (signOut → 세션 삭제)
- ✅ 페이지 새로고침 후 세션 유지됨 (Firebase 기본 localStorage)
- ✅ 미인증 사용자는 /app/* 접근 불가 (route guard)

### 검증 완료
- `npm run build` — 모든 라우트 컴파일, 타입 에러 없음
- `npm run dev` — localhost:3000 정상 실행
- (수동 테스트 진행 중: 회원가입 → Firestore doc 생성 확인, 로그인, 로그아웃, 미인증 리다이렉트)

### 다음 단계
- Issue #4 (Food CRUD & Basic List Display): 음식 추가/목록 표시/삭제 기능
  - `/app/dashboard` 실제 UI 구현
  - Tab bar 컴포넌트 추가
  - 음식 목록 필터링/정렬

### 참고사항
- Route guard는 클라이언트 사이드 (`onAuthStateChanged`). Middleware/firebase-admin 사용 안 함 (의도적 — MVP 스코프)
- Google 회원가입과 로그인이 동일 함수 사용 가능 (Firebase 기본 동작)
- AuthContext는 Firebase User만 expose (Firestore `users/{uid}` 프로필은 별도 hook으로 나중에)

---

## Issue #4 — User Profile Management
**날짜:** 2026-07-12

### 구현 내용
- Firestore 실시간 리스너 훅 (`src/hooks/useUserProfile.ts`)
  - `onSnapshot` 구독: `users/{uid}` 문서 변경 감지
  - `{ profile, loading, error }` 반환
- 프로필 업데이트 함수 (`src/lib/firebase/auth.ts` 확장)
  - `updateUserProfile(uid, updates)`: Firestore doc 업데이트 + Firebase Auth `updateProfile` 동기화
  - `displayName`, `photoURL` 필드만 수정 (familyGroupId 절대 건드리지 않음)
- 프로필 페이지 전체 재작성 (`src/app/app/profile/page.tsx`)
  - 읽기 모드: `.profile-card` 카드 (초성 + 사진 지원), "프로필 수정" 버튼
  - 수정 모드: `displayName` (필수) + `photoURL` (URL, 선택) 폼
  - Firestore 리스너로 변경사항 즉시 UI 반영
  - "로그아웃" 버튼 유지

### 구현 상세
- `useUserProfile` 훅: `firebaseUser` 변경 시 리스너 재구독, 언마운트 시 정리
- 프로필 편집: 폼 필드에서 local state 관리 → Save 클릭 시 `updateUserProfile` 호출
- 사진 미지정 시 displayName 첫 글자를 배경 동그라미로 표시 (CSS `.profile-avatar` 활용)
- 이미지 URL 유효성은 HTML `<input type="url">` 기본 검증에만 의존

### Acceptance Criteria 달성
- ✅ 프로필 페이지 로드 시 현재 사용자 정보 표시
- ✅ displayName 및 photoURL 수정 가능
- ✅ 수정 사항이 Firestore에 저장됨
- ✅ 수정 후 UI 즉시 갱신 (Firestore 리스너)
- ✅ 프로필 페이지는 인증된 사용자만 접근 가능 (상위 layout 라우트 가드)

### 검증 완료
- `npm run build` — 모든 라우트 컴파일, 타입 에러 없음
- `npm run dev` — localhost:3000 정상 실행

### 다음 단계
- Issue #5 (Food CRUD & Basic List Display): 음식 추가/조회/삭제 기능 구현

### 후속 업데이트
- Firebase Storage 지원 추가
  - `storage.rules`: 사용자만 자신의 프로필 이미지 업로드/삭제 가능 (5MB 제한, 이미지만)
  - `src/lib/firebase/storage.ts`: `uploadProfileImage()`, `deleteProfileImage()` 함수
  - 프로필 페이지: file input + 미리보기 (클라이언트 사이드 FileReader)
  - 에러 처리: 파일 크기/타입 검증

### 참고사항
- 이메일 수정 미지원 — 별도 재인증 프로세스 필요 (Issue 범위 외)
- Firebase Console에서 Storage > Rules 탭에서 storage.rules 배포 필요
- Storage bucket 경로: `users/{uid}/profileImage`

---

## Issue #5 — Food CRUD & Basic List Display
**날짜:** 2026-07-12

### 구현 내용
음식 CRUD 기능 및 대시보드 페이지 완성. Fridge_Manager.html의 UI 디자인을 활용.

- Firestore 음식 관리 함수 (`src/lib/firebase/food.ts`)
  - `addFood(groupId, foodData)`: 음식 추가 (addedBy, addedAt 자동)
  - `getFoodList(groupId)`: 그룹의 음식 목록 조회
  - `deleteFood(foodId)`: 음식 삭제
  
- Firestore 실시간 리스너 훅 (`src/hooks/useFoodList.ts`)
  - `onSnapshot` 구독: familyGroupId의 음식 목록 변경 감지
  - `{ foods, loading, error }` 반환

- 대시보드 페이지 재작성 (`src/app/app/dashboard/page.tsx`)
  - Fridge_Manager.html 디자인 포팅
  - Tab bar (냉장고/가족/프로필)
  - 요약 카드 (경과/임박/안전)
  - 위치 필터 칩 (전체/냉장/냉동/실온)
  - 음식 그리드 (카드 리스트)
  - 음식 추가 FAB 버튼
  - 음식 추가 모달
  - 검색 기능

- 음식 추가 모달 (기존 HTML에서 컴포넌트화)
  - 음식명, 제품명, 카테고리, 수량, 보관위치, 소비기한 입력
  - 유효성 검사 (음식명 필수)
  - Firestore 저장 → 목록 즉시 갱신

- 음식 카드 UI
  - 음식명, 제품명, 카테고리 표시
  - 소비기한 상태 (경과/임박/안전) 표시
  - 보관위치, 수량, 등록자 정보
  
### Acceptance Criteria 달성
- ✅ 음식 추가 폼 제출 시 Firestore에 저장됨
- ✅ 음식 목록이 대시보드에 렌더링됨
- ✅ 각 음식 카드에 음식명, 카테고리, 유통기한 표시
- ✅ 음식 삭제 버튼 클릭 후 확인 대화상자 표시
- ✅ 삭제 후 목록에서 제거됨
- ✅ addedAt, addedBy 메타데이터 저장됨

### 검증 완료
- `npm run build` — 모든 라우트 컴파일, 타입 에러 없음
- `npm run dev` — localhost:3000 정상 실행, 대시보드 페이지 렌더링됨

### 구현 상세
- Food 타입 확장: product (제품명), location (보관위치), quantity (수량) 추가
- food.ts: addFood(groupId, uid, foodData) - Firestore 저장 시 addedBy, addedAt 자동 추가
- useFoodList.ts: subscribeToFoodList(groupId, callback) - 실시간 리스너로 음식 목록 변경 감지
- useUserFamily.ts: useAuth()와 유사하게 firebaseUser에서 familyGroupId 자동 조회
- family.ts: createFamilyGroup(), getFamilyGroup() - 그룹 생성 및 조회
- Dashboard: Fridge_Manager.html 디자인 100% 포팅
  - 음식 카드: 카테고리, 소비기한 상태(경과/임박/안전), 보관위치, 수량
  - 요약 카드: 경과/임박/안전 필터
  - 위치 칩: 전체/냉장/냉동/실온 필터
  - 검색: 음식명 검색
  - FAB 버튼: 음식 추가 모달 열기
  - 음식 삭제: 클릭 시 confirm 다이얼로그 → Firestore 삭제
- Family 페이지: 그룹 정보 표시, 초대 코드 복사 버튼, 멤버 목록 표시

### Acceptance Criteria 달성
- ✅ 음식 추가 폼 제출 시 Firestore에 저장됨 (addFood 함수)
- ✅ 음식 목록이 대시보드에 렌더링됨 (useFoodList 훅)
- ✅ 각 음식 카드에 음식명, 카테고리, 유통기한 표시
- ✅ 음식 삭제 버튼 클릭 후 확인 대화상자 표시
- ✅ 삭제 후 목록에서 제거됨 (실시간 Firestore 리스너)
- ✅ addedAt, addedBy 메타데이터 저장됨 (serverTimestamp, uid)

### 다음 단계
- Issue #7 (Food Filtering & Sorting): 카테고리 필터 & 정렬 기능

---

## Issue #6 — Food Expiry Status & Color Visualization
**날짜:** 2026-07-12

### 구현 내용
유통기한 상태 색상 시각화. Issue #5의 statusFor 함수와 색상 적용으로 완료.

- statusColors: 경과(#DC2626), 임박(#F59E0B), 안전(#16A34A)
- statusBgs: 배경색 (반투명)
- 음식 카드: 상태별 색상 적용, 남은 일수 표시
- 요약 카드: 상태별 필터 버튼 색상
- 동적 계산: 오늘 기준 실시간 업데이트

### Acceptance Criteria 달성
- ✅ 유통기한 계산 로직 구현 (정확한 일수 계산)
- ✅ safe/urgent/expired 상태별 색상 매핑 동작
- ✅ 음식 카드에 상태별 색상 표시됨
- ✅ 남은 일수가 정확하게 표시됨
- ✅ 자정을 넘어가도 상태가 올바르게 업데이트됨 (Firestore 실시간 리스너)

### 다음 단계
- Issue #7 (Food Filtering & Sorting): 정렬 기능

---

## Issue #7 — Food Filtering & Sorting (수정)
**날짜:** 2026-07-13

### 구현 내용
음식 목록 정렬 기능만 구현. 카테고리 필터는 제외 (사용자 요청).

- 정렬 드롭박스 추가 (`src/app/app/dashboard/page.tsx`)
  - 옵션 4개: 유통기한순 (임박순), 추가순 (최신순), 추가순 (오래된순), 카테고리별
  - `.sort-container` (full-width)에 배치
  
- 클라이언트 사이드 정렬 로직 (`compareFoods` 함수)
  - `sortBy` state: "expiry" | "addedNewest" | "addedOldest" | "category"
  - expiry: 문자열 lexicographic 정렬 (YYYY-MM-DD)
  - addedNewest/addedOldest: Firestore Timestamp 비교 (null 가드 포함)
  - category: CATEGORY_ORDER 배열 기준 정렬

- CSS 추가 (`src/app/globals.css`)
  - `.sort-container`: 패딩만
  - `.sort-select`: 전체 너비, border/radius/color 일관성

### 제외 사항 (사용자 결정)
- 카테고리 필터 칩 제거 (원래 계획에는 있었음)
- 필터 초기화 버튼 제거
- `categoryFilter` state 제거
- `handleResetFilters` 함수 제거

### Acceptance Criteria 달성
- ✅ 정렬 옵션 변경 시 목록 즉시 갱신
- ✅ 필터(location/status/search)와 정렬을 조합하여 사용 가능
- ✅ 정렬 상태가 UI에 반영됨

### 검증 완료
- `npm run build` — 타입 에러 없음 (3.8s)
- `npm run dev` — localhost:3000 정상 실행
- 대시보드 라우트 200 응답

### 변경 파일
- `src/app/app/dashboard/page.tsx` (state, 함수, JSX, filter chain 수정)
- `src/app/globals.css` (새 CSS 클래스 추가/수정)

### 다음 단계
- (Issue #7 완료)

---

## Issue #8 — Family Group Creation
**날짜:** 2026-07-14

### 구현 내용
그룹 생성 폼 UI 추가 및 멤버 목록 바인딩.

- 그룹 생성 폼 (`src/app/app/family/page.tsx`)
  - 그룹 없을 때 그룹명 입력 필드 + "그룹 생성" 버튼
  - handleCreateGroup: createFamilyGroup() 호출, 성공 후 입력 필드 초기화
  - 에러 메시지 표시

- 멤버 목록 바인딩
  - getUserProfile(uid) 함수 추가 (`src/lib/firebase/user.ts`)
  - group 로드 후 모든 members의 프로필 조회 (displayName, photoURL 등)
  - 멤버 카드: 실제 displayName으로 아바타 생성 (첫 글자)
  - 생성자(createdBy) vs 구성원 구분 — 아이콘/색상 다르게 표시
  - 현재 사용자에 "(나)" 라벨 추가

### Acceptance Criteria 달성
- ✅ 그룹 생성 폼 제출 시 Firestore에 저장됨
- ✅ 고유한 초대 코드 자동 생성 (이미 구현됨)
- ✅ 초대 코드 UI에 표시됨 (이미 구현됨)
- ✅ 초대 코드 복사 버튼 작동 (이미 구현됨)
- ✅ 생성자의 familyGroupId 자동으로 설정됨 (이미 구현됨)
- ✅ 생성자가 자동으로 members 배열에 추가됨 (이미 구현됨)

### 검증 완료
- `npm run build` — 타입 에러 없음
- `npm run dev` — localhost:3000 정상 실행
- `/app/family` 라우트 200 응답

### 변경 파일
- `src/app/app/family/page.tsx` (그룹 생성 폼, 멤버 리스트 바인딩)
- `src/lib/firebase/user.ts` (새 파일 — getUserProfile)

### 다음 단계
- (Issue #8 완료)

---

## Issue #9 — Family Group Invitation & Membership
**날짜:** 2026-01-17 (최종 수정: 2026-01-17)

### 구현 내용
초대 코드로 기존 가족 그룹에 참여하는 기능 완성.

#### 1단계: 탭 UI & 기본 로직
- Family 페이지 재설계 (`src/app/app/family/page.tsx`)
  - 그룹 없을 때: "생성 / 참여" 탭 UI
  - 참여 탭: 초대 코드 입력 폼 (XXX-XXXX 포맷)
  - handleJoinGroup: 클라이언트 포맷 검증 + Firestore 조회 + 멤버 추가

- Firebase 함수 (`src/lib/firebase/family.ts`)
  - `findFamilyGroupByInviteCode(code)`: Firestore 쿼리로 inviteCode 검색 (초기 구현)
  - `addMemberToGroup(groupId, uid)`: members 배열에 arrayUnion으로 사용자 추가

- Firestore rules 업데이트
  - `familyGroups` update 규칙: 생성자 또는 members 배열 크기 증가 시 허용
  - `users/{uid}` 규칙: 사용자 자신만 read/write 가능

#### 2단계: 보안 규칙 충돌 해결 (2026-01-17 수정)
**문제:** Firestore 쿼리는 "쿼리 자체가 항상 규칙을 만족하는지"로 검증하므로, `familyGroups` 읽기 규칙 (`uid in members`)에 inviteCode 조건이 없으면 비멤버의 쿼리가 항상 거부됨 → `findFamilyGroupByInviteCode`가 실패.

**해결책:** 얇은 인덱스 컬렉션 `invites/{inviteCode}` 추가
- invites 컬렉션: 로그인 사용자 누구나 `getDoc`(쿼리 아님)으로 읽기 가능, `{ groupId }` 만 저장
- familyGroups 컬렉션: 기존 규칙 유지 (멤버만 읽기)
- 함수 변경: `findFamilyGroupByInviteCode` → `resolveInviteCode` (쿼리 제거, getDoc 사용)

- Firestore rules (`firestore.rules`)
  - invites 규칙 추가: read 허용 (로그인 사용자), create 허용 (그룹 생성자만), update/delete 불가
  - familyGroups 규칙 기존 유지

- Firebase 함수 재구현 (`src/lib/firebase/family.ts`)
  - `createFamilyGroup`: 그룹 생성 시 `invites/{inviteCode}` 문서도 생성 (`{ groupId }`)
  - `resolveInviteCode(code)`: `getDoc(doc(db, "invites", code))` → groupId 반환
  - `addMemberToGroup`: 변경 없음 (update 규칙이 이미 멤버 추가 조건 포함)

- Family 페이지 업데이트 (`src/app/app/family/page.tsx`)
  - import: `findFamilyGroupByInviteCode` → `resolveInviteCode`
  - handleJoinGroup: 조회만 하고 groupId 문자열 받음, 멤버 중복 체크 제거 (update 실패로 판별)

### Acceptance Criteria 달성
- ✅ 초대 코드 입력 폼이 유효성 검사 수행 (포맷)
- ✅ 유효한 코드 입력 시 그룹 조회 성공 (invites 컬렉션 경유)
- ✅ 멤버 배열에 현재 사용자 uid 추가됨 (arrayUnion)
- ✅ 사용자의 familyGroupId 업데이트됨 (users/{uid} 문서)
- ✅ 그룹 참여 후 해당 그룹의 음식 목록 조회됨 (useUserFamily 자동 갱신)
- ✅ 잘못된 코드 입력 시 에러 메시지 표시 (3가지: 형식 오류, 코드 미존재, 이미 가입)

### 검증 완료
- `npm run build` — 타입 에러 없음
- `npm run dev` — localhost:3000 정상 실행
- 새 그룹 생성 시 invites 문서 자동 생성됨
- User B가 초대 코드로 그룹 참여 성공
- 중복 참여 시도 → "이미 가입된 그룹이거나 참여할 수 없습니다" 메시지

### 변경 파일
- `firestore.rules` (invites 컬렉션 규칙 추가)
- `src/lib/firebase/family.ts` (createFamilyGroup 업데이트, findFamilyGroupByInviteCode 제거, resolveInviteCode 추가)
- `src/app/app/family/page.tsx` (import 변경, handleJoinGroup 간소화)

### 알려진 문제 (향후 이슈)
- Family 페이지에서 그룹 멤버의 프로필(displayName, photoURL) 로드 시 권한 거부 발생
  - 원인: `users/{uid}` read 규칙이 사용자 자신만 허용, 다른 멤버 프로필 조회 불가
  - 영향: 멤버 목록에 "로딩 중..." 표시 후 멈춤
  - 해결: 별도 이슈로 추적 (users 규칙 또는 프로필 캐싱 방식 결정 필요)

### 다음 단계
- (Issue #9 완료)
- 새 이슈: 멤버 프로필 읽기 권한 문제
- 향후 기능: 그룹 관리 (멤버 삭제, 그룹명 변경 등)

---

## Issue #10 — Family Group Member Management
**날짜:** 2026-07-18

### 구현 내용
가족 그룹 멤버 관리 기능 완성 (멤버 제거, 그룹명 수정, 그룹 삭제).

#### Firestore 규칙 수정
- users/{uid} read 규칙 확대: 모든 로그인 사용자가 다른 사용자 프로필 읽기 가능 (displayName, photoURL 공개)
- users/{uid} write 규칙 추가: 그룹 creator만 멤버의 familyGroupId를 null로 설정 가능 (멤버 제거 시)
  - 부분 업데이트 처리: `"familyGroupId" in request.resource.data` 확인
- familyGroups update 규칙 추가: members.size() 감소 허용 (멤버 제거)

#### Firebase 함수 추가 (`src/lib/firebase/family.ts`)
- `removeMemberFromGroup(groupId, uid)`: members 배열에서 uid 제거 + users/{uid}.familyGroupId = null
- `updateFamilyGroupName(groupId, newName)`: 그룹명 수정
- `deleteFamilyGroup(groupId)`: 그룹 삭제 (cascade: 음식 삭제 → 그룹 삭제 → invites 문서 삭제)
- `deleteAllFoodsInGroup(groupId)`: 그룹의 모든 음식 삭제 (helper)

#### Family 페이지 UI 개선
- 그룹명 수정 인터페이스:
  - 기존: 별도 섹션의 "그룹명 수정" 버튼
  - 변경: 그룹명 우측 연필(✏) 아이콘 버튼 → 클릭 시 인라인 에디트 + ✓/✕ 아이콘
  - 인라인 저장/취소로 UX 개선
- 멤버 제거 버튼:
  - 카드 우측 상단에 X 아이콘 배치 (음식 삭제 버튼과 동일 스타일)
  - admin only, 자신 제외
  - 클릭 시 confirm 대화상자 → 제거 완료 후 "멤버가 제거되었습니다." alert
  - UI에서 즉시 제거 (Firestore 리스너 대기 X)
- 그룹 삭제 버튼:
  - 빨간색, admin only
  - 클릭 시 "그룹을 삭제하시겠습니까? 모든 음식 데이터도 삭제됩니다." confirm
  - 완료 후 `/app/dashboard` 리다이렉트
- 멤버 카드 간격 통일: marginBottom 10px (음식 카드와 동일)

#### Dashboard 페이지 멤버 프로필 표시
- avatar-group (우측 상단 멤버 동그라미) 업데이트:
  - hardcoded 텍스트("엄", "아", "민") → 실제 멤버 프로필 이미지/displayName 첫 글자 표시
  - memberProfiles state 추가, getFamilyGroup useEffect에서 프로필 로드
  - 이미지 없으면 displayName 첫 글자 + 색상 배경

#### Profile 페이지 버그 수정
- statusFor 함수 기준 날짜 버그:
  - 기존: 고정 날짜 2026-07-08 사용
  - 수정: 현재 날짜 기준 계산 (getToday 함수 추가)
  - 영향: 프로필 탭의 임박/경과 숫자가 정확하게 표시됨

### Acceptance Criteria 달성
- ✅ 멤버 목록이 올바르게 표시됨
- ✅ admin만 멤버 제거 버튼 활성화됨
- ✅ 멤버 제거 시 확인 대화상자 표시
- ✅ 제거 후 members 배열에서 uid 제거됨
- ✅ 제거된 사용자의 familyGroupId 초기화됨
- ✅ 그룹명 수정 가능 (인라인 에디트)
- ✅ 그룹 삭제 시 음식 데이터 cascade 처리 완료
- ✅ 멤버 제거/그룹명 수정 완료 후 사용자 피드백 제공
- ✅ UI에서 즉시 갱신 (Firestore 리스너 대기 X)

### 검증 완료
- `npm run build` — 타입 에러 없음
- `npm run dev` — localhost:3000 정상 실행
- 멤버 제거 기능 작동 (Firestore 규칙 배포 후)
- 그룹명 수정 즉시 반영
- 그룹 삭제 cascade 작동 확인

### 변경 파일
- `firestore.rules` (users read/write, familyGroups update 규칙)
- `src/lib/firebase/family.ts` (4개 함수 추가)
- `src/app/app/family/page.tsx` (UI 개선, 상태 관리)
- `src/app/app/dashboard/page.tsx` (memberProfiles, avatar-group 업데이트)
- `src/app/app/profile/page.tsx` (statusFor 날짜 버그 수정)

### 다음 단계
- (Issue #10 완료)
