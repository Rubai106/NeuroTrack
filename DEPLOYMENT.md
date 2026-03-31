# NeuroTrack Deployment Guide

## 🚀 Deployment Architecture

- **Frontend**: Vercel
- **Backend**: Render  
- **Database**: MongoDB Atlas

---

## 📋 Step 1: Backend Deployment (Render)

### 1.1 Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub

### 1.2 Create New Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `neurotrack-api`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 1.3 Set Environment Variables
In Render dashboard → Settings → Environment Variables:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://saminyeasarrubai123_db_user:5050rubai@cluster0.xwfwgg0.mongodb.net/neurotrack?appName=Cluster0
JWT_SECRET=6debd9a37f1ff22c1ada5cee6dd12dd77fea86afc320e08a3e72d04426822733
CLIENT_URL=https://your-frontend-domain.vercel.app
```

### 1.4 Deploy
- Click "Create Web Service"
- Wait for deployment (2-3 minutes)
- Copy your backend URL: `https://neurotrack-api.onrender.com`

---

## 📋 Step 2: Frontend Deployment (Vercel)

### 2.1 Create Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub

### 2.2 Import Project
1. Click "New Project"
2. Select your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.3 Set Environment Variables
In Vercel project → Settings → Environment Variables:
```env
VITE_API_URL=https://neurotrack-api.onrender.com/api
```

### 2.4 Update vercel.json
Replace `your-backend-url.onrender.com` with your actual Render URL:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://neurotrack-api.onrender.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "VITE_API_URL": "https://neurotrack-api.onrender.com/api"
  }
}
```

### 2.5 Deploy
- Click "Deploy"
- Wait for deployment (1-2 minutes)

---

## 📋 Step 3: Final Configuration

### 3.1 Update CLIENT_URL on Render
Go back to Render → Settings → Environment Variables:
```env
CLIENT_URL=https://your-frontend-domain.vercel.app
```
Replace with your actual Vercel URL.

### 3.2 Test Everything
1. **Backend Health**: `https://neurotrack-api.onrender.com/api/health`
2. **Frontend**: Visit your Vercel URL
3. **Login**: Try `demo@neurotrack.app` / `demo123`

---

## 🔧 Troubleshooting

### Backend Issues:
- Check Render logs for errors
- Verify MongoDB connection
- Ensure all environment variables are set

### Frontend Issues:
- Check Vercel build logs
- Verify API URL is correct
- Check browser console for errors

### Common Problems:
1. **CORS**: Should be fixed with our production setup
2. **Database**: Ensure MongoDB allows connections from Render
3. **Environment Variables**: Double-check all values

---

## 🎯 Success Indicators

- Backend health check returns: `{"status":"ok","environment":"production","database":"connected"}`
- Frontend loads without errors
- Login works with demo credentials
- Dashboard displays properly

---

## 📱 URLs After Deployment

- **Backend**: `https://neurotrack-api.onrender.com`
- **Frontend**: `https://your-app-name.vercel.app`
- **API Health**: `https://neurotrack-api.onrender.com/api/health`
