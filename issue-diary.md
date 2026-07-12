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
- Issue #5 (Family Group Creation): 가족 그룹 생성 기능 구현

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
