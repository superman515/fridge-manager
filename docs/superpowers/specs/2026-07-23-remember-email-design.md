# Remember Email Feature Design

## Overview
Add a checkbox to the login page to let users save their email address. Saved email is auto-filled on next login for convenience.

## Scope
- Only email is saved (not password for security)
- Checkbox appears below password field
- Initial state: unchecked
- Storage: `localStorage`
- Email deletion: when user unchecks the box during login
- Google login: does not save email

## Architecture

### Files to Create
- `src/hooks/useRememberedEmail.ts` - Custom hook managing localStorage for email

### Files to Modify
- `src/app/auth/login/page.tsx` - Add checkbox UI and integrate hook

## Hook Implementation: `useRememberedEmail`

**Purpose:** Encapsulate localStorage read/write for remembered email

**Returns:**
```ts
{
  email: string;           // Current email value
  setEmail: (v: string) => void;  // Update email
  shouldRemember: boolean;  // Checkbox state (initial: false)
  setShouldRemember: (checked: boolean) => void;  // Update checkbox
}
```

**Behavior:**
- On mount: read from `localStorage.getItem('fridge_remembered_email')` and populate `email`
- When `setShouldRemember(true)` + login succeeds: save to localStorage with key `fridge_remembered_email`
- When `setShouldRemember(false)` + login succeeds: delete from localStorage (user unchecked)
- Namespace key with `fridge_` prefix to avoid collisions

## Login Page Changes

**UI Addition:**
- Add checkbox below password field
- Label: "이메일 저장"
- Initial value: unchecked

**Logic:**
- Replace `useState("email")` with `useRememberedEmail()`
- In `handleSubmit()`: after successful login, check `shouldRemember` and call save/delete logic via hook

**No changes needed:**
- Google login: skip email-saving logic entirely
- Password field: unchanged
- Form validation: unchanged

## Data Flow

1. User loads login page
2. Hook mounts → reads localStorage → pre-fills email if saved
3. User enters credentials, optionally checks "이메일 저장"
4. User clicks login button
5. Validation + Firebase auth
6. **Success:**
   - If `shouldRemember === true`: call hook method to save email
   - If `shouldRemember === false`: call hook method to delete saved email
   - Navigate to dashboard
7. **Failure:** show error, stay on page (checkbox state preserved)

## Security & Privacy
- Email only (no sensitive data)
- Client-side only (no server submission)
- User can manually clear localStorage or uncheck box anytime
- Fits existing Firestore security model (no new rules needed)

## Testing
Manual: 
1. Enter email, check box, login → verify email persists on page reload
2. Uncheck box, login again → verify localStorage cleared
3. Google login → verify email field NOT populated from saved email

## Future Considerations
- Hook reusable for other login methods if needed
- Could extend to password hints (not plaintext) or MFA setup
