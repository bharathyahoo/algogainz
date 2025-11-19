# AlgoGainz - Production Deployment Guide

**Complete guide for deploying AlgoGainz to production**

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup (PostgreSQL)](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Environment Variables](#environment-variables)
6. [Security Configuration](#security-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ✅ Code Readiness
- [ ] All tests passing (`npm test` in both frontend and backend)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Security vulnerabilities audited (`npm audit`)
- [ ] Environment variables documented
- [ ] Git repository clean (no uncommitted changes)

### ✅ External Services
- [ ] Zerodha Kite Connect API credentials obtained
- [ ] Database provider selected (Railway, Render, Supabase, etc.)
- [ ] Domain name registered (optional)
- [ ] SSL/TLS certificates (handled by hosting providers)

### ✅ Security
- [ ] Strong JWT secret generated (32+ characters)
- [ ] Environment variables secured
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] Security headers configured (Helmet)

---

## Database Setup

### Option 1: Railway (Recommended)

**PostgreSQL on Railway**

1. **Create Account**
   - Go to [Railway.app](https://railway.app/)
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   ```bash
   # Create new project
   # Click "+ New" → "Database" → "PostgreSQL"
   ```

3. **Get Connection String**
   - Click on your database
   - Go to "Connect" tab
   - Copy the `DATABASE_URL` (starts with `postgresql://`)

4. **Example Connection String**
   ```
   postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
   ```

### Option 2: Render.com

1. **Create Database**
   - Dashboard → "+ New" → "PostgreSQL"
   - Choose free tier or paid plan
   - Get connection string from "Internal Database URL"

### Option 3: Supabase

1. **Create Project**
   - [Supabase Dashboard](https://app.supabase.com/)
   - Create new project
   - Database Settings → Connection Pooling
   - Copy "URI" connection string

### Running Migrations

```bash
cd backend

# Set your DATABASE_URL
export DATABASE_URL="postgresql://..."

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Apply performance indices
psql $DATABASE_URL < prisma/migrations/add_performance_indices.sql

# Verify connection
npx prisma studio
```

---

## Backend Deployment

### Option 1: Railway (Recommended)

**Deploy Backend to Railway**

1. **Create New Project**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli

   # Login
   railway login

   # Link to project
   cd backend
   railway link
   ```

2. **Configure Environment**
   ```bash
   # Set environment variables via Railway dashboard
   # Or use CLI:
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your_strong_secret
   railway variables set KITE_API_KEY=your_key
   railway variables set KITE_API_SECRET=your_secret
   railway variables set DATABASE_URL=postgresql://...
   railway variables set ALLOWED_ORIGINS=https://algogainz.vercel.app
   ```

3. **Deploy**
   ```bash
   # Create railway.toml in backend directory
   cat > railway.toml <<EOF
   [build]
   builder = "NIXPACKS"
   buildCommand = "npm install && npm run prisma:generate && npm run build"

   [deploy]
   startCommand = "npm start"
   healthcheckPath = "/health"
   healthcheckTimeout = 100
   restartPolicyType = "ON_FAILURE"
   EOF

   # Deploy
   railway up
   ```

4. **Get API URL**
   - Railway will provide a URL like: `https://algogainz-backend.railway.app`
   - Or configure custom domain

### Option 2: Render.com

1. **Create Web Service**
   - Dashboard → "+ New" → "Web Service"
   - Connect your GitHub repo
   - Select `backend` directory (if monorepo)

2. **Configure Build**
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 22 or higher

3. **Environment Variables**
   - Add all variables from `.env.example`
   - Important: Set `DATABASE_URL` from your Render database

4. **Deploy**
   - Click "Create Web Service"
   - Render will auto-deploy on git push

### Option 3: Heroku

```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login
heroku login

# Create app
cd backend
heroku create algogainz-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
heroku config:set KITE_API_KEY=your_key
heroku config:set KITE_API_SECRET=your_secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run prisma:migrate
```

### Verification

```bash
# Test health endpoint
curl https://your-api-url.com/health

# Expected response:
{
  "status": "OK",
  "message": "AlgoGainz API is running",
  "timestamp": "2025-11-19T...",
  "environment": "production"
}
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Deploy React App to Vercel**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure Build**
   ```bash
   cd frontend

   # Create vercel.json
   cat > vercel.json <<EOF
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   EOF
   ```

3. **Set Environment Variables**
   Create `.env.production` in frontend:
   ```bash
   VITE_API_BASE_URL=https://your-backend-api.railway.app
   VITE_WS_URL=wss://your-backend-api.railway.app
   VITE_KITE_API_KEY=your_kite_api_key
   ```

4. **Deploy**
   ```bash
   # First deployment
   vercel

   # Production deployment
   vercel --prod
   ```

5. **Custom Domain (Optional)**
   - Vercel Dashboard → Settings → Domains
   - Add your custom domain (e.g., app.algogainz.com)
   - Configure DNS records as instructed

### Option 2: Netlify

1. **Deploy via Git**
   - [Netlify Dashboard](https://app.netlify.com/)
   - "Add new site" → "Import existing project"
   - Connect GitHub repo

2. **Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
   - **Node version**: 22

3. **Environment Variables**
   - Site settings → Environment variables
   - Add `VITE_API_BASE_URL`, `VITE_WS_URL`, etc.

4. **Deploy**
   - Netlify auto-deploys on git push to main

### Option 3: Cloudflare Pages

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
cd frontend
npm run build
wrangler pages deploy dist --project-name=algogainz
```

### PWA Verification

After deployment, verify PWA functionality:

1. **Lighthouse Audit**
   - Open Chrome DevTools
   - Lighthouse tab → "Generate report"
   - Check PWA score (should be > 90)

2. **Install Prompt**
   - Visit site on mobile
   - Check for "Add to Home Screen" prompt
   - Install and verify offline functionality

3. **Service Worker**
   ```javascript
   // In browser console:
   navigator.serviceWorker.getRegistrations().then(regs => console.log(regs));
   ```

---

## Environment Variables

### Backend (.env)

```bash
# Required for Production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<strong-32+char-secret>
KITE_API_KEY=your_api_key
KITE_API_SECRET=your_api_secret
KITE_REDIRECT_URL=https://api.algogainz.com/api/auth/callback
ALLOWED_ORIGINS=https://algogainz.vercel.app,https://app.algogainz.com
TRUST_PROXY=1

# Optional
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env.production)

```bash
VITE_API_BASE_URL=https://api.algogainz.com
VITE_WS_URL=wss://api.algogainz.com
VITE_KITE_API_KEY=your_kite_api_key
```

---

## Security Configuration

### 1. Helmet.js Security Headers

Already configured in `backend/src/config/security.ts`:
- ✅ Content Security Policy (CSP)
- ✅ Strict-Transport-Security (HSTS)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ X-XSS-Protection

### 2. CORS Configuration

```typescript
// Configured in backend/src/config/security.ts
ALLOWED_ORIGINS=https://algogainz.vercel.app,https://app.algogainz.com
```

### 3. Rate Limiting

Configured limits:
- **General API**: 100 requests/minute
- **Authentication**: 5 attempts/15 minutes
- **Trading**: 10 orders/second
- **Reports**: 5 reports/minute

### 4. Database Security

- ✅ Prisma prevents SQL injection
- ✅ Connection pooling enabled
- ✅ Encrypted connections (SSL)
- ✅ Performance indices created

### 5. SSL/TLS

- Railway/Render/Vercel provide automatic SSL
- Force HTTPS redirect (handled by platforms)

---

## Monitoring & Logging

### 1. Error Tracking (Sentry - Optional)

```bash
# Install Sentry
npm install @sentry/node @sentry/integrations

# Configure in backend
# Add to .env:
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### 2. Application Logs

```bash
# View Railway logs
railway logs

# View Render logs
# Dashboard → Your Service → Logs tab

# View Vercel logs
vercel logs <deployment-url>
```

### 3. Database Monitoring

```bash
# Railway database metrics
# Dashboard → Database → Metrics tab

# Check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### 4. Health Checks

```bash
# Backend health
curl https://api.algogainz.com/health

# Frontend health
curl https://algogainz.vercel.app

# Database health
psql $DATABASE_URL -c "SELECT 1;"
```

---

## Post-Deployment Checklist

### Immediate Testing

- [ ] Health endpoint responds correctly
- [ ] Frontend loads without errors
- [ ] Login/authentication works
- [ ] API calls succeed from frontend
- [ ] Database queries execute
- [ ] WebSocket connections work
- [ ] PWA installs successfully

### Security Verification

- [ ] HTTPS enabled (green lock icon)
- [ ] Security headers present (check with securityheaders.com)
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] No sensitive data in errors
- [ ] Environment variables secured

### Performance Testing

- [ ] Lighthouse score > 90
- [ ] API response times < 500ms
- [ ] Database query times logged
- [ ] No memory leaks
- [ ] Gzip compression active

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:
- Add frontend URL to `ALLOWED_ORIGINS` in backend .env
- Verify `FRONTEND_URL` is set correctly
- Check that backend `corsOptions` includes your domain

#### 2. Database Connection Fails

```
Error: P1001: Can't reach database server
```

**Solution**:
- Verify `DATABASE_URL` is correct
- Check database is running
- Verify IP allowlist (if using cloud DB)
- Test connection: `psql $DATABASE_URL`

#### 3. Build Fails

```
Module not found: Error: Can't resolve...
```

**Solution**:
- Run `npm install` to ensure all dependencies
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

#### 4. Environment Variables Not Loading

**Solution**:
- Verify variable names match exactly
- Restart server after env changes
- Check platform-specific env var syntax
- Use `console.log(process.env.VAR_NAME)` to debug

#### 5. 502 Bad Gateway

**Solution**:
- Check backend server is running
- Verify health endpoint responds
- Check logs for errors
- Ensure `PORT` env var is set correctly

---

## Rollback Strategy

### Backend Rollback

```bash
# Railway
railway rollback

# Render
# Dashboard → Deployments → Select previous → Restore

# Heroku
heroku releases
heroku rollback v<version-number>
```

### Frontend Rollback

```bash
# Vercel
vercel rollback <deployment-url>

# Netlify
# Dashboard → Deploys → Select previous → Publish
```

---

## Maintenance Tasks

### Weekly

- [ ] Check error logs
- [ ] Review security alerts
- [ ] Monitor API usage
- [ ] Check database size

### Monthly

- [ ] Update dependencies (`npm outdated`)
- [ ] Review audit logs
- [ ] Performance optimization
- [ ] Backup database

### Quarterly

- [ ] Security audit
- [ ] Load testing
- [ ] Review rate limits
- [ ] Update documentation

---

## Cost Estimates (Monthly)

### Free Tier (Getting Started)

- **Railway**: Free ($5 credit/month)
- **Render**: Free tier available
- **Vercel**: Free for hobby projects
- **Total**: $0/month for low traffic

### Production (100 Users)

- **Railway (Backend + DB)**: ~$20/month
- **Vercel (Frontend)**: $20/month (Pro plan)
- **Sentry (Optional)**: $26/month (Team plan)
- **Domain**: $12/year
- **Total**: ~$50/month

### Scale (1000+ Users)

- **Railway**: ~$50/month
- **Vercel**: $20/month
- **Redis Cache**: $10/month
- **CDN**: $5/month
- **Total**: ~$85/month

---

## Support & Resources

### Documentation
- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

### AlgoGainz Resources
- **Technical Docs**: See `/docs/` directory
- **API Reference**: `/docs/API.md`
- **Testing Guide**: `/docs/TESTING.md`

---

**Deployment completed? Congratulations! 🎉**

Your AlgoGainz application is now live in production!

**Next Steps**:
1. Monitor logs for the first 24 hours
2. Test all features thoroughly
3. Share with beta users
4. Collect feedback and iterate

---

**Last Updated**: November 19, 2025
**Version**: 1.0
