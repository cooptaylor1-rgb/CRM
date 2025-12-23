# 🚂 Railway Deployment Guide

## Quick Start - Deploy CRM to Railway

This guide will help you deploy the Wealth Management CRM to Railway with PostgreSQL and Redis.

---

## Prerequisites

1. [Railway Account](https://railway.app/) (free tier available)
2. [Railway CLI](https://docs.railway.app/develop/cli) (optional but recommended)
3. GitHub repository with this code pushed

---

## Option 1: One-Click Deploy (Recommended)

### Step 1: Create a New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select this repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "Add PostgreSQL"**
3. Railway will automatically provision a PostgreSQL database

### Step 3: Add Redis (Optional - for caching/queues)

1. Click **"+ New"**
2. Select **"Database" → "Add Redis"**
3. Railway will provision Redis

### Step 4: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start:prod`

4. Add environment variables (Settings → Variables):

```env
NODE_ENV=production
PORT=3001
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_SSL=true
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-min-32
REFRESH_TOKEN_EXPIRES_IN=7d
```

5. Generate domain: **Settings → Networking → Generate Domain**

### Step 5: Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select the same repository
3. Configure the service:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

4. Add environment variables:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
```

5. Generate domain: **Settings → Networking → Generate Domain**

### Step 6: Update Backend CORS

Go back to Backend service and add:
```env
FRONTEND_URL=https://your-frontend-domain.railway.app
```

---

## Option 2: Railway CLI Deployment

### Install Railway CLI

```bash
# macOS
brew install railway

# npm (any platform)
npm install -g @railway/cli

# Or download from https://railway.app/cli
```

### Login and Deploy

```bash
# Login to Railway
railway login

# Create new project
railway init

# Link to existing project (if already created)
railway link

# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
railway up
```

---

## Database Setup

### Initialize Database Schema

After PostgreSQL is running, you need to run the database schema:

#### Option A: Railway Shell
1. Go to your PostgreSQL service
2. Click **"Connect"** → **"Query"**
3. Copy contents of `database/schemas/schema.sql` and run

#### Option B: Using psql
```bash
# Get connection string from Railway PostgreSQL service
railway connect postgres

# Or use psql directly
psql "postgresql://user:pass@host:port/railway" -f database/schemas/schema.sql
```

#### Option C: Through Backend Migrations
```bash
# Connect to backend service shell
railway run --service backend npm run migration:run
```

---

## Environment Variables Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3001` |
| `DB_HOST` | PostgreSQL host | `${{Postgres.PGHOST}}` |
| `DB_PORT` | PostgreSQL port | `${{Postgres.PGPORT}}` |
| `DB_USER` | PostgreSQL user | `${{Postgres.PGUSER}}` |
| `DB_PASSWORD` | PostgreSQL password | `${{Postgres.PGPASSWORD}}` |
| `DB_NAME` | Database name | `${{Postgres.PGDATABASE}}` |
| `DB_SSL` | Enable SSL | `true` |
| `JWT_SECRET` | JWT signing secret | 32+ character string |
| `JWT_EXPIRES_IN` | Token expiry | `15m` |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | 32+ character string |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh expiry | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-frontend.railway.app` |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://your-backend.railway.app` |

---

## Troubleshooting

### Build Fails

1. Check build logs in Railway dashboard
2. Ensure `package-lock.json` is committed
3. Verify Node.js version compatibility (needs 18+)

### Database Connection Issues

1. Ensure PostgreSQL service is running
2. Check if `DB_SSL=true` is set for Railway PostgreSQL
3. Verify environment variables are using Railway references (`${{Postgres.XXX}}`)

### CORS Errors

1. Ensure `FRONTEND_URL` is set correctly in backend
2. Include the full URL with `https://`
3. Check backend logs for CORS-related errors

### Frontend Can't Connect to Backend

1. Verify `NEXT_PUBLIC_API_URL` points to correct backend URL
2. Ensure backend has a public domain generated
3. Check if backend health endpoint works: `https://backend-url/api/health`

---

## Monitoring & Logs

### View Logs
- Click on any service → **"Logs"** tab
- Real-time logs stream automatically

### Metrics
- Railway provides CPU, Memory, and Network metrics
- Available under service **"Metrics"** tab

### Health Check
Backend health endpoint: `GET /api/health`

---

## Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage
- Resource usage: ~$0.000463/minute for compute

Estimated monthly cost for this CRM:
- Backend: ~$5-15/month
- Frontend: ~$5-15/month  
- PostgreSQL: ~$5-10/month
- Redis: ~$5/month
- **Total**: ~$20-45/month for a small deployment

---

## Production Checklist

- [ ] Strong JWT secrets (32+ characters, randomly generated)
- [ ] PostgreSQL SSL enabled
- [ ] CORS configured correctly
- [ ] Database schema initialized
- [ ] Health checks passing
- [ ] Custom domain configured (optional)
- [ ] Monitoring/alerting set up

---

## Support

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- CRM Issues: Open a GitHub issue
