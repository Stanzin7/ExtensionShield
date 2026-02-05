# Auth Setup (Supabase)

ExtensionShield uses **Supabase Auth** in the frontend and verifies access tokens on the backend via **JWKS**.

## Frontend env vars (Vite)

Set these (local dev: `frontend/.env.local`, production: your deploy env):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**⚠️ Security**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend. Only use the anon key.

Example:

```bash
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<anon-key>"
```

## Backend env vars (FastAPI)

### JWT Verification (always required)

Backend derives JWKS from `SUPABASE_URL`:

- `SUPABASE_URL` (required for JWT verification)
- `SUPABASE_JWT_AUD` (optional, default: `authenticated`)

Example:

```bash
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_JWT_AUD="authenticated"
```

### Database Backend (only if backend writes to Supabase)

If you want the backend to persist scan results to Supabase instead of SQLite:

- `SUPABASE_SERVICE_ROLE_KEY` (**backend-only**, never exposed to Vite)
- `DB_BACKEND=supabase` (optional override; defaults to `supabase` if `SUPABASE_URL` + key are set)

**⚠️ Important**: 
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS policies. Keep it server-side only.
- If `SUPABASE_SERVICE_ROLE_KEY` is not set, backend falls back to `SUPABASE_ANON_KEY` (less secure for writes).
- To force SQLite even when Supabase vars exist, set `DB_BACKEND=sqlite`.

Example:

```bash
# Backend writes to Supabase
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"  # Backend-only!
DB_BACKEND=supabase  # Optional: explicit override
```

```bash
# Backend uses SQLite (even if Supabase vars exist)
DB_BACKEND=sqlite
```

## Supabase dashboard setup

### OAuth Providers

1. Enable **Google** provider in **Authentication → Providers**
2. Configure OAuth redirect URLs:

   **Recommended**: Use origin-based redirects (default behavior)
   - Supabase OAuth redirects back to `window.location.origin` automatically
   - No manual redirect path configuration needed

   **Alternative**: Custom redirect path (if needed)
   - Redirect URLs: `https://yourdomain.com/auth/callback`
   - Ensure this matches your frontend routing

### Redirect URL Configuration

In **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:5173` (dev) and your production domain (e.g., `https://extensionaudit.com`)
- **Redirect URLs**: Add all allowed origins:
  - `http://localhost:5173`
  - `http://localhost:5174` (Vite fallback ports)
  - `https://yourdomain.com`
  - `https://www.yourdomain.com` (if using www)

### Troubleshooting OAuth Redirects

**Common error**: "redirect_uri_mismatch" or "redirect_uri not allowed"

**Checklist**:
1. ✅ Verify `VITE_SUPABASE_URL` matches your Supabase project URL exactly (no trailing slash)
2. ✅ Check Supabase dashboard → Authentication → URL Configuration → Redirect URLs includes your exact origin (protocol + domain + port)
3. ✅ Ensure no trailing slashes in redirect URLs (e.g., `https://yourdomain.com/` vs `https://yourdomain.com`)
4. ✅ For local dev, include `http://localhost:5173` (and fallback ports if used)
5. ✅ For production, include both `https://yourdomain.com` and `https://www.yourdomain.com` if applicable
6. ✅ Verify OAuth provider (Google) is enabled in Supabase dashboard
7. ✅ Check browser console for exact redirect URL being used
8. ✅ Clear browser cookies/localStorage if testing after URL changes

**Note**: Supabase uses `window.location.origin` by default, so redirects go to the root path. If you need a custom callback path, configure it in your OAuth provider settings.

## JWT Verification Details

The backend verifies Supabase access tokens using:

1. **JWKS signature validation**: Fetches public keys from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (cached for 1 hour)
2. **Expiration check**: Validates `exp` claim (handled by `jose.jwt.decode`)
3. **Audience check**: Validates `aud` claim matches `SUPABASE_JWT_AUD` (default: `"authenticated"`)
4. **Issuer check** ✅: Validates `iss` claim matches `{SUPABASE_URL}/auth/v1` (prevents cross-project token attacks)
5. **Algorithm**: RS256 (RSA with SHA-256)

**Security**: Issuer validation is **enforced**. Tokens from other Supabase projects will be rejected even if they have valid signatures.

**Current behavior**: Invalid or missing tokens result in `user_id = None` (anonymous requests). This is intentional for graceful degradation.

## Security Notes

- **Never commit** `.env` files with real keys to git
- Use environment-specific secrets management (e.g., Railway, Vercel, AWS Secrets Manager)
- Rotate `SUPABASE_SERVICE_ROLE_KEY` periodically if exposed
- Monitor Supabase dashboard → Authentication → Logs for suspicious activity

