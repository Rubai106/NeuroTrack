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

### 🔧 Troubleshooting Deployment Issues

**Can't login or register after deployment?**

1. **Check Environment Variables:**
   - Ensure `MONGODB_URI` is correctly set
   - Verify `JWT_SECRET` exists and is secure
   - Set `NODE_ENV=production`

2. **Test Backend Health:**
   ```bash
   curl https://your-backend-url.com/api/health
   ```
   Should return: `{"status":"ok","environment":"production","database":"connected"}`

3. **Check CORS Issues:**
   - The app now allows all origins in production
   - Verify `CLIENT_URL` matches your frontend domain

4. **Manual Demo User Creation:**
   If demo user doesn't exist, run in your deployed environment:
   ```bash
   cd server && npm run ensure-demo
   ```

5. **Database Connection:**
   - Ensure MongoDB cluster allows connections from your deployment platform
   - Check database user permissions
   - Verify connection string format

**Common Issues:**
- Missing `JWT_SECRET` → Login tokens can't be created
- Wrong `MONGODB_URI` → Database connection fails
- CORS restrictions → Frontend can't reach backend
- Demo user not created → Can't login with demo credentials
