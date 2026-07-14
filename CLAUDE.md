# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fridge Manager** is a real-time family food inventory management app. Family members track food items in a shared fridge, see expiration status via color coding (green/yellow/red), filter by category, and sort by expiration date. Built with Next.js, React, Firebase Firestore, and TypeScript.

### Core Problem Solved
Family members don't share real-time fridge information, causing duplicate purchases and food waste. This app centralizes food tracking with visual status indicators (colors based on days until expiration).

### Key Data Model
- **User**: Firebase Auth + profile (name, image in Storage)
- **FamilyGroup**: Container for family members' shared food list
- **Food**: Items with name, category (채소/육류/유제품/기타), expiryDate, quantity, createdAt

## Development

### Quick Start
```bash
npm install                 # Install dependencies
npm run dev                # Start dev server (localhost:3000)
npm run build              # Build for production
npm run start              # Run production build
npm run lint               # Run ESLint
```

### Environment Setup
Copy `.env.local.example` to `.env.local` and fill in Firebase credentials:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... other Firebase env vars
```
The `.env.local` file is gitignored; never commit it.

### Testing
No test suite yet. Use `npm run dev` to manually test features:
1. Start dev server
2. Open browser to `http://localhost:3000`
3. Test auth (login/signup), dashboard, food CRUD, filtering/sorting

## Architecture

### Directory Structure
```
src/
  app/              # Next.js App Router routes
    page.tsx        # Landing page
    layout.tsx      # Root layout
    globals.css     # Global styles (ported from Fridge_Manager.html)
    app/            # Protected routes (wrapped by AuthContext)
      dashboard/    # Food list view (main UX)
      family/       # Family group & member management
      profile/      # User profile & avatar upload
    auth/           # Authentication routes
      login/
      signup/
  lib/firebase/     # Firebase client and database functions
    client.ts       # Firebase app init (singleton pattern)
    food.ts         # Food CRUD (add, delete, list by family)
    family.ts       # Family group CRUD
    storage.ts      # Firebase Storage (profile images)
  hooks/            # React hooks (auth, data fetching)
    useAuth.ts      # Returns current user from AuthContext
    useFoodList.ts  # Subscribes to real-time food updates for family
    useUserProfile.ts
    useUserFamily.ts
  context/
    AuthContext.tsx # Firebase Auth state + current user
  types/            # TypeScript interfaces
    food.ts
    familyGroup.ts
    user.ts
```

### Data Flow
1. **Auth**: User signs up/logs in via Firebase Auth. `AuthContext` manages current user state.
2. **Family Groups**: User must join/create a family group to use the app. Group ID is stored in Firestore user doc.
3. **Food List**: Real-time Firestore listener (via `useFoodList`) syncs all foods in the family group.
4. **Expiration Logic**:
   - Green: ≥ 4 days until expiry
   - Yellow: 1–3 days until expiry
   - Red: Expired or ≤ 0 days
5. **Storage**: Profile images uploaded to Firebase Storage at `users/{userId}/avatar.jpg`

### Firestore Security Rules
All rules in `firestore.rules`:
- Users can only read/write their own user doc
- FamilyGroups: creator sets data, members can read
- Foods: only family group members can read/write
- Storage: users can only upload their own avatar

### Key Constraints
- Fixed mockup dimensions (390×844 `.phone` CSS class) still in styles — responsive design deferred
- No test suite; manual testing only
- Filtering/sorting happens client-side (no Firestore query optimizations yet)
- Family member invitation (adding users to groups) requires server-side logic — not yet implemented

## Common Workflows

### Adding a Feature
1. Check `issue-diary.md` for completed work and design decisions
2. Read relevant data model in `src/types/`
3. Add Firebase function in `src/lib/firebase/` if needed
4. Update/create hook in `src/hooks/` for data fetching
5. Update component in `src/app/app/` to use new hook
6. Manual test in dev server before committing

### Debugging Real-Time Issues
- Firestore listener not updating? Check `useFoodList` — ensure hook is called in the component and family group exists
- Auth state lost? Check `AuthContext` initialization in `src/app/app/layout.tsx` (protected route guard)
- Firebase rules error? Check browser console for Firestore errors; rules are in `firestore.rules`

### Working with Firebase Storage
- All storage ops are in `src/lib/firebase/storage.ts`
- Upload path: `users/{userId}/avatar.jpg`
- Download via React component in `src/app/app/profile/` (uses image URL with signed read access)

## Agent Skills

### Issue Tracker
Issues and feature requests are tracked in GitHub Issues. External pull requests are triaged as issues. See `docs/agents/issue-tracker.md`.

### Triage Labels
Standard triage label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain Docs
Single-context layout with `CONTEXT.md` and `docs/adr/` at the repository root. See `docs/agents/domain.md`.

## Notes for Future Agents

- Commit messages: Use Korean for consistency with project. Standard format: `feat:`, `fix:`, `docs:`, `refactor:` prefixes.
- Issue tracking: Link PRs to issues with `Closes #N` or `Fixes #N` in PR body.
- Design decisions should be recorded in `docs/adr/` (Architecture Decision Records) if they affect future work.
