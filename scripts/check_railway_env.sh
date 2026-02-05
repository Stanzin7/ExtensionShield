#!/bin/bash
# Quick helper script to check Railway environment variables

echo "🔍 ExtensionShield - Railway Environment Variables Check"
echo "========================================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if project is linked
if ! railway status &> /dev/null 2>&1; then
    echo "❌ Not linked to a Railway project. Run:"
    echo "   railway login"
    echo "   railway link"
    exit 1
fi

echo "✅ Railway CLI is installed and project is linked"
echo ""
echo "📋 Checking environment variables..."
echo ""

# Define required variables
declare -A REQUIRED_VARS=(
    ["VITE_SUPABASE_URL"]="Frontend build-time: Supabase project URL"
    ["VITE_SUPABASE_ANON_KEY"]="Frontend build-time: Supabase anon key"
    ["SUPABASE_URL"]="Backend runtime: Supabase project URL"
    ["SUPABASE_SERVICE_ROLE_KEY"]="Backend runtime: Supabase service role key"
    ["LLM_PROVIDER"]="Backend runtime: LLM provider (openai, watsonx, ollama)"
    ["OPENAI_API_KEY"]="Backend runtime: OpenAI API key (if using OpenAI)"
)

declare -A OPTIONAL_VARS=(
    ["LLM_MODEL"]="LLM model name (default: gpt-4o)"
    ["VIRUSTOTAL_API_KEY"]="VirusTotal API key for malware checks"
    ["VITE_API_BASE_URL"]="Custom API base URL for frontend"
    ["CORS_ORIGINS"]="Comma-separated CORS origins"
)

# Get all Railway variables
VARS=$(railway variables 2>/dev/null)

# Check required variables
echo "REQUIRED VARIABLES:"
echo "==================="
MISSING_COUNT=0
for var in "${!REQUIRED_VARS[@]}"; do
    if echo "$VARS" | grep -q "^$var="; then
        echo "✅ $var"
        echo "   ${REQUIRED_VARS[$var]}"
    else
        echo "❌ $var (MISSING)"
        echo "   ${REQUIRED_VARS[$var]}"
        ((MISSING_COUNT++))
    fi
    echo ""
done

# Check optional variables
echo "OPTIONAL VARIABLES:"
echo "==================="
for var in "${!OPTIONAL_VARS[@]}"; do
    if echo "$VARS" | grep -q "^$var="; then
        echo "✅ $var"
    else
        echo "⚪ $var (not set)"
    fi
    echo "   ${OPTIONAL_VARS[$var]}"
    echo ""
done

# Summary
echo "========================================================="
if [ $MISSING_COUNT -eq 0 ]; then
    echo "✅ All required environment variables are set!"
    echo ""
    echo "You can deploy with:"
    echo "  railway up"
    echo "  OR ./scripts/deploy.sh"
    echo "  OR make deploy"
else
    echo "❌ $MISSING_COUNT required variable(s) missing!"
    echo ""
    echo "To set a variable, use:"
    echo "  railway variables set KEY=VALUE"
    echo ""
    echo "Example:"
    echo "  railway variables set VITE_SUPABASE_URL=https://xxxxx.supabase.co"
    echo ""
    echo "See docs/RAILWAY_DEPLOYMENT.md for detailed setup instructions."
fi
echo ""

