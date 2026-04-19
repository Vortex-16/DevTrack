# DevTrack Requirements

## Context & Goals
- Provide a developer growth platform that links learning activity, GitHub project work, and AI insights to prove progress.
- Target individual developers first; keep the stack and flows ready for teams and mobile clients later.
- Optimize for short setup time: minimal env vars, predictable local/dev/prod parity, and simple onboarding.

## Functional Requirements
- **Authentication & Accounts**
  - GitHub OAuth via Clerk; session-based access to both web and mobile clients.
  - Profile sync: GitHub username, avatar, and email stored in Firebase.
  - Auth guard on all app routes and APIs except landing/public docs.
- **Learning Tracker**
  - CRUD learning logs with date, start/end time, description, tags/skills, and mood.
  - 30-day heatmap, weekly chart, streak counter, and basic filters (tag, date range, mood).
  - Pagination for history; editing and deletion must preserve streak calculations.
- **Project Tracker**
  - CRUD projects with name, GitHub URL, languages, status/progress %, AI analysis summary, commits, clone counts (total/unique), and created date.
  - Pull GitHub repo metadata (commits, languages, activity, clones) on creation and on-demand re-sync.
  - Display project stats and progress bars on dashboard and project list.
- **GitHub Integration**
  - OAuth PAT from backend; use Octokit for profile, repos, languages, activity, commits.
  - Rate-limit handling and graceful degradation when GitHub is unavailable.
- **AI Features**
  - Project analysis via Groq (Llama 3.3) using repo stats and recent commits.
  - Context-aware chat (project + learning context) with safety filters and fallbacks for API failures.
- **Dashboard & Visualization**
  - Consolidated metrics: learning streak, entries count, project progress summary, recent activity feed.
  - Widgets for weekly activity, 30-day heatmap, and recent learning log list.
- **Notifications**
  - Firebase Cloud Messaging for reminders (streak nudges, project updates) with opt-in/out per device.
  - Service worker on web for background delivery.
- **System Info & Settings**
  - System info/help page with docs links and environment status (API base URL, auth state, notification permission state).
  - User settings for notification preferences and profile display name.
- **Landing & Onboarding**
  - Public landing page with CTA to sign in, feature highlights, and team links.
  - First-time user onboarding checklist (connect GitHub, create first learning entry, add a project).
- **Mobile Support (current state)**
  - Expo app shell and Flutter app present; both should reuse the same API/auth flows when enabled.
  - Push/notifications and login should remain consistent with web (Clerk + Firebase).

## Non-Functional Requirements
- **Performance**: Initial dashboard render < 2.5s on broadband; API p95 < 400ms for cached reads; async GitHub/AI calls can be longer but must show loading states.
- **Reliability**: No data loss on retries; idempotent writes for sync endpoints; background jobs should be retry-safe.
- **Security & Privacy**: JWT verification on all protected routes; least-privilege PAT usage; rate limiting (500 req/15min general, 100 req/15min AI); CORS scoped to frontend origin; input validation and Helmet headers.
- **Scalability**: Stateless API horizontally scalable; Firestore indexes defined; GitHub/AI calls batched when possible.
- **Usability & Accessibility**: Keyboard navigation, focus states, and sufficient contrast; responsive layouts for desktop/tablet/mobile.
- **Observability**: Structured logs with request IDs; basic metrics for API latency, error rate, and external-call failures.

## Data Requirements
- Store users, learning logs, projects, GitHub-derived metrics, AI analysis snapshots, notification tokens, and audit timestamps.
- Preserve historical AI analyses per project when re-running; tag with model version and commit SHA where available.

## External Dependencies
- Clerk (GitHub OAuth), Firebase (Firestore, FCM), Groq (Llama 3.3), GitHub API (Octokit), Vite/React client, Express backend.

## Environment & Deployment
- Envs: VITE_CLERK_PUBLISHABLE_KEY, VITE_FIREBASE_*, FIREBASE_*, CLERK_SECRET_KEY, GROQ_API_KEY, GITHUB_PAT, API_BASE_URL.
- Dev: Vite dev server + Express dev server; hot reload for client.
- Prod: Build client with Vite, serve static assets via CDN or hosting; run API with process manager; configure HTTPS and CORS.

## Out of Scope (current phase)
- Team collaboration features, shared workspaces, and peer reviews.
- Public portfolio sharing and export/PDF reports.
- Advanced analytics beyond defined dashboards (custom charts, A/B testing).

## Success Metrics
- Daily active users, 30-day learning streak completion rate, project sync success rate, AI analysis request success rate, notification opt-in rate, and median dashboard load time.
