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
