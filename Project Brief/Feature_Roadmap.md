# 🚀 DevTrack: Feature Roadmap & Development Status

This document provides a comprehensive overview of the current capabilities of DevTrack, identifying what is already built, what is in progress, and what is planned for the future.

---

## ✅ Done Features (The "Core" & "Advanced" Layers)

DevTrack has evolved beyond a simple tracker into a full-scale developer ecosystem.

### 1. Developer Identity & Growth
- **Multi-Source Auth**: Secure login via Clerk with GitHub OAuth integration.
- **Enhanced Public Profiles**: Dynamic showcase of skills, verified by project activity.
- **LeetCode Integration**: Automated synchronization of coding stats, total solved problems, and contest ratings.
- **Goal Management**: Goal setting system with milestones, target dates, and auto-calculating progress bars.
- **AI Resume Builder**: Generate and manage professional resumes hydrated with real project data and commit history.

### 2. Intelligent Project Tracking
- **Smart GitHub Sync**: Automated extraction of commits, languages, and repo metadata via Octokit.
- **AI-Powered Analysis**: Deep repository scans using Groq (Llama 3.3) to identify:
    - 🔒 **Security Vulnerabilities**
    - 🧩 **Complexity Hotspots**
    - 💡 **Actionable Next Steps**
- **AI Infrastructure Reliability**: Intelligent API key rotation system (supporting 4+ keys) to handle Groq rate limits automatically.
- **Project Discovery**: AI-driven generation of personalized project ideas tailored to the user's tech stack and skill level.
- **GitHub Clone Counter**: Real-time tracking of repository traffic, measuring total and unique clones per project.
- **Task Management**: Project-specific TODO lists integrated directly into the project workspace.

### 3. Social & Proof of Work
- **Showcase Zone**: Public project gallery with glassmorphism UI.
- **Engagement Loop**: Starring and commenting on projects with real-time email notifications to owners.
- **Endorsement System**: "Vouching" for skills and projects within the community.
- **Social Graph**: Following/Followers system to track peers' growth.

### 4. Learning & Productivity
- **Learning Logs**: Detailed tracking with mood analysis, time metrics, and tags.
- **Visual Evidence**: 30-day activity heatmaps and weekly growth charts.
- **Resource Management**: Bookmark system for courses, tutorials, and documentation.
- **Notifications**: FCM integration for streak nudges and project updates.

---

## ⏳ Priority Execution Plan (Phased)

This plan follows the required priority order: **Bugs (Done) → Notifications (Current) → PDF Weekly Report**.
Projects and Dashboard updates are intentionally moved to a later phase.

### Phase 1: Critical Bugs & Access Stability ✅ (Completed)

**Goal:** Stabilize private repo access flow and remove repeated re-consent friction.

1. **7-Day Private Repo Access Persistence**
- Keep private repo access active for 7 days after user grants it.
- Prevent immediate fallback to normal signin flow after refresh/login.

2. **Configurable Access Retention in Settings**
- Add setting to control how long private repo access should be retained.
- Ensure behavior is consistent across multi-device logins for the same user.

3. **Security & Safety Hardening (Bug-Fix Scope)**
- Improve token handling for GitHub PAT/OAuth tokens.
- Confirm tokens are stored and rotated safely.
- Add practical rate limiting for sensitive endpoints.

**Exit Criteria**
- [x] Private repo access does not unexpectedly expire before configured duration.
- [x] Users do not repeatedly re-authorize on normal signin across devices.
- [x] No regression in existing GitHub sync and analysis flows.

### Phase 2: Live Device Notifications (Done)

**Goal:** Deliver WhatsApp-like real-time notifications to the correct logged-in user/device.

1. **Realtime Notification Delivery**
- Ensure instant push/in-app delivery to active device sessions.
- Guarantee user-targeted routing (recipient must match authenticated user).

2. **Delivery Reliability & State Sync**
- Add ack/retry behavior for missed or delayed notifications.
- Keep read/unread states synced across devices.

3. **Notification UX Baseline**
- Unified notification center and consistent badge counts.
- Standardize payload format for project, social, and system alerts.

**Exit Criteria**
- [x] Notifications reach the intended user in near real-time.
- [x] No cross-user notification leaks.
- [x] Read/unread status remains consistent across sessions.

### Phase 3: Premium AI Growth Reports + Secure History ✅ (Completed)

**Goal:** Ship actionable weekly reports with executive-grade intelligence and secure historical tracking.

1. **Executive AI Insights Engine**
- [x] **High-Fidelity Intelligence**: Multi-point strategic recommendations, executive summaries, and per-project technical briefs.
- [x] **Sentiment Analysis**: Dynamic growth tracking and consistency scoring.
- [x] **Rate-Limit Resilience**: Automated rotation across multiple Groq API keys (PDF-specific).

2. **Premium PDF Architecture**
- [x] **Multi-Page Layout**: Professional aesthetic with rounded cards, glassmorphism pills, and automated persistent headers/footers.
- [x] **Layout Optimization**: Clean page breaks and content-aware spacing to eliminate blank pages.

3. **Secure History & Persistence**
- [x] **Firestore Tracking**: Secure storage of AI insights in the `reports` collection for historical progress tracking.
- [x] **Privacy-First Design**: Storing structured data instead of raw PDF files to ensure 100% data security.
- [x] **History API**: Secure `/api/reports/history` endpoint with Clerk authentication for frontend integration.

4. **Mail Delivery Workflow**
- [x] **Brevo Integration**: Reliable weekly report delivery via dedicated mail service.
- [x] **Unified Pipeline**: Single-pass generation of PDF and AI metadata for efficiency.

**Exit Criteria**
- [x] Weekly reports are generated, delivered, and stored securely in Firestore.
- [x] Reports accurately reflect both public and private repository activity.
- [x] AI insights provide deep, actionable technical value beyond simple stats.
- [x] PDF layout meets premium, professional standards.

### Phase 4: Premium AI Growth Reports (with secure history) (50% done) {With Phase 5}

---

### 🚀 Phase 5: AI Expert Mentor Mode (Upcoming)

**Goal**: Transform DevTrack from a "tracker" into a proactive **Career Mentor & Guide**.

1. **AI Mentorship Logic**
- [ ] **Proactive Guidance**: If no contributions are detected for 7+ days, the AI shifts its tone from "Reviewer" to "Teacher/Guide" in the PDF.
- [ ] **Restart Strategies**: Provide specific, low-friction tasks to help the developer regain momentum.

2. **Advanced Profile Intelligence**
- [ ] **Skill & Interest Mapping**: Analyze the user's GitHub profile README and commit themes to identify true technical interests.
- [ ] **Career Path Prediction**: Suggest specific job roles or specialized paths (e.g., "Fullstack Performance Expert" or "Distributed Systems Specialist") based on deep repo analysis.

3. **The "GitHub Health Checkup"**
- [ ] **Comprehensive Audit**: Weekly reports designed as a "Medical Checkup" for your digital career—identifying "weak spots" in your stack and suggesting "remedies" (new projects/learning paths).

---

### Phase 6: Deferred (Work Later)

#### Projects
- Entire UI overhaul
- Security upgrades for PAT/token safety
- Strong user mapping: user -> projects -> interests -> AI chat context
- Endpoint rate limiting expansion

#### Dashboard
- Real metric AI insights showing user growth progress over time

---

## 🔮 Guessed Upcoming Features (Future Iterations)

*Where the project is likely headed next:*

- **Job Matcher AI**: Matching users with open-source projects or jobs based on their DevTrack profile and "Verified Skills".
- **AI Code Reviewer**: Deeper line-by-line AI feedback on PRs within the dashboard.
- **Community Leaderboards**: Friendly competition based on learning streaks and "Vouch" counts.
- **Learning Path Suggestions**: Automated roadmaps based on what the user is currently building.

---

## 💡 What else a Coder needs? (Suggestions)

To make this a truly "premium" coder ecosystem, the following sections/features could be added:

### 🛠️ Section: Developer Experience (DX)
*   **API Documentation**: A dedicated route (e.g., `/docs/api`) using Swagger/OpenAPI for those wanting to build on top of DevTrack.
*   **Docker Integration**: A `docker-compose.yml` for 1-command environment spin-up.
*   **Postman/Bruno Collections**: Exportable collections for backend developers.

### 📊 Section: Engineering Insights
*   **Performance Metrics**: Tracking app bundle sizes or API latency for projects the user builds.
*   **Dependency Health**: Alerts when a project uses outdated or vulnerable npm packages (using `npm audit` style AI analysis).

### 🤝 Section: Professional Networking
*   **Collaboration Invitations**: Small "Hire Me" or "Open for Collab" toggles on the public profile.
*   **Verified Certificates**: Integration with platforms like Credly or LinkedIn to pull/push certifications.

### 🧪 Section: Quality Assurance
*   **Testing Status Integration**: Fetching Jest/Cypress results from GitHub Actions to show "Code Quality" badges on the DevTrack dashboard.
