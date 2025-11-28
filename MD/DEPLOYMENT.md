# Deployment Guide

This guide covers deploying the Tedit application with frontend on Vercel and backend on Railway.

## Overview

- **Frontend (Next.js)**: Deploy to Vercel
- **Backend (WebSocket Server)**: Deploy to Railway (or similar Node.js hosting)

## Prerequisites

- GitHub account
- Vercel account ([vercel.com](https://vercel.com))
- Railway account ([railway.app](https://railway.app))
- Git repository with your code

---

## Part 1: Deploy Backend to Railway

Railway is used for the backend because it supports long-running processes (WebSocket server) that Vercel doesn't support.

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect the project structure

### Step 2: Configure Backend Service

1. In Railway dashboard, click **"New Service"**
2. Select **"GitHub Repo"** and choose your repository
3. Railway will detect multiple services - you need to configure it for the backend

### Step 3: Set Root Directory

1. Click on your service
2. Go to **Settings** tab
3. Under **"Root Directory"**, set it to: `backend`
4. Save changes

### Step 4: Configure Build Settings

1. In **Settings** → **"Build Command"**, set:
   ```bash
   npm install
   ```
2. In **Settings** → **"Start Command"**, set:
   ```bash
   npm start
   ```
   Or if using tsx directly:
   ```bash
   npx tsx src/index.ts
   ```

### Step 5: Set Environment Variables

Go to **Variables** tab and add:

```
PORT=3001
HOSTNAME=0.0.0.0
FRONTEND_ORIGIN=https://your-app.vercel.app
```

**Note:** You'll update `FRONTEND_ORIGIN` after deploying the frontend.

### Step 6: Deploy

1. Railway will automatically deploy when you push to your main branch
2. Or click **"Deploy"** manually
3. Wait for deployment to complete
4. Railway will provide a URL like: `https://your-backend.up.railway.app`

### Step 7: Get Backend URL

1. After deployment, go to **Settings** → **"Networking"**
2. Railway provides a public URL (e.g., `https://your-backend.up.railway.app`)
3. Copy this URL - you'll need it for the frontend

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will detect it's a Next.js project

### Step 2: Configure Project Settings

1. **Framework Preset**: Should auto-detect as "Next.js"
2. **Root Directory**: Set to `frontend`
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)
5. **Install Command**: `npm install` (default)

### Step 3: Set Environment Variables

Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_WS_URL=https://your-backend.up.railway.app
```

Replace `your-backend.up.railway.app` with your actual Railway backend URL.

**Important:** 
- Use `https://` (not `http://`) for production
- Don't include a port number (Railway handles that)
- The URL should be the base URL without `/ws` or paths

### Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Wait for deployment to complete (usually 2-3 minutes)
4. Vercel will provide a URL like: `https://your-app.vercel.app`

### Step 5: Update Backend CORS

After getting your Vercel URL:

1. Go back to Railway dashboard
2. Update the `FRONTEND_ORIGIN` environment variable:
   ```
   FRONTEND_ORIGIN=https://your-app.vercel.app
   ```
3. Railway will automatically redeploy with the new CORS settings

---

## Part 3: Verify Deployment

### Test Frontend

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Create a new document
3. Draw something on the canvas
4. Open the same document in another browser/incognito window
5. You should see the drawing appear in real-time

### Test Backend Connection

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. You should see: `"Connected to real-time server"`
4. If you see connection errors, check:
   - `NEXT_PUBLIC_WS_URL` is set correctly in Vercel
   - Backend is running on Railway
   - CORS settings allow your Vercel domain

### Debugging

**Frontend can't connect to backend:**
- Check `NEXT_PUBLIC_WS_URL` in Vercel environment variables
- Verify Railway backend is running (check Railway logs)
- Ensure Railway URL uses `https://` not `http://`

**CORS errors:**
- Verify `FRONTEND_ORIGIN` in Railway matches your Vercel URL exactly
- Include `https://` protocol in the URL
- No trailing slash

**Canvas not syncing:**
- Check browser console for WebSocket errors
- Verify both services are deployed and running
- Check Railway logs for backend errors

---

## Alternative Deployment Options

### Backend Alternatives to Railway

**Fly.io:**
- Similar to Railway, supports long-running processes
- Good for WebSocket servers
- [fly.io](https://fly.io)

**Render:**
- Free tier available
- Supports WebSocket
- [render.com](https://render.com)

**DigitalOcean App Platform:**
- More control, slightly more complex
- [digitalocean.com](https://www.digitalocean.com)

**AWS/GCP/Azure:**
- For production at scale
- More setup required

### Frontend Alternatives to Vercel

**Netlify:**
- Similar to Vercel
- Good Next.js support
- [netlify.com](https://netlify.com)

**AWS Amplify:**
- For AWS ecosystem
- Good CI/CD integration

**Self-hosted:**
- VPS (DigitalOcean, Linode, etc.)
- Requires server management

---

## Environment Variables Summary

### Frontend (Vercel)

```
NEXT_PUBLIC_WS_URL=https://your-backend.up.railway.app
```

### Backend (Railway)

```
PORT=3001
HOSTNAME=0.0.0.0
FRONTEND_ORIGIN=https://your-app.vercel.app
```

---

## Continuous Deployment

Both Vercel and Railway support automatic deployments:

- **Vercel**: Automatically deploys on push to main branch
- **Railway**: Automatically deploys on push to main branch (if configured)

To disable auto-deploy:
- **Vercel**: Settings → Git → Configure production branch
- **Railway**: Settings → Source → Auto Deploy

---

## Production Checklist

- [ ] Backend deployed on Railway (or alternative)
- [ ] Frontend deployed on Vercel
- [ ] `NEXT_PUBLIC_WS_URL` set in Vercel
- [ ] `FRONTEND_ORIGIN` set in Railway
- [ ] Both services using HTTPS
- [ ] CORS configured correctly
- [ ] Tested real-time collaboration
- [ ] Tested canvas persistence
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active (automatic on Vercel/Railway)

---

## Troubleshooting

### Railway Backend Issues

**Build fails:**
- Check `package.json` in `backend/` folder
- Verify Node.js version (Railway auto-detects, but can be set in `package.json`)

**Server won't start:**
- Check Railway logs
- Verify `PORT` environment variable
- Ensure start command is correct

**WebSocket not working:**
- Verify Railway provides HTTPS URL
- Check that port is not blocked
- Verify `HOSTNAME=0.0.0.0` is set

### Vercel Frontend Issues

**Build fails:**
- Check Next.js version compatibility
- Verify all dependencies in `frontend/package.json`
- Check build logs in Vercel dashboard

**Environment variables not working:**
- Variables starting with `NEXT_PUBLIC_` are required for client-side access
- Redeploy after adding new variables
- Check variable names are exact (case-sensitive)

**WebSocket connection fails:**
- Verify `NEXT_PUBLIC_WS_URL` is set correctly
- Check browser console for connection errors
- Ensure backend URL is accessible

---

## Cost Estimates

### Vercel (Frontend)
- **Hobby Plan**: Free
  - Unlimited personal projects
  - 100GB bandwidth/month
  - Perfect for development and small projects

- **Pro Plan**: $20/month
  - Team collaboration
  - More bandwidth
  - Analytics

### Railway (Backend)
- **Hobby Plan**: Pay-as-you-go
  - $5/month credit
  - ~$0.000463/GB RAM-hour
  - ~$0.000231/GB storage-month
  - WebSocket server typically costs $2-5/month

- **Pro Plan**: $20/month
  - $20 credit included
  - Better support

**Estimated Total**: ~$5-10/month for small projects

---

## Next Steps After Deployment

1. Set up custom domains (optional)
2. Configure monitoring/analytics
3. Set up error tracking (Sentry, etc.)
4. Configure database for production (replace in-memory storage)
5. Set up authentication (Better Auth)
6. Configure CDN for static assets
7. Set up backup strategy for canvas data

---

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

