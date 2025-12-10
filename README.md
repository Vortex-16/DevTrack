# 🚀 DevTrack

**Track your developer journey. Prove your consistency. Connect learning to real work.**

DevTrack is a full-stack application that helps developers track their learning progress, document their projects, and build a provable record of consistent growth.

---

## 🎯 What DevTrack Solves

| Problem | Solution |
|---------|----------|
| **Scattered Learning** | Centralized tracking of courses, tutorials, and skills |
| **Invisible Progress** | Visual proof of consistent daily/weekly activity |
| **Disconnected Skills** | Links what you learn → what you build |
| **No Portfolio Proof** | Generates shareable progress reports |

---

## ✨ Core Features

### 📚 Learning Tracker
- Log courses, tutorials, books, and documentation
- Track completion percentage and time spent
- Tag skills and technologies learned

### 🛠️ Project Tracker
- Document projects you're building
- Link projects to skills being applied
- Track project milestones and progress

### 📊 Consistency Dashboard
- Daily/weekly/monthly activity heatmaps
- Streak tracking and achievements
- Progress analytics and insights

### 🔗 Learning ↔ Work Connection
- Map learned skills to project implementations
- Visualize the journey from learning to applying
- Generate "proof of growth" reports

### 🐙 GitHub Integration
- Track commits, PRs, and contributions
- Auto-log coding activity from GitHub
- Visualize repository progress
- Contribution heatmaps synced with learning

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React.js, React Router, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose |
| **Authentication** | [Clerk](https://clerk.com) (GitHub Sign-in Only) |
| **GitHub Integration** | GitHub REST API / Octokit |
| **Styling** | CSS3 / Tailwind CSS |

---

## 📁 Project Structure

```
DevTrack/
├── client/                     # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Buttons, Inputs, Cards, etc.
│   │   │   ├── layout/         # Header, Footer, Sidebar
│   │   │   └── features/       # Feature-specific components
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard/
│   │   │   ├── Learning/
│   │   │   ├── Projects/
│   │   │   ├── Analytics/
│   │   │   └── Auth/
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # React Context providers
│   │   ├── services/           # API service functions
│   │   ├── utils/              # Utility functions
│   │   ├── styles/             # Global styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js Backend
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   │   ├── db.js           # Database connection
│   │   │   └── env.js          # Environment variables
│   │   ├── controllers/        # Route controllers
│   │   │   ├── authController.js
│   │   │   ├── learningController.js
│   │   │   ├── projectController.js
│   │   │   └── analyticsController.js
│   │   ├── models/             # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── LearningEntry.js
│   │   │   ├── Project.js
│   │   │   └── Activity.js
│   │   ├── routes/             # Express routes
│   │   │   ├── authRoutes.js
│   │   │   ├── learningRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── middleware/         # Custom middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validation.js
│   │   ├── utils/              # Utility functions
│   │   └── app.js              # Express app setup
│   ├── server.js               # Entry point
│   ├── package.json
│   └── .env.example
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

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

Create `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devtrack
NODE_ENV=development

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# GitHub API
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Running the Application

```bash
# Start the backend server (from server directory)
npm run dev

# Start the frontend (from client directory)
npm run dev
```

---

## 📋 API Endpoints (Planned)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/learning` | Get all learning entries |
| `POST` | `/api/learning` | Add new learning entry |
| `GET` | `/api/projects` | Get all projects |
| `POST` | `/api/projects` | Create new project |
| `GET` | `/api/analytics/dashboard` | Get dashboard stats |

---

## 🗺️ Roadmap

- [x] Initial project setup
- [ ] Clerk authentication (GitHub Sign-in)
- [ ] GitHub API integration
- [ ] Learning entry CRUD
- [ ] Project tracking CRUD
- [ ] Activity logging (auto-sync from GitHub)
- [ ] Dashboard with analytics
- [ ] Streak tracking & contribution heatmaps
- [ ] Export/share progress reports
- [ ] Mobile responsive design

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
