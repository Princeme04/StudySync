# StudySync Website Description Prompt

Use this prompt to generate a detailed, current description of StudySync.

---

## Copy-Ready Prompt

You are a senior product analyst, UX architect, and technical writer. Describe StudySync as one connected full-stack workflow, not as isolated screens.

Cover:

1. The user problem and product purpose.
2. Every page, visible content, available actions, required state, and next destination.
3. Authentication, authorization, matching, group membership, chat, scheduling, sessions, attendance, accountability, progress, and guidance.
4. How frontend actions change backend data.
5. Redirects, back navigation, branches, loops, and error states.
6. Current release boundaries and unavailable integrations.
7. The visual design language and shared navigation.

Use tables and a Mermaid flowchart where useful. Do not claim that unavailable features exist.

## Current Product Facts

- StudySync connects students using course, academic goal, preferred time, learning style, and study preference.
- Users can register, sign in, reset passwords, complete a profile, find matches, accept or pass matches, create groups, chat, schedule sessions, record attendance, and review progress.
- The primary role is student.
- Business APIs require an authenticated, expiring, revocable server-side session.
- User identity comes from the session. Group, conversation, match, session, and attendance access require membership or ownership.
- Matching and guidance are deterministic and data-derived. Do not call them generative AI.
- Subscriptions and payments are unavailable. The UI explains this and cannot grant paid access.
- Live audio/video is not offered. The active-session page provides coordination and attendance only.
- Google OAuth and phone authentication are not offered.
- Matching candidates and group members come only from registered accounts with completed profiles; demo accounts are not seeded.

## Main User Flow

```text
landing
  -> register or login
  -> dashboard
  -> complete profile
  -> define group requirements
  -> matching
  -> review matches
  -> accept match or create group
  -> group chat and scheduling
  -> confirmed session
  -> active session and attendance
  -> accountability
  -> progress
  -> data-derived guidance
  -> continue, rematch, reschedule, or pause
```

## Page Inventory

| Route | Purpose | Main destinations |
| --- | --- | --- |
| `/` | Public landing page | Auth, product overview |
| `/auth` | Register, login, request reset, confirm reset | Dashboard |
| `/product-overview` | Explain the product and release boundaries | Back, Premium information |
| `/dashboard` | Restore and navigate the authenticated workflow | Profile, matching, group, chat, schedule, session, progress |
| `/profile` | Save academic and study preferences | Group requirements |
| `/group-requirements` | Refine matching requirements | Matching |
| `/matching` | Wait while the backend calculates matches | Matches |
| `/matches` | Review, accept, pass, rematch, or create a group | Match accepted, group setup |
| `/match-accepted` | Confirm a connection and group goal | Chat, confirmed session |
| `/group-chat` | Send messages within an authorized conversation | Confirmed session |
| `/group-setup` | Create a structured study group | Dashboard group view |
| `/schedule` | Generate and choose valid group session slots | Session confirmed |
| `/session-confirmed` | Review the saved session and reminder flag | Active session |
| `/session` | Coordinate and record attendance | Accountability |
| `/accountability` | Review recorded participation and attendance | Progress |
| `/progress` | Show metrics calculated from stored activity | Guidance |
| `/guidance` | Show guidance calculated from stored profile and activity | Matches, schedule, decision |
| `/decision` | Continue, rematch, or pause activity | Premium information, matches |
| `/pro` | Explain that subscriptions are unavailable | Continue with Free |

Old `/ai-analysis` and `/ai-feedback` links redirect to the honestly named matching and guidance pages.

## Technical Context

- Frontend: React 19, TypeScript, React Router, Zustand, Tailwind CSS, and Lucide icons.
- Backend: Express with centralized validation, errors, structured logs, request IDs, monitoring counters, and secure session cookies.
- Current runtime database: SQLite.
- PostgreSQL staging foundation: versioned migrations, schema checks, Compose configuration, and backup/restore scripts.
- Passwords: Argon2id.
- Request validation: Zod.
- Browser E2E: Playwright.
- CI gates: type checking, ESLint, API tests, browser E2E, build, dependency audit, and PostgreSQL migration verification.
- Browser LocalStorage contains non-sensitive UI state and local library files; authenticated workflow state is restored from the backend.

## Important Workflow Rules

- Protected pages redirect unauthenticated users to `/auth`.
- The logo navigates to dashboard for authenticated users and landing for unauthenticated users.
- Back navigation resets the restored page to the top.
- Header and footer remain fixed while content scrolls.
- Duplicate match transitions, duplicate attendance, past sessions, duplicate session slots, and scheduling inactive groups are rejected.
- Client-supplied user IDs, member lists, and study goals cannot override backend-owned collaborative data.
- Unknown and removed API routes return `404` after authentication.

## Required Diagram

Include a Mermaid flowchart showing:

- Public versus protected routes.
- Register/login/reset branches.
- Profile-to-matching flow.
- Accept/pass/rematch branches.
- Group chat, scheduling, session, attendance, accountability, progress, and guidance loop.
- Subscription information as unavailable, not a payment flow.
