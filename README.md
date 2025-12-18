# 🚀 DevTrack

**Track your developer journey. Prove your consistency. Connect learning to real work.**

DevTrack is a full-stack application that helps developers track their learning progress, document their projects, and build a provable record of consistent growth with AI-powered insights.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-devtrack--pwkj.onrender.com-purple?style=for-the-badge)](https://devtrack-pwkj.onrender.com)

---

## 🎯 What DevTrack Solves

| Problem | Solution |
|---------|----------|
| **Scattered Learning** | Centralized tracking of courses, tutorials, and skills |
| **Invisible Progress** | Visual proof of consistent daily/weekly activity |
| **Disconnected Skills** | Links what you learn → what you build |
| **No Portfolio Proof** | AI-analyzed project progress reports |
| **Forgetting Tasks** | Calendar-based task management with push notifications |

---

## ✨ Core Features

### 📚 Learning Tracker
- Log daily learning sessions with start/end times
- Track what you learned each day
- Tag skills and technologies
- Mood tracking for productivity insights
- Edit and delete log entries

### 🛠️ Project Tracker
- Document projects with GitHub repository links
- **AI-powered project analysis** using Groq (Llama 3.3)
- Automatic language detection from repos
- Progress tracking based on actual code, not just commits
- Support for **private repositories** via OAuth

### 📅 Calendar & Tasks
- Interactive calendar view for task management
- Create, edit, and delete tasks with due dates
- Priority levels (Low, Medium, High)
- Task completion tracking
- Visual indicators for task density per day

### 🔔 Push Notifications (FCM)
- **Firebase Cloud Messaging** integration
- Daily consistency reminders
- Task due date notifications
- Adaptive or fixed-time reminder modes
- Works on desktop and mobile browsers

### 📊 Dashboard
- **Animated pill-shaped navbar** with Framer Motion
- Quick stats overview (streaks, commits, skills)
- **Weekly activity chart** with gradient bars
- **30-day streak grid** visualization
- Recent activity timeline

### 🤖 AI Chat Assistant
- Context-aware coding help
- Access to your project and learning data
- Powered by Groq API with Gemini fallback
- Code review and suggestions

### 🐙 GitHub Integration
- **Private repo access** via user OAuth tokens
- Fetch commits, PRs, issues, and languages
- Analyze repository structure and key files
- Commit pattern analysis (features/fixes/docs/tests)
- Auto-extract technologies from package.json, etc.

### ⚙️ Settings & Preferences
- Notification preferences (adaptive/fixed time)
- Work pattern configuration
- Break detection settings
- Goal tracking

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, React Router, Framer Motion, GSAP |
| **Backend** | Node.js, Express.js |
| **Database** | Firebase Firestore |
| **Authentication** | [Clerk](https://clerk.com) (GitHub OAuth) |
| **AI** | Groq API (Llama 3.3), Google Gemini (fallback) |
| **GitHub API** | Octokit |
| **Notifications** | Firebase Cloud Messaging (FCM) |
| **Styling** | Tailwind CSS |
| **Deployment** | Render (Static Site + Web Service) |

---

## 📁 Project Structure

```
DevTrack/
├── client/                     # React Frontend (Vite)
│   ├── public/
│   │   └── firebase-messaging-sw.js  # FCM Service Worker
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # Button, Card, Badge, etc.
│   │   │   ├── layout/         # AppLayout, Navbar
│   │   │   ├── settings/       # NotificationSettings
│   │   │   └── dashboard/      # Dashboard widgets
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Learning.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── SystemInfo.jsx
│   │   │   └── Landing.jsx
│   │   ├── hooks/              # Custom hooks (useNotifications)
│   │   ├── config/             # Firebase client config
│   │   ├── services/           # API service (Axios)
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                     # Node.js Backend
│   ├── src/
│   │   ├── config/             # Firebase Admin SDK
│   │   ├── controllers/        # Route controllers
│   │   ├── services/           # Business logic (notificationService)
│   │   ├── routes/             # Express routes
│   │   ├── middleware/         # Auth, validation, errors
│   │   └── app.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Firestore + Cloud Messaging
- Clerk account with GitHub OAuth enabled
- Groq API key (and optionally Gemini API key)

### Installation

```bash
# Clone the repository
git clone https://github.com/Vortex-16/DevTrack.git
cd DevTrack

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Setup

**Server `.env`:**
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# GitHub API (PAT for public repos fallback)
GITHUB_PAT=ghp_xxxxxxxxxxxx

# AI - Groq & Gemini
GROQ_API_KEY=gsk_xxxxxxxxxxxx
GEMINI_API_KEY=AIzaxxxxx
```

**Client `.env`:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# Firebase Client SDK (for FCM)
VITE_FIREBASE_API_KEY=AIzaxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
VITE_FIREBASE_VAPID_KEY=BLxxxxxx  # From Firebase Console > Cloud Messaging
```

### Running the Application

```bash
# Start the backend server (from server directory)
npm run dev

# Start the frontend (from client directory)
npm run dev
```

---

## 🌐 Deployment (Render)

### Frontend (Static Site)
1. Create a new Static Site on Render
2. Connect your GitHub repo, set root directory to `client`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add all `VITE_*` environment variables

### Backend (Web Service)
1. Create a new Web Service on Render
2. Connect your GitHub repo, set root directory to `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all server environment variables
6. Set `CORS_ORIGIN` to your frontend URL

---

## 🗺️ Roadmap

- [x] Initial project setup
- [x] Clerk authentication (GitHub OAuth)
- [x] Firebase Firestore integration
- [x] Learning entry CRUD
- [x] Project tracking CRUD
- [x] GitHub API integration
- [x] Private repository support
- [x] AI-powered project analysis
- [x] AI Chat assistant
- [x] Dashboard with stats
- [x] Beautiful landing page with animations
- [x] Streak tracking & contribution heatmaps
- [x] System info documentation page
- [x] Calendar-based task management
- [x] Push notifications (FCM)
- [x] Onboarding flow with preferences
- [x] Deployed to Render
- [ ] Export/share progress reports
- [ ] Mobile app (PWA enhancements)
- [ ] Team collaboration features

---

## 👥 Team

Built by the @Alpha Coders team.
# Ayush Chaudhary
# Rajbeer Saha
# Rajdeep Das
# Vikash Gupta

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ to help developers prove their growth</strong>
</p>

