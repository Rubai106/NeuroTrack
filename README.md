# NeuroTrack — AI Study Optimization System

> A production-quality, full-stack MERN application for serious students. Track sessions, detect weaknesses, predict exam readiness, and get AI-powered study coaching — built with clean architecture and a calm, human-centered design.

---

## ✨ Features

### Core
| Feature | Description |
|---|---|
| **Study Session Tracker** | Log sessions with subject, topic, duration, difficulty, mood & focus quality |
| **Pomodoro Timer** | 25/5 timer with long-break cycle, mode tabs, and SVG progress ring |
| **Smart Analytics** | 14-day chart, subject distribution, GitHub-style heatmap, best study time detection |
| **Burnout Detection** | Auto-detects declining focus quality over consecutive days |
| **Weakness Analyzer** | Log quiz results → ranked weak topics with weighted weakness scores |
| **AI Study Coach** | Intent-routing chat that knows your weaknesses, streak, and goals |
| **Goal System** | Daily / weekly / monthly / exam goals with adaptive progress tracking |
| **Prediction Engine** | Formula-based exam readiness score (0–100) + grade prediction |
| **Notes Organizer** | Color-coded, pinnable cards with tag search and markdown content |
| **Gamification** | XP system, 10 unlockable badges, level progression, streak tracking |

### New in v2
| Feature | Description |
|---|---|
| **🧠 Smart Insights Feed** | Rule-based daily insights: best day patterns, focus drops, overconfidence detection, momentum shifts, neglected subjects |
| **📋 Daily Study Brief** | Morning plan: what to study, when to study, goal status — generated fresh each day |
| **🔁 Review Queue** | Top 3 topics to review today, ranked by spaced-repetition urgency, one-click complete |
| **🔥 Focus Flow Mode** | Full-screen distraction-free session with Web Audio ambient sounds (rain/forest/café), interruption tracking, and post-session summary card |
| **📈 Confidence Graph** | Radar chart comparing self-rated confidence vs quiz-based mastery — flags overconfidence and underestimated topics |
| **⌨️ Command Palette** | `Cmd/Ctrl+K` quick navigation with keyboard arrows, fuzzy search across all pages |

---

## 🏗 Tech Stack

```
Frontend          Backend           Database
─────────────     ─────────────     ──────────
React 18          Node.js           MongoDB
Vite              Express           Mongoose
Tailwind CSS      JWT auth
Recharts          bcryptjs
React Router 6    morgan + helmet
date-fns          rate-limiting
lucide-react
react-hot-toast
```

---

## 📁 Project Structure

```
neurotrack/
├── client/src/
│   ├── components/
│   │   ├── layout/         AppLayout (sidebar + mobile nav)
│   │   ├── charts/         ConfidenceGraph (radar)
│   │   └── ui/             Modal, Spinner, ProgressBar, PomodoroTimer,
│   │                       EmptyState, CommandPalette, DailyBrief,
│   │                       InsightsFeed, ReviewQueue
│   ├── context/            AuthContext (JWT state)
│   ├── hooks/              useApi
│   ├── pages/
│   │   ├── Auth/           Login, Register
│   │   ├── Dashboard/      Overview (brief + insights + review queue + chart)
│   │   ├── Sessions/       Session log + Pomodoro modal
│   │   ├── FocusFlow/      Full-screen deep work mode
│   │   ├── Analytics/      Charts, heatmap, burnout, best times
│   │   ├── Goals/          CRUD goals + progress modal
│   │   ├── Notes/          Color cards, pin, full-text search
│   │   ├── Weakness/       Ranked list + Confidence Graph tab
│   │   ├── Coach/          Chat interface (intent-based AI)
│   │   ├── Gamification/   XP ring, badges, streak stats
│   │   └── Predictions/    Readiness ring + breakdown bars
│   └── services/           api.js (all endpoints)
│
└── server/src/
    ├── controllers/        Thin route handlers
    ├── services/
    │   ├── analyticsService.js      Aggregation pipelines
    │   ├── insightsService.js       Rule-based insights engine (NEW)
    │   ├── gamificationService.js   XP, badges, streaks
    │   ├── predictionService.js     Formula-based readiness
    │   ├── weaknessService.js       Quiz scoring + ranking
    │   └── coachService.js          Intent-routing coach
    ├── models/             User, StudySession, Goal, Note, WeaknessEntry
    ├── routes/             9 Express routers
    ├── middleware/         protect (JWT), errorHandler (AppError)
    ├── config/             database.js
    └── seeds/              60 days of realistic demo data
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)

### 1. Clone & Install

```bash
git clone <your-repo>
cd neurotrack
npm run install:all
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
# Edit server/.env — defaults work for local MongoDB
```

### 3. Seed Demo Data

```bash
npm run seed
```

Loads a full demo account: 60 days of sessions, goals, notes, and weakness entries.

```
Login:    demo@neurotrack.app
Password: demo123
```

### 4. Start

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Open command palette |
| `↑ ↓` | Navigate palette results |
| `Enter` | Go to selected page |
| `Escape` | Close palette / modal |

---

## 🔌 API Reference

All routes require `Authorization: Bearer <token>` except `/auth/register` and `/auth/login`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login → JWT |
| GET | `/auth/me` | Current user |
| PUT | `/auth/profile` | Update profile / exam date |

### Sessions
| Method | Path | Description |
|---|---|---|
| GET | `/sessions` | List (paginated, filterable by subject/date) |
| GET | `/sessions/today` | Today's sessions |
| POST | `/sessions` | Create (awards XP + updates streak) |
| PUT | `/sessions/:id` | Update |
| DELETE | `/sessions/:id` | Delete |

### Analytics
| Method | Path | Description |
|---|---|---|
| GET | `/analytics/dashboard` | Today/week/month stats |
| GET | `/analytics/charts?days=30` | Study hours + subject split |
| GET | `/analytics/heatmap` | 12-month activity |
| GET | `/analytics/best-time` | Peak focus hours |
| GET | `/analytics/burnout` | Declining focus detection |
| GET | `/analytics/insights` | Smart insights feed (NEW) |
| GET | `/analytics/brief` | Daily study brief (NEW) |
| GET | `/analytics/review-queue` | Spaced repetition queue (NEW) |

### Goals
| Method | Path | Description |
|---|---|---|
| GET | `/goals` | List goals |
| POST | `/goals` | Create goal |
| PUT | `/goals/:id` | Update |
| PUT | `/goals/:id/progress` | Add study minutes |
| DELETE | `/goals/:id` | Delete |

### Weakness
| Method | Path | Description |
|---|---|---|
| GET | `/weakness` | Ranked weak topics |
| POST | `/weakness/quiz` | Log quiz result |
| DELETE | `/weakness/:id` | Remove entry |

### Other
| Method | Path | Description |
|---|---|---|
| GET | `/notes` | List (search, filter) |
| POST, PUT, DELETE | `/notes/:id` | CRUD |
| GET | `/predictions` | Exam readiness + grade |
| GET | `/gamification` | XP, level, badges |
| POST | `/profile/coach` | Chat with AI coach |

---

## 🧠 Core Formulas

```js
// Weakness Score (0–100)
weaknessScore = errorRate × 60 + studyPenalty × 40
// where: errorRate = wrongAttempts / totalAttempts
//        studyPenalty = max(0, 1 − studyHours / 10)

// Review Urgency (spaced repetition)
urgency = errorRate × 40 + studyPenalty × 30 + min(daysSinceReview × 2, 30)

// Productivity Score per session (0–100)
productivityScore = (focusQuality / 10) × (1 − distractionRate) × 100

// Exam Readiness (0–100)
readiness = consistency   × 0.30   // streak + session frequency
          + studyHours    × 0.25   // 60h/month = 100%
          + weaknessCover × 0.25   // fewer critical topics = higher
          + focusQuality  × 0.20   // avg focus / 10

// Smart Insight: Overconfidence
if (confidenceScore − masteryScore > 25) → flag as overconfident
if (masteryScore − confidenceScore > 25 && accuracy > 75%) → flag as underestimated
```

---

## 🧠 Smart Insights Engine

The insights service (`insightsService.js`) generates up to 6 daily insights from pure data analysis — no external AI:

| Insight | Logic |
|---|---|
| Best day of week | Compares avg duration × focus per weekday |
| Focus drops after 9 PM | Late sessions vs overall focus average |
| Consistency warning | < 3 study days in last 7 |
| Short session pattern | > 50% sessions under 20 minutes |
| Skip revision | No `review` session type in 4+ days |
| Overconfidence | confidenceScore > 70 but errorRate > 40% |
| Underconfidence | confidenceScore < 40 but accuracy > 75% |
| Momentum up/down | Week-over-week study time change > 20% |
| Neglected subjects | Subject studied 10+ days ago |
| Streak praise/warning | 7+ day streak or 2+ day gap |

---

## 🎨 Design System

- **Font**: DM Sans (UI) · DM Mono (timer, code)
- **Background**: `#F7F7F5` warm off-white
- **Accent**: Sage green `#4e844e` — calm, focused
- **Dark mode (Focus Flow only)**: `#0f1117` — no distractions
- **Philosophy**: Notion-level whitespace, Linear-level keyboard control, Apple-level restraint

---

## 🏆 Gamification

| Badge | Unlock condition |
|---|---|
| 🎯 First Step | Log first session |
| 🌱 Getting Started | 3-day streak |
| 🔥 Week Warrior | 7-day streak |
| ⚡ Iron Discipline | 30-day streak |
| 📚 Dedicated | 10+ total study hours |
| 🎓 Scholar | 50+ total study hours |
| 🍅 Tomato Master | 10 Pomodoros completed |
| ✅ Goal Getter | 5 completed goals |
| 📝 Knowledge Base | 10 notes created |
| 🧠 Deep Worker | One 90+ minute session |

---

## 🔧 Extending

- **Real AI Coach**: Replace `coachService.js` intent logic with an LLM call — the interface is already abstracted
- **Mobile**: Add `manifest.json` — the responsive layout is PWA-ready
- **Notifications**: Add `node-cron` for daily brief emails — the brief data is already generated
- **Dark mode**: Tailwind `dark:` variants + `localStorage` preference — skeleton is in place

---

## 📦 Deployment

**Backend** (Railway, Render, Fly.io):
```
MONGODB_URI = mongodb+srv://...atlas connection...
JWT_SECRET  = <long random string>
CLIENT_URL  = https://your-frontend.vercel.app
NODE_ENV    = production
```

**Frontend** (Vercel, Netlify):
```
# If deploying separately, update api.js baseURL:
baseURL: import.meta.env.VITE_API_URL || '/api'
```
