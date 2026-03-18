#!/bin/bash
# ExtensionShield - Railway Deployment Script
# Quick shortcut to trigger auto deployment from CLI

set -e

echo "🚀 Deploying ExtensionShield to Railway..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️  Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if project is linked
if ! railway status &> /dev/null; then
    echo "⚠️  Project not linked. Please link your Railway project first:"
    echo "   railway login"
    echo "   railway link"
    exit 1
fi

# Check for required environment variables
echo "🔍 Checking required environment variables..."
echo ""

MISSING_VARS=()

# Check frontend build variables
if ! railway variables | grep -q "VITE_SUPABASE_URL"; then
    MISSING_VARS+=("VITE_SUPABASE_URL")
fi

if ! railway variables | grep -q "VITE_SUPABASE_ANON_KEY"; then
    MISSING_VARS+=("VITE_SUPABASE_ANON_KEY")
fi

# Check backend runtime variables
if ! railway variables | grep -q "SUPABASE_URL"; then
    MISSING_VARS+=("SUPABASE_URL")
fi

if ! railway variables | grep -q "SUPABASE_SERVICE_ROLE_KEY"; then
    MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
fi

if ! railway variables | grep -q "LLM_PROVIDER"; then
    MISSING_VARS+=("LLM_PROVIDER")
fi

if ! railway variables | grep -q "OPENAI_API_KEY"; then
    MISSING_VARS+=("OPENAI_API_KEY")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  WARNING: Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "❌ Deployment may fail without these variables!"
    echo ""
    echo "To set variables, use:"
    echo "   railway variables set KEY=VALUE"
    echo ""
    echo "See docs/RAILWAY_DEPLOYMENT.md for detailed setup instructions."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
else
    echo "✅ All required environment variables are set"
    echo ""
fi

# Deploy
echo "📦 Starting deployment..."
railway up --detach

echo ""
echo "✅ Deployment triggered successfully!"
echo ""
echo "View deployment status:"
echo "  railway status"
echo ""
echo "View logs:"
echo "  railway logs -f"
echo ""

