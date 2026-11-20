# 🚀 DevTrack — Developer Workshop & Habit Engine

> AI-powered developer analytics platform that tracks GitHub velocity, maps learning consistency, analyzes engineering DNA, and ships automated growth intelligence.
>
> **Live Web App:** [https://devtrackweb.xyz](https://devtrackweb.xyz) • **API Status:** [https://devtrack.onrender.com/api/health](https://devtrack.onrender.com/api/health)

---

## 📑 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [High-Level Design (HLD)](#-high-level-design-hld)
3. [Low-Level Design (LLD)](#-low-level-design-lld)
4. [Project Structure](#-project-structure)
5. [Getting Started](#-getting-started)
6. [Environment Variables](#-environment-variables)
7. [Core Modules & Features](#-core-modules--features)
8. [API Reference](#-api-reference)
9. [Performance & Security](#-performance--security)
10. [Deployment (Vercel + Render)](#-deployment-vercel--render)
11. [Testing & CI/CD](#-testing--cicd)
12. [Team & License](#-team--license)

---

## 🛠 Tech Stack

| Layer                  | Technologies                                                      | Purpose                                                                 |
| :--------------------- | :---------------------------------------------------------------- | :---------------------------------------------------------------------- |
| **Frontend Framework** | **React 18 + Vite 5**                                             | High-performance SPA with route-level code splitting (`React.lazy`)     |
| **UI & Styling**       | **Tailwind CSS 3, Framer Motion 12, GSAP, Lenis**                 | Fluid animations, Tuple-inspired developer ergonomics, smooth scroll    |
| **Authentication**     | **Clerk** (OAuth + Session Management)                            | Multi-tenant auth, instant GitHub OAuth linking, token renew cycle      |
| **Backend API**        | **Node.js 20+ & Express.js 4**                                    | Modular REST API with correlation ID tracing and security middleware    |
| **Database**           | **Firebase Firestore** (Admin SDK)                                | Document store for users, projects, logs, reports, and showcases        |
| **Distributed Cache**  | **Upstash Redis + NodeCache**                                     | Dual-tier caching with stampede protection (`getOrSet`) & atomic quotas |
| **AI & LLM Services**  | **Groq (Llama 3.3 70B)** + **Google Gemini**                      | Deep repository code audits, weekly growth briefs, AI coding mentor     |
| **Integrations**       | **GitHub REST & GraphQL API**, **Stripe**, **Brevo/Resend**       | Commit ingestion, clone traffic, webhook monetization, automated emails |
| **Hosting & CI/CD**    | **Vercel** (Frontend) + **Render** (Backend) + **GitHub Actions** | Global Edge CDN caching, containerized API hosting, automated tests     |

---

## 🏛 High-Level Design (HLD)

DevTrack is built around an **Event-Driven, Micro-Service-Ready Monolith** that decouples user interaction, periodic ingestion, and heavy AI report generation:

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Vercel Edge CDN)"]
        UI["React 18 + Vite SPA"]
        ClerkClient["Clerk Auth Provider"]
        AxiosClient["Axios Client (Token Interceptor & Quota Guard)"]
    end

    subgraph APILayer ["Backend API Layer (Render Web Service)"]
        Gateway["Express API Gateway (Helmet, CORS, Rate Limiters)"]
        AuthMiddleware["Clerk & Firebase Auth Bridge"]
        CacheLayer["2-Tier Cache: Upstash Redis + NodeCache"]

        subgraph Controllers
            PublicCtrl["Public & Telemetry Controller"]
            GitCtrl["GitHub & Repository Controller"]
            InsightsCtrl["AI Insights & Groq Controller"]
            ReportCtrl["Report & PDF Engine"]
            BillingCtrl["Stripe Payment Controller"]
        end
    end

    subgraph DataExternal ["Database & External Services"]
        Firestore[("Firebase Firestore DB")]
        GitHubAPI["GitHub REST & GraphQL API"]
        GroqCluster["Groq Multi-Key Cluster (Llama 3.3)"]
        GeminiAPI["Google Gemini AI"]
        EmailService["Nodemailer / Brevo / Resend"]
    end

    UI --> AxiosClient
    ClerkClient -. Auth Tokens .-> AxiosClient
    AxiosClient -->|HTTPS / REST| Gateway
    Gateway --> AuthMiddleware
    AuthMiddleware --> Controllers
    Controllers <--> CacheLayer

    GitCtrl <-->|OAuth / Read-Only| GitHubAPI
    PublicCtrl <--> Firestore
    InsightsCtrl --> GroqCluster
    InsightsCtrl --> GeminiAPI
    ReportCtrl --> GroqCluster
    ReportCtrl --> EmailService
    BillingCtrl <--> Firestore
```

### Data Flow Overview

1. **User Ingestion**: Developers connect via GitHub OAuth through Clerk. No proprietary source code is ever stored—DevTrack queries only commit hashes, diff metadata, and language distributions.
2. **Telemetry & Caching**: Public telemetry (`/api/public/stats`) checks Redis cache before querying Firestore server-side aggregations (`.count().get()`), avoiding redundant database reads.
3. **Background Sync**: Cron schedulers asynchronously sync repository metrics and generate weekly intelligence briefs with multi-key Groq fallback rotation.

---

## 🔬 Low-Level Design (LLD)

### 1. Database Schema (Firestore Collections)

```
firestore/
├── users/ {userId}
│   ├── githubUsername, email, name, avatarUrl
│   ├── githubAccessToken (encrypted)
│   ├── streak, longestStreak, consistencyScore, dnaScore
│   ├── tier: "free" | "pro" | "trial"
│   └── preferences: { publicProfile, notifications, theme }
├── projects/ {projectId}
│   ├── uid, name, repositoryUrl, isPrivate
│   ├── commits, stars, forks, openIssues
│   ├── technologies: ["React", "Node.js", "Docker"]
│   └── analysis: { riskScore, complexity, nextSteps }
├── reports/ {reportId}
│   ├── userId, createdAt, weekNumber
│   ├── stats: { totalCommits, streak, impactScore }
│   └── aiInsights: { summary, kpis, recommendations }
├── showcases/ {showcaseId}
│   └── featured projects, upvotes, tags, community feedback
└── subscriptions/ {userId}
    └── stripeCustomerId, status, plan, expiresAt
```

### 2. Dual-Tier Cache Strategy (`server/src/config/cache.js`)

DevTrack implements a **Cache-Aside Pattern with Stampede Protection**:

- **Layer 1 (L1)**: In-Memory `NodeCache` (<1ms lookup for hot requests).
- **Layer 2 (L2)**: Distributed `Upstash Redis` (shared state surviving backend cold starts).
- **Atomic Quota Counters**: Managed via `cache.incr()` with automatic TTL expiry to enforce free/pro tier usage guards.

```javascript
// Stampede-Protected Cache Retrieval
const stats = await cache.getOrSet(
    'platform_public_stats',
    async () => {
        return await computeRealPlatformTelemetry();
    },
    600
); // 10 minutes TTL
```

### 3. Multi-Key LLM Failover Engine (`server/src/services/groqService.js`)

To guarantee 100% uptime on free tiers without hitting strict RPM/TPM thresholds, the Groq client operates an automated key-rotation ring:

```
[Request] ──► Key 1 (Primary) ──► 429 Limit? ──► Key 2 ──► Key 3 ──► Key 4 ──► Fallback
```

---

## 📂 Project Structure

```
DevTrack/
├── .github/
│   └── workflows/
│       └── ci.yml                ← Automated GitHub Actions CI test/build pipeline
├── client/                       ← React 18 + Vite Frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/           ← Reusable UI & Layout Components
│   │   │   ├── common/           ← Modals, CommandPalette, UpgradePrompt
│   │   │   ├── dashboard/        ← Metric cards, heatmaps, streak charts
│   │   │   ├── layout/           ← Navbar, Sidebar, AppLayout
│   │   │   └── ui/               ← Primitives (Buttons, Badges, Loaders)
│   │   ├── pages/                ← Route Views (Code-Split via React.lazy)
│   │   │   ├── Landing.jsx       ← Real-time telemetry landing page
│   │   │   ├── Dashboard.jsx     ← Personal engineering analytics hub
│   │   │   ├── Projects.jsx      ← Repository sync & AI inspection
│   │   │   ├── GitHubInsights.jsx← Deep commit velocity & DNA scoring
│   │   │   ├── ResumeBuilder.jsx ← ATS-ready developer resume export
│   │   │   └── Showcase.jsx      ← Community project discovery
│   │   ├── services/
│   │   │   └── api.js            ← Axios client + Clerk Auth Interceptor
│   │   ├── App.jsx               ← Root router with Suspense boundary
│   │   └── main.jsx
│   ├── vercel.json               ← Edge routing & 1-year immutable caching
│   └── vite.config.js            ← Manual vendor chunking & dev proxy
│
├── server/                       ← Express.js REST API Backend
│   ├── src/
│   │   ├── config/               ← Firebase Admin, Redis, Cache, Constants
│   │   ├── controllers/          ← Route business logic & DB operations
│   │   │   ├── authController.js
│   │   │   ├── githubController.js
│   │   │   ├── insightsController.js
│   │   │   ├── publicController.js  ← Public profile & /stats telemetry
│   │   │   └── reportController.js
│   │   ├── middleware/           ← Security: Helmet, RateLimiter, QuotaGuard, Sanitize
│   │   ├── routes/               ← Express route declarations
│   │   ├── services/             ← GitHub API, Groq AI, Gemini, Email, Stripe
│   │   └── utils/                ← Logger, Scheduler, Response helpers
│   ├── tests/
│   │   └── api.test.js           ← Automated integration & unit test suite
│   ├── server.js                 ← Server entrypoint & graceful shutdown handlers
│   └── Dockerfile                ← Container definition for cloud deployment
│
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm**
- A **Firebase Project** (Firestore enabled)
- A **Clerk Account** (GitHub OAuth social login enabled)
- A **GitHub Personal Access Token** (optional for higher rate limits)

---

### Installation & Local Run

#### 1. Clone the repository

```bash
git clone https://github.com/Vortex-16/DevTrack.git
cd DevTrack
```

#### 2. Install dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

#### 3. Setup Environment Variables

Create `.env` in both `/server` and `/client` directories using the tables below.

#### 4. Run Locally

Open two terminal windows:

```bash
# Terminal 1 — Start Backend Server (runs on http://localhost:9000)
cd server
npm run dev

# Terminal 2 — Start Frontend Client (runs on http://localhost:5173)
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🔐 Environment Variables

### Server (`server/.env`)

```env
# Server Runtime
NODE_ENV=development
PORT=9000
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...-----END PRIVATE KEY-----\n"

# Distributed Cache (Upstash Redis)
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# AI Providers
GROQ_API_KEY=gsk_...
GROQ_PDF_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...

# GitHub Integration
GITHUB_PAT=ghp_...
GITHUB_TOKEN_ENCRYPTION_SECRET=your-32-byte-hex-secret

# Payments & Billing (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Client (`client/.env`)

```env
VITE_API_URL=/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

---

## 🌟 Core Modules & Features

### 1. Real-Time Telemetry & Stats Engine

- Aggregates live GitHub Stars ([Vortex-16/DevTrack](https://github.com/Vortex-16/DevTrack)) via REST API with fallback resilience.
- Counts real commits analyzed across all user projects using Firestore `.select('commits')` field masking.
- Computes habit consistency scores from weekly telemetry reports.

### 2. GitHub Velocity & DNA Score

- Ingests user commit volumes, Pull Request turnaround times, and streak distribution.
- Computes the **GitHub DNA Score (0–100)** measuring algorithmic code velocity, contribution rhythm, and code hygiene.

### 3. AI Repository Inspection & Growth Reports

- Powered by **Llama 3.3 (Groq)**: Analyzes repositories for security red flags, architectural complexity hotspots, and actionable next steps.
- Automated weekly performance digests delivered in high-fidelity PDF format with clean metrics breakdown.

### 4. Interactive AI Pair-Programming Assistant

- Context-aware chatbot powered by **Google Gemini** tailored exclusively for programming mentoring, debugging advice, and project roadmap guidance.

---

## 📡 API Reference

| Method | Endpoint                        | Access                | Description                                                     |
| :----- | :------------------------------ | :-------------------- | :-------------------------------------------------------------- |
| `GET`  | `/api/health`                   | Public                | System status, version & timestamp                              |
| `GET`  | `/api/public/stats`             | Public (Rate Limited) | Real platform telemetry (stars, commits, developers, retention) |
| `GET`  | `/api/public/profile/:username` | Public                | Public developer portfolio with verified skills                 |
| `GET`  | `/api/github/repos`             | Protected             | Fetches synced repositories and commit history                  |
| `POST` | `/api/insights/productivity`    | Protected             | AI-powered 30/90-day productivity trend analysis                |
| `GET`  | `/api/reports/history`          | Protected             | Retrieves weekly PDF growth report archive                      |
| `POST` | `/api/payments/create-session`  | Protected             | Initializes Stripe checkout for Pro tier upgrade                |
| `POST` | `/api/payments/webhook`         | Stripe Only           | Webhook listener for subscription life-cycle                    |

---

## 🛡 Performance & Security

- **Strict CSP & Security Headers**: Enforced via `helmet` with custom directives and `nosniff`, `DENY` framing rules.
- **Dedicated Sub-Rate Limiters**:
    - `General API`: 2000 req / 15 min
    - `Public Telemetry`: 60 req / 15 min (prevents cache churn)
    - `AI Endpoints`: 100 req / 15 min (prevents token abuse)
- **Firestore Cost Minimization**: Uses native `.count().get()` aggregations (charges 1 read per 1,000 docs) to keep operations well within the free tier.
- **Frontend Code Splitting**: All authenticated pages use `React.lazy()` + `Suspense`, dropping initial JavaScript payload from **2.29 MB to < 150 KB**.

---

## 🚀 Deployment (Vercel + Render)

### 1. Frontend on Vercel

1. Import repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Set Framework to **Vite**.
4. Configure Environment Variables: `VITE_API_URL` (points to your Render API), `VITE_CLERK_PUBLISHABLE_KEY`.
5. Deploy. `client/vercel.json` will automatically configure SPA rewrite rules and immutable edge caching.

### 2. Backend on Render

1. Create a new **Web Service** on [Render](https://render.com) pointing to `Vortex-16/DevTrack`.
2. Set **Root Directory** to `server`.
3. Set **Build Command**: `npm install`.
4. Set **Start Command**: `node server.js`.
5. Add server environment variables.
6. _(Free-Tier Tip)_: To eliminate Render's 15-minute cold sleep, add a free monitor on [UptimeRobot](https://uptimerobot.com) pinging `https://your-api.onrender.com/api/health` every 10 minutes.

---

## 🧪 Testing & CI/CD

DevTrack includes an automated integration test suite using Node's native test runner (`node:test` and `node:assert/strict`):

```bash
# Run server test suite
cd server
npm test
```

### GitHub Actions Pipeline

Every push or pull request to `main` automatically triggers `.github/workflows/ci.yml`:

- ✅ Installs server dependencies & executes integration test suite.
- ✅ Installs client dependencies & verifies Vite production build.

---

## 👥 Authors & Team

Developed with ❤️ by **Alpha Coders**:

- **Vikash Gupta** ([@Vortex-16](https://github.com/Vortex-16)) — _Full Stack & AI Architect_
- **Ayush Chowdhury** ([@AyushChowdhuryCSE](https://github.com/AyushChowdhuryCSE)) — _Product & Developer Workflows_
- **Rajdeep Das** ([@yourajdeep](https://github.com/yourajdeep)) — _UI/UX & Design Systems_

---

## 📄 License

DevTrack is open-source software licensed under the **[MIT License](LICENSE)**.
