#!/usr/bin/env sh

set -e

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is not installed." >&2
  echo "Install it separately, then rerun this command." >&2
  echo "Examples:" >&2
  echo "  npm install -g supabase" >&2
  echo "  brew install supabase/tap/supabase" >&2
  exit 127
fi

exec supabase "$@"
