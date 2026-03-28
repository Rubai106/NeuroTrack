# NeuroTrack — AI Study Optimization System

> A professional, full-stack MERN application designed for serious students. Track sessions, detect weaknesses, predict exam readiness, and receive AI-powered study coaching—built with clean architecture and a calm, human-centered design.

---

## ✨ Key Features

- **Study Session Tracker:** Log sessions with details on subject, duration, and focus quality, featuring an integrated Pomodoro timer and distraction-free Focus Flow mode.
- **Smart Analytics:** Gain insights from a 14-day chart, GitHub-style activity heatmaps, and best study time detection. The system auto-detects burnout and focus drop-offs.
- **AI Study Coach & Weakness Analyzer:** Talk to an intent-routing chat assistant that knows your weak topics, derived automatically from your quiz results.
- **Adaptive Goal System:** Manage daily, weekly, and exam goals with predictive readiness scores based on your performance.
- **Daily Briefs & Smart Insights:** Receive auto-generated morning plans and rule-based insights to catch neglect, overconfidence, and momentum shifts.
- **Command Palette:** Navigate instantly with a `Cmd/Ctrl+K` fuzzy-search interface.

---

## 🏗 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, React Router 6
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Security:** JWT Authentication, bcryptjs, helmet, rate-limiting

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally

### 1. Installation

```bash
git clone <your-repo>
cd neurotrack
npm run install:all
```

### 2. Environment Configuration

Copy the example environment file and configure the necessary variables:
```bash
cp server/.env.example server/.env
```

### 3. Seed Demo Data

Load a realistic demo account containing 60 days of sessions, goals, notes, and weakness entries:
```bash
npm run seed
```

**Demo Account Credentials:**
- **Email:** `demo@neurotrack.app`
- **Password:** `demo123`

### 4. Run Locally

Start both the frontend and backend development servers concurrently:
```bash
npm run dev
```
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 📦 Deployment

**Backend (e.g., Railway, Render, Fly.io):**
Ensure the following environment variables are set in your production environment:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<your-secure-secret>
CLIENT_URL=https://your-frontend-url.com
NODE_ENV=production
```

**Frontend (e.g., Vercel, Netlify):**
Set the API base URL in your build environment:
```env
VITE_API_URL=https://your-backend-api.com/api
```
