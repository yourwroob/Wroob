# Wroob — Pre-Launch Security & QA Audit

**Audit date:** 2026-04-14
**Branch audited:** `main`
**Final commit:** `82a0242`
**Dev server:** `http://localhost:5173` ✅

---

## Overview

Three full QA rounds were conducted prior to production launch. Every CRITICAL and HIGH issue found has been resolved. The codebase is cleared for launch.

---

## QA Round 1 — Initial Security & Flow Audit

### Issues Found and Fixed

| ID | Severity | Component | Issue | Fix |
|---|---|---|---|---|
| HIGH-dm-privacy | 🟠 HIGH | `useDirectMessages.ts` | Shared `"dm-realtime"` Supabase Realtime channel delivered all message INSERT/UPDATE payloads to every subscribed user regardless of sender/receiver | Replaced with per-user channels (`dm-user-${user.id}`) using server-side `sender_id=eq.` and `receiver_id=eq.` filters |
| HIGH-employer-apply | 🟠 HIGH | `apply-to-internship` (edge fn) | `apply_to_internship_atomic` is SECURITY DEFINER (bypasses RLS) and had no role check at the function layer — an employer could POST and insert a fake application row | Added service-role `user_roles` lookup before calling the RPC; returns 403 if role ≠ `"student"` |
| HIGH-chat-route | 🟠 HIGH | `ActiveChat.tsx` | Profile link for employer partners used `/employers/` (plural) — route not defined in App.tsx (which uses `/employer/:userId`) → guaranteed 404 | Changed to `/employer/${partnerId}` |
| HIGH-student-employer-dm | 🟠 HIGH | `EmployerProfile.tsx` | No Message button on employer profile pages — students had no way to initiate DMs with employers | Added Message button dispatching `open-dm` CustomEvent, visible only to authenticated students |
| HIGH-closed-internship | 🟠 HIGH | `InternshipDetail.tsx` + RLS | Students who had applied couldn't view internship listings after an employer closed them (RLS filtered rows; frontend `.in(["published","closed"])` was a no-op) | Added new permissive RLS SELECT policy: applicants can view non-draft internships they have applications for (`migration 20260414000002`) |
| HIGH-profile-save | 🟠 HIGH | `Profile.tsx` | All three Supabase update calls (`profiles`, `student_profiles`, `employer_profiles`) discarded return values — DB write failures showed no error | Added error capture and `toast` on failure for all three update calls |

---

## QA Round 2 — Deep Backend & Edge Function Audit

### Issues Found and Fixed

| ID | Severity | Component | Issue | Fix |
|---|---|---|---|---|
| SECURITY-draft-bypass | 🔴 CRITICAL | `apply_to_internship_atomic` (SQL) | SECURITY DEFINER RPC only blocked `status='closed'`; draft internships (`status='draft'`) were fully accessible — students could apply to unlisted postings | Migration `20260414000001`: replaced with `status != 'published'` check; draft → `NOT_FOUND` (prevents UUID enumeration), non-published → `CLOSED` |
| HIGH-role-error-mask | 🟠 HIGH | `apply-to-internship` (edge fn) | `roleError \|\| !roleRow \|\| role !== "student"` collapsed DB transient errors and authorization failures into the same 403 branch — a valid student got "Only students can apply" on any `user_roles` table failure | Split into two branches: DB error → 500, missing/wrong role → 403 |
| HIGH-updatestep-silent | 🟠 HIGH | `useOnboardingStatus.ts`, `useEmployerOnboardingStatus.ts` | `updateStep` called `supabase.update()` without capturing the return value — any DB write failure silently passed, leaving `onboarding_step` stale and causing redirect loops on next login | Added `const { error } = await ...`; reverts optimistic step update on failure |
| HIGH-skilltests-swallow | 🟠 HIGH | `SkillTests.tsx` | `fetchTests` never read the `error` property from the Supabase response — any edge function failure rendered an empty grid with no feedback | Added `fetchError` state; error card shown instead of empty grid on failure |

---

## QA Round 3 — Final Pre-Launch Audit

### Issues Found and Fixed

| ID | Severity | Component | Issue | Fix |
|---|---|---|---|---|
| HIGH-employer-profile-crash | 🟠 HIGH | `EmployerProfile.tsx` | `role` was used in JSX (`role === "student"`) but not destructured from `useAuth()` — uncaught ReferenceError crashed the employer profile page for all viewers | Added `role` to `const { user, role } = useAuth()` |
| HIGH-verify-step-overwrite | 🟠 HIGH | `EmployerOnboardingVerify.tsx` | `handleVerifyEmail` wrote `onboarding_step: 6` directly to DB then called `updateStep(5)` — overwrote the DB value with 5; Dashboard routes `step=5` back to `/verify` → redirect loop | Changed `updateStep(5)` → `updateStep(6)` in `handleVerifyEmail` |
| HIGH-resume-private | 🟠 HIGH | `ApplicantReview.tsx`, `OnboardingResume.tsx`, `Profile.tsx` | `resumes` bucket is private; code stored full public URLs in DB and opened them as download links — browsers received 403 | Store storage path (not URL) in DB; generate 1-hour signed URLs via `createSignedUrl(path, 3600)` at display time in `ApplicantReview` |
| HIGH-skip-persist | 🟠 HIGH | `OnboardingResume.tsx` | `handleSkip` discarded `completeOnboarding()` return value — a DB failure silently passed, leaving `onboarding_status='pending'` and causing a redirect loop on next login | Added error capture; blocks navigation and shows toast on failure |
| HIGH-verify-unverified-step | 🟠 HIGH | `EmployerOnboardingVerify.tsx` | `handleContinueUnverified` and `handleContinue` both called `updateStep(5)` — same as the verify step in Dashboard routing; any employer using the unverified path or navigating back would save `onboarding_step=5`, routed back to `/verify` on next login | Changed both to `updateStep(6)` |

---

## Files Modified

| File | Type | Change |
|---|---|---|
| `src/hooks/useDirectMessages.ts` | Frontend | Per-user Realtime channels with server-side filters |
| `src/components/chat/ActiveChat.tsx` | Frontend | Fixed employer profile route (`/employer/` not `/employers/`) |
| `src/pages/EmployerProfile.tsx` | Frontend | Added Message button; fixed `role` destructure from `useAuth()` |
| `src/pages/StudentProfile.tsx` | Frontend | Message button visible to both students and employers |
| `src/pages/InternshipDetail.tsx` | Frontend | Query uses `.in(["published","closed"])`; deadline guard UI |
| `src/pages/Profile.tsx` | Frontend | Resume stores path not URL; delete handles legacy URL format; all update calls surface errors |
| `src/pages/ApplicantReview.tsx` | Frontend | Generates signed URLs for resume downloads |
| `src/pages/onboarding/OnboardingResume.tsx` | Frontend | Stores path; `handleSkip` checks `completeOnboarding()` error |
| `src/pages/employer-onboarding/EmployerOnboardingVerify.tsx` | Frontend | `handleVerifyEmail`, `handleContinue`, `handleContinueUnverified` all call `updateStep(6)` |
| `src/pages/SkillTests.tsx` | Frontend | `fetchError` state; error card on fetch failure |
| `src/hooks/useOnboardingStatus.ts` | Frontend | `updateStep` captures error, reverts optimistic state on failure |
| `src/hooks/useEmployerOnboardingStatus.ts` | Frontend | Same fix as above for employer |
| `src/contexts/AuthContext.tsx` | Frontend | `emailRedirectTo` points to `/dashboard` for post-confirm onboarding guard |
| `supabase/functions/apply-to-internship/index.ts` | Edge Fn | Role check (student only); deadline guard; error branch separation |
| `supabase/migrations/20260414000001_fix_apply_atomic_draft_guard.sql` | Migration | `apply_to_internship_atomic` blocks draft/non-published internships |
| `supabase/migrations/20260414000002_rls_applicants_view_closed_internships.sql` | Migration | Permissive SELECT policy for applicants viewing closed internships |

---

## Security Hardening (Prior Rounds)

| Area | Fix Applied |
|---|---|
| Email relay (send-email fn) | `to` field removed from input schema — recipient is always the authenticated user's own email |
| Open redirect (external URLs) | `safeExternalUrl()` rejects `javascript:` and `data:` schemes across all link rendering |
| Employer profile data exposure | Explicit field list in `EmployerProfile` query excludes `gstin`, `pan_number`, `cin`, `manager_email`, `company_domain`, `work_email_verified`, etc. |
| Student profile data exposure | Explicit field list in `StudentProfile` query excludes `resume_url`, `phone_number`, `onboarding_*` columns |
| Rate limiting | Atomic `check_and_increment_rate_limit` RPC (FOR UPDATE) used across all edge functions — no TOCTOU race |
| Auth token validation | All edge functions use `getUser()` (not JWT claims) for server-side identity verification |
| Employer verification (personal email) | Domain mismatch surfaces amber escape hatch instead of hard-blocking; unverified path is explicitly labelled |

---

## Local Development Setup

```bash
git clone https://github.com/Arjav1512/bright-match-ai-00.git
cd bright-match-ai-00-main
npm install
# .env already present with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

**Dev server:** `http://localhost:5173`

Environment variables required:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key (public, safe for frontend) |

> The Supabase client uses the anon key only. Service role key is never referenced in frontend code.

---

## Launch Readiness

| Area | Status |
|---|---|
| CRITICAL issues | ✅ 0 open |
| HIGH issues | ✅ 0 open |
| Auth & role enforcement | ✅ |
| RLS policies | ✅ |
| Edge function security | ✅ |
| Onboarding flows (student + employer) | ✅ |
| Resume privacy (private bucket) | ✅ |
| DM privacy (per-user Realtime) | ✅ |
| Profile data exposure | ✅ |
| Local dev server | ✅ `http://localhost:5173` |
