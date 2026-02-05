# Railway Deployment - Quick Fix Summary

## Problem
The frontend was showing "Supabase is not configured" error on production because the Docker build wasn't receiving the Supabase environment variables at build time.

## Root Cause
Vite requires environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) at **build time**, not runtime. The Dockerfile wasn't configured to accept and pass these build arguments.

## Solution Applied

### 1. Updated Dockerfile
Modified the frontend build stage to accept build arguments:

```dockerfile
# Accept build arguments for Vite environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL

# Set them as environment variables for the build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
```

### 2. Updated .dockerignore
Fixed the issue where `docs/supabase_migrations/` was excluded from the build context:
- Removed blanket `docs/` exclusion
- Added specific exclusions for documentation .md files only
- Kept `docs/supabase_migrations/` directory accessible for deployment

### 3. Updated railway.toml
Added documentation about required build arguments and environment variables.

### 4. Created Deployment Tools

**New Files:**
- `docs/RAILWAY_DEPLOYMENT.md` - Complete deployment guide
- `scripts/check_railway_env.sh` - Environment variable checker
- Enhanced `scripts/deploy.sh` - Now checks for required variables before deploying

**New Makefile Commands:**
- `make deploy-check` - Check Railway environment variables
- `make deploy` - Deploy to Railway
- `make deploy-link` - Link to Railway project
- `make deploy-logs` - View production logs
- `make deploy-status` - Check deployment status

## Action Required: Set Environment Variables in Railway

You need to set these environment variables in your Railway dashboard:

### Frontend (Build-Time) - REQUIRED
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (Runtime) - REQUIRED
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
LLM_MODEL=gpt-4o
```

## How to Set Variables in Railway

### Option 1: Railway Dashboard (Easiest)
1. Go to https://railway.app/dashboard
2. Select your project
3. Click **Variables** tab
4. Add each variable listed above
5. Redeploy (happens automatically)

### Option 2: Railway CLI
```bash
# Frontend build-time variables
railway variables set VITE_SUPABASE_URL="https://xxxxx.supabase.co"
railway variables set VITE_SUPABASE_ANON_KEY="your-anon-key"

# Backend runtime variables
railway variables set SUPABASE_URL="https://xxxxx.supabase.co"
railway variables set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
railway variables set LLM_PROVIDER="openai"
railway variables set OPENAI_API_KEY="sk-your-key"
railway variables set LLM_MODEL="gpt-4o"
```

## Finding Your Supabase Keys

1. Go to https://app.supabase.com
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep secret!)

## Deployment Steps

### 1. Check Current Variables
```bash
make deploy-check
# OR
./scripts/check_railway_env.sh
```

### 2. Set Missing Variables
Use Railway dashboard or CLI (see above)

### 3. Deploy
```bash
make deploy
# OR
./scripts/deploy.sh
# OR
railway up
```

### 4. Verify Deployment
```bash
# View logs
railway logs -f

# Check status
railway status

# Test the app
curl https://your-app.railway.app/health
```

## Troubleshooting

### Still seeing "Supabase is not configured" error?

**Check 1:** Verify variables are set
```bash
railway variables | grep VITE_SUPABASE
```

**Check 2:** Verify the build received the variables
Look in build logs for:
```
ENV VITE_SUPABASE_URL=https://...
ENV VITE_SUPABASE_ANON_KEY=eyJ...
```

**Check 3:** Force a rebuild
```bash
railway up --force
```

### Build fails with "docs/supabase_migrations not found"?

Make sure you've committed the `.dockerignore` changes:
```bash
git add .dockerignore
git commit -m "Fix dockerignore to include supabase migrations"
git push
```

### Frontend loads but can't sign in?

Check browser console for errors. If you see references to `placeholder.supabase.co`, the build-time variables weren't set correctly.

## Files Modified

1. `Dockerfile` - Added build arguments for Vite env vars
2. `.dockerignore` - Fixed to include `docs/supabase_migrations/`
3. `railway.toml` - Documented required variables
4. `docs/RAILWAY_DEPLOYMENT.md` - Complete deployment guide (NEW)
5. `docs/PRODUCTION_DEPLOYMENT.md` - Added Railway section
6. `scripts/deploy.sh` - Enhanced with variable checking
7. `scripts/check_railway_env.sh` - Environment checker (NEW)
8. `Makefile` - Added deployment commands

## Next Steps

After successful deployment:

1. **Set Custom Domain** (optional)
   - Railway Dashboard → Settings → Domains

2. **Monitor Usage**
   - Check Railway dashboard for metrics
   - Monitor Supabase usage

3. **Set up CI/CD** (optional)
   - GitHub Actions workflow is already in `.github/workflows/deploy.yml`
   - Add `RAILWAY_TOKEN` secret to GitHub

## Quick Reference

```bash
# Check environment variables
make deploy-check

# Deploy to Railway
make deploy

# View logs
make deploy-logs

# Check status
make deploy-status

# Link project (first time only)
make deploy-link
```

For detailed documentation, see:
- **Railway Setup:** `docs/RAILWAY_DEPLOYMENT.md`
- **Production Deployment:** `docs/PRODUCTION_DEPLOYMENT.md`
- **Supabase Setup:** `docs/AUTH_SETUP_COMPLETE.md`

