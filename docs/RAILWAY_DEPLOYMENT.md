# Railway Deployment Guide

This guide will help you deploy ExtensionShield to Railway with proper environment variable configuration.

## Prerequisites

1. A Railway account ([sign up here](https://railway.app))
2. Railway CLI installed (`npm install -g @railway/cli`)
3. A Supabase project ([create one here](https://app.supabase.com))

## Required Environment Variables

### Frontend Build Variables (REQUIRED)

These are needed at **build time** for the React frontend to work with authentication:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to find these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Copy **Project URL** → this is your `VITE_SUPABASE_URL`
5. Copy the **anon/public** key → this is your `VITE_SUPABASE_ANON_KEY`

### Backend Runtime Variables (REQUIRED)

These are needed at **runtime** for the Python backend:

```bash
# LLM Provider (choose one)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here
LLM_MODEL=gpt-4o

# Supabase (for storing scan results)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT:** The backend uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (NOT the anon key).

**How to find the service role key:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Scroll down to **Service Role Key** (🔴 keep this secret!)
5. Copy the key → this is your `SUPABASE_SERVICE_ROLE_KEY`

### Optional Variables

```bash
# VirusTotal integration (optional)
VIRUSTOTAL_API_KEY=your-virustotal-api-key

# Custom API base URL for frontend (optional)
VITE_API_BASE_URL=/api

# CORS origins (optional, comma-separated)
CORS_ORIGINS=https://extensionscanner.com,https://your-domain.com
```

## Deployment Steps

### Option 1: Via Railway Dashboard

1. **Create New Project**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click **New Project** → **Deploy from GitHub repo**
   - Select your ExtensionShield repository

2. **Set Environment Variables**
   - Go to your project → **Variables** tab
   - Add all the required variables listed above
   - Make sure to add the `VITE_*` variables for the frontend build

3. **Deploy**
   - Railway will automatically detect the `Dockerfile` and build
   - Wait for the build and deployment to complete
   - Your app will be available at the Railway-provided URL

### Option 2: Via CLI

1. **Login to Railway**
   ```bash
   railway login
   ```

2. **Link to Your Project** (first time only)
   ```bash
   railway link
   ```

3. **Set Environment Variables** (first time only)
   ```bash
   # Set all required variables
   railway variables set VITE_SUPABASE_URL="https://xxxxx.supabase.co"
   railway variables set VITE_SUPABASE_ANON_KEY="your-anon-key"
   railway variables set SUPABASE_URL="https://xxxxx.supabase.co"
   railway variables set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   railway variables set LLM_PROVIDER="openai"
   railway variables set OPENAI_API_KEY="sk-your-key"
   railway variables set LLM_MODEL="gpt-4o"
   ```

4. **Deploy**
   ```bash
   # Quick deploy
   railway up
   
   # OR using the helper script
   ./scripts/deploy.sh
   
   # OR using make
   make deploy
   ```

5. **View Logs**
   ```bash
   railway logs -f
   ```

## Verifying the Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **Test Frontend**
   - Open your Railway URL in a browser
   - You should see the ExtensionShield homepage
   - Try signing in (should not show Supabase error)

3. **Test API**
   ```bash
   curl https://your-app.railway.app/api/health
   ```

## Troubleshooting

### "Supabase is not configured" Error

This means the frontend was built without the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables.

**Fix:**
1. Go to Railway Dashboard → Variables
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Trigger a new deployment (or run `railway up` from CLI)

### Build Fails with "docs/supabase_migrations not found"

Make sure `.dockerignore` doesn't exclude the migrations directory.

**Fix:**
```bash
# Check .dockerignore - it should NOT have "docs/" as a blanket exclusion
# Only specific .md files should be excluded
```

### Database Migrations Not Running

Check the logs for migration errors:

```bash
railway logs -f | grep migration
```

If migrations fail, you can run them manually using the Supabase dashboard.

## Environment Variable Summary

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `VITE_SUPABASE_URL` | Build | ✅ Yes | Supabase project URL (for frontend) |
| `VITE_SUPABASE_ANON_KEY` | Build | ✅ Yes | Supabase anon key (for frontend) |
| `SUPABASE_URL` | Runtime | ✅ Yes | Supabase project URL (for backend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime | ✅ Yes | Supabase service role key (for backend) |
| `LLM_PROVIDER` | Runtime | ✅ Yes | LLM provider: openai, watsonx, ollama |
| `OPENAI_API_KEY` | Runtime | ✅ Yes* | OpenAI API key (*if using OpenAI) |
| `LLM_MODEL` | Runtime | Recommended | LLM model name (default: gpt-4o) |
| `VIRUSTOTAL_API_KEY` | Runtime | No | VirusTotal API key for malware checks |
| `VITE_API_BASE_URL` | Build | No | Custom API base URL for frontend |
| `CORS_ORIGINS` | Runtime | No | Comma-separated CORS origins |

## Next Steps

After successful deployment:

1. **Set up Custom Domain** (optional)
   - Go to Railway Dashboard → Settings → Domains
   - Add your custom domain

2. **Monitor Usage**
   - Check Railway Dashboard for metrics
   - Monitor Supabase usage

3. **Run Database Migrations**
   - Migrations run automatically on startup
   - Check logs to verify: `railway logs | grep migration`

## Quick Reference Commands

```bash
# Deploy
railway up

# View logs
railway logs -f

# Check status
railway status

# Set environment variable
railway variables set KEY=VALUE

# Open in browser
railway open

# SSH into container
railway run bash
```

## Support

- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- ExtensionShield Issues: https://github.com/your-repo/issues

