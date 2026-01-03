# 🚀 DevTrack

**Prove your consistency. Map your growth. Master your craft.**

DevTrack is an AI-enhanced developer ecosystem designed to bridge the gap between learning and building. It provides a centralized platform to track learning streaks, analyze project progress via GitHub integration, and manage growth with intelligent insights.

[Live Demo](https://devtrack-pwkj.onrender.com) • [Project Brief](docs/project-brief.md) • [Alpha Coders](https://github.com/Alpha-Coders)

---

## 🔥 Why DevTrack?

Traditional portfolios show where you *are*. DevTrack shows how you *got there*.

- **Insightful Tracking**: Log learning logs with mood and time metrics.
- **AI-Powered Analysis**: Deep repository analysis using Llama 3.3 to track real progress.
- **Consistency Engine**: GitHub commit streaks merged with learning streaks.
- **Intelligent Assistant**: Context-aware AI chat that knows your stack and progress.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Framer Motion, GSAP, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Intelligence** | Groq (Llama 3.3), Google Gemini |
| **Data & Auth** | Firebase (Firestore/FCM), Clerk (GitHub OAuth) |

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
- [ ] **Phase 4**: Public Portfolio Sharing & PDF Growth Reports
- [ ] **Phase 5**: Team Collaboration & Peer Review Modules

---

## 👥 The team behind DevTrack

Developed with ❤️ by **Alpha Coders**:
[Ayush Chaudhary](https://github.com/AyushChowdhuryCSE) • [Rajbeer Saha](https://github.com) • [Rajdeep Das](https://github.com/yourajdeep) • [Vikash Gupta](https://github.com/Vortex-16)

---

## 📄 License

DevTrack is open-source software licensed under the [MIT License](LICENSE).

