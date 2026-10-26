# LearnSpace — Product Requirements (MVP architecture)

## Vision
LearnSpace is a mobile-first (Android + Web) educational platform built with Expo + React Native + TypeScript. The application now includes database-backed authentication, strict role navigation, dashboards, course progress, and a working Pre-Test engine. Full learning content remains the next product phase.

## Target Platforms
- Android (via Expo)
- Web (react-native-web via Expo)
- iOS supported structurally; not primary.

## Roles
- `STUDENT`: the only role granted by public registration or Google login.
- `ADMIN`: provisioned operationally; it cannot be selected from public registration.

## Core Flow (end state, placeholders now)
Login/Register → Dashboard (role-aware) → Course Detail (Pre-Test → Materials → Videos → Manual Book → Discussion → Post-Test → Results)

## Auth
Dual providers through the same `/api/auth` surface:
1. Email + Password: `POST /api/auth/register`, `POST /api/auth/login`
2. Emergent Google OAuth: `POST /api/auth/session` (session_id → session_token)
Both issue a 7-day opaque `session_token`; only its SHA-256 hash is stored in the TTL-indexed `user_sessions` collection.
Validation: `GET /api/auth/me` with `Authorization: Bearer`.
Logout: `POST /api/auth/logout`, followed by secure local token removal.
Passwords are bcrypt-hashed, emails are normalized and unique, password/name/email validation is enforced server-side, and login failures use a generic response.

## Backend (FastAPI, modular)
- `server.py` — app entry, routers, startup indexes + migration + seed.
- `db.py` — Mongo client, indexes for all 15 collections (identity + relationships).
- `db_models.py` — normalized document models for every entity.
- `models.py` — Pydantic API DTOs.
- `auth.py` — bcrypt passwords, hashed session tokens, role dependencies, Emergent OAuth, profile creation + legacy migration.
- `seed_data.py` — seeds real catalog (courses, tests, questions, answers, materials, videos, manual books); idempotent + migrates legacy embedded-option questions.
- `courses.py` — DB-backed course catalog + module unlock state.
- `pretest.py` — pre-test engine on normalized questions/answers; records attempt + result.
- `dashboard.py` — `/api/dashboard/student` (real progress), `/api/dashboard/admin/overview` (real counts).
All routes prefixed with `/api`. `_id` excluded from every projection.

## Normalized Database Schema
Collections (all with `created_at`/`updated_at`; progress/attempt records also `started_at`/`completed_at`):
- `users` (identity only) ↔ `profiles` (1:1 by `user_id`, extended fields, no identity duplication)
- `courses` → `materials`, `videos`, `manual_books` (by `course_id`)
- `materials` → `material_progress` (unique `user_id`+`material_id`)
- `videos` → `video_progress` (unique `user_id`+`video_id`)
- `tests` → `questions` → `answers` (options normalized out of questions)
- `test_attempts` (session) → `test_results` (scored outcome), by `user_id`+`test_id`/`course_id`
- `course_progress` (unique `user_id`+`course_id`)
- `discussions` → `comments` (self-referential `parent_comment_id` for replies)
- `notifications` (by `user_id`)
Every student-owned record carries `user_id`; relationships use stable string foreign keys; unique indexes prevent duplicate progress.

## Frontend (Expo Router, modular)
```
app/
  (auth)/login, register
  (student)/dashboard, courses, progress, profile    (bottom tabs)
  (admin)/overview, users, content, analytics, reports (bottom tabs)
  course/[id]                                        (learning modules placeholder)
src/
  theme.ts                     — Tactile/Playful tokens
  constants/config.ts          — env-driven URL + storage keys
  types/                       — user, course types
  services/api.ts, auth.service.ts
  hooks/useAuth.tsx            — AuthContext (bootstrap, loading, errors, operations, persistence)
  components/ui/               — Button, Card, Input, Chip, Badge, Avatar,
                                 EmptyState, LoadingSpinner, Icon, ScreenContainer
  utils/storage/               — secure-store on native, localStorage on web
```

## Design System
- Colors from `/app/design_guidelines.json` (Tactile / Playful): coral `#FF715B`, yellow `#FFD166`, warm off-white surface. No blue/indigo.
- Spacing + radius tokens exposed from `theme.ts`.
- Rounded (`lg` / `pill`) chunky touch targets, shadow tier 2.
- Icons via `@react-native-vector-icons/ionicons`.

## Future-ready extension points
- Pre-Test / Post-Test engines → add module routers under `/api/tests`.
- Learning materials & videos → S3/object storage integration slot.
- PDF Manual Book → viewer screen under `course/[id]/manual-book`.
- Discussion forum → separate collection + thread routes.
- Progress & results → aggregated endpoints + progress UI already stubbed.
- Admin: user mgmt, content mgmt, analytics, reports — screens already routed.
- Notifications → `expo-notifications` module slot in `src/services/`.

## Implemented authentication acceptance criteria
- Student registration always creates `STUDENT`; client role injection is rejected.
- Student and admin login are database-backed; no credentials are displayed in the UI.
- Session tokens persist in SecureStore on native and the web storage adapter on web.
- Root, student, admin, and course layouts enforce authentication and role redirects.
- Backend student/admin endpoints independently enforce role authorization.
- Login/register loading, field validation, authentication errors, and logout confirmation are implemented.
- Verified with 36 backend regression tests plus browser checks for persistence and cross-role redirects.

## Backlog
- **P0:** Learning materials, PDF/manual-book viewer, and learning videos.
- **P1:** Post-Test/results and comprehensive admin management.
- **P2:** Notifications and real-time progress updates.
- **Done:** Discussion forum (threads + threaded comments) per course — `discussion.py` + `/api/courses/{id}/discussions`, `/api/discussions/{id}`, `/api/discussions/{id}/comments`; plus owner edit/delete (`PATCH`/`DELETE /api/discussions/{id}` and `/api/comments/{id}`, ownership-enforced, cascade delete). Frontend at `app/course/[id]/discussion/*`.

## Test Accounts
See `/app/memory/test_credentials.md`.

## Smart Business Enhancement (candidate)
Add a **referral + streak-based premium nudge**: each 7-day streak unlocks a shareable "badge card" that includes a referral code; invited friends earn starter badges — organic growth + retention loop built on the gamification system already defined by design.
