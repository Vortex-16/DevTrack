# 🚀 DevTrack

**Prove your consistency. Map your growth. Master your craft.**

DevTrack is an AI-enhanced developer ecosystem designed to bridge the gap between learning and building. It provides a centralized platform to track learning streaks, analyze project progress via GitHub integration, and manage growth with intelligent insights.

[Live Demo](https://devtrack-pwkj.onrender.com) • [Project Brief](docs/project-brief.md) • [Alpha Coders](https://github.com/Alpha-Coders)

---

## 🔥 Why DevTrack?

Traditional portfolios show where you _are_. DevTrack shows how you _got there_.

- **Insightful Tracking**: Log learning logs with mood and time metrics.
- **AI-Powered Project Intelligence**: Deep repository analysis using Llama 3.3 to identify **Security Vulnerabilities**, **Complexity Hotspots**, and generate **Actionable Next Steps**.
- **Action-Oriented Dashboard**: A smart interface that prioritizes critical "Warnings" (Security & Complexity) while keeping you forward-looking with "What Next" suggestions.
- **Consistency Engine**: GitHub commit streaks merged with learning streaks.
- **Intelligent Assistant**: Context-aware AI chat that knows your stack and progress.

---

## ✨ Recent Updates (April 2026)

- **GitHub Repo Clone Counter:** Added real-time tracking of repository traffic. DevTrack now monitors total and unique clones for all tracked projects.
- **Comprehensive Feature Roadmap:** Added a detailed status tracking document in the `Project Brief` folder. This catalogs "Done" features (including LeetCode, Showcase, and AI Ideas), identifies "Remaining" gaps, and outlines "Professional Suggestions" for the platform.
- **Enhanced Security via Deferred OAuth Scopes:** DevTrack now only asks for basic GitHub read access on sign-up. Elevated permissions are prompted via a secure modal only when you choose to track private repositories or perform updates on any repository in your account.
- **Premium UI Upgrades:** Restyled UI with Glassmorphism layers, and responsive smooth scroll integrations across the platform for a high-end application aesthetic.
- **Smart Background AI Analysis:** Project repository AI analysis (identifying complexity/vulnerabilities) runs smoothly in the background, updating your dashboards dynamically.
- **AI Project Discovery:** Generate and save custom project ideas tailored to your skill set and difficulty preferences directly from your DevTrack hub.

---

## 🛠 Tech Stack

| Component        | Technology                                        |
| :--------------- | :------------------------------------------------ |
| **Frontend**     | React 18, Vite, Framer Motion, GSAP, Tailwind CSS |
| **Backend**      | Node.js, Express.js                               |
| **Intelligence** | Groq (Llama 3.3), Google Gemini                   |
| **Data & Auth**  | Firebase (Firestore/FCM), Clerk (GitHub OAuth)    |

---

## 📂 Architecture

```text
DevTrack/
├── client/          # Vite + React (Stylized UI/UX)
├── server/          # Node.js + Express (AI & GitHub Integration)
└── docs/            # Documentation & Research
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Vortex-16/DevTrack.git
cd DevTrack
# Install both backend and frontend
cd server && npm install && cd ../client && npm install
```

### 2. Environment Configuration

Create `.env` files in both `/client` and `/server` using the keys below:

- **Server**: `FIREBASE_*`, `CLERK_SECRET_KEY`, `GROQ_API_KEY`, `GITHUB_PAT`
- **Client**: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_FIREBASE_*`

### 3. Launch

```bash
# In /server
npm run dev
# In /client
npm run dev
```

---

## 🗺 Roadmap

- [x] **Phase 1**: Core Tracking (Learning/Projects) & GitHub OAuth
- [x] **Phase 2**: AI Analysis (Repository & Codebase Level)
- [x] **Phase 3**: Notifications & Persistence (FCM/Firestore)
- [x] **Phase 4**: Public Portfolio Sharing & PDF Growth Reports
- [ ] **Phase 5**: Team Collaboration & Peer Review Modules

---

## 👥 The team behind DevTrack

Developed with ❤️ by **Alpha Coders**:
[Ayush Chaudhary](https://github.com/AyushChowdhuryCSE) • [Rajdeep Das](https://github.com/yourajdeep) • [Vikash Gupta](https://github.com/Vortex-16)

---

## 📊 Detailed Contribution Report

### Description
This update includes the creation of a comprehensive **Feature Roadmap & Status Report** within the `Project Brief` folder. The roadmap was built after a deep audit of the server-side controllers and client-side logic to ensure all advanced features (LeetCode, Showcase, Social, Goals) are accurately cataloged.

Fixes # (No specific issue - Feature Documentation)

### Type of change
- [x] New feature (non-breaking change which adds functionality)
- [x] This change requires a documentation update

### How Has This Been Tested?
- [x] **File Verification**: Verified `Feature_Roadmap.md` exists and contains accurate data matched against the current Express controllers.
- [x] **README Sync**: Updated main README to reflect April 2026 updates.

**Test Configuration**:
* OS: Windows
* Workspace: DevTrack
* Engine: AI Codebase Audit

### Checklist:
- [x] My code follows the style guidelines of this project
- [x] I have performed a self-review of my own code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] I have made corresponding changes to the documentation
- [x] My changes generate no new warnings

---

## 📄 License

DevTrack is open-source software licensed under the [MIT License](LICENSE).
