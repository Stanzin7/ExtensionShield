# Auth, Analytics & History Implementation Plan

**Status**: ✅ **IMPLEMENTED** (as of latest commits)

This document audits the current state and provides a reference for the auth, analytics, and user-scoped history implementation.

---

## 1. Current State

### 1.1 Frontend Stack

**Framework**: React 18.3.1 + Vite 7.1.7

**Routing**: React Router DOM v7.9.4
- Main router: `frontend/src/App.jsx` (wraps routes with `AuthProvider` and `ScanProvider`)
- Route definitions: `frontend/src/routes/routes.jsx`
- Key routes:
  - `/` - HomePage
  - `/scan` - ScannerPage
  - `/scan/history` - ScanHistoryPage (user-scoped)
  - `/research`, `/research/benchmarks`, etc.

**State Management**:
- `AuthContext` (`frontend/src/context/AuthContext.jsx`) - Supabase Auth state
- `ScanContext` (`frontend/src/context/ScanContext.jsx`) - Scan workflow state

**Key Files**:
- `frontend/src/App.jsx` - Main app component with routing + telemetry tracking
- `frontend/src/services/supabaseClient.js` - Supabase client singleton
- `frontend/src/services/authService.js` - Auth service (Supabase Auth)
- `frontend/src/services/databaseService.js` - Backend API client (includes auth headers)
- `frontend/src/services/telemetryService.js` - Pageview tracking

### 1.2 Auth Implementation

**Frontend Auth** (✅ Complete):
- **Supabase Auth** integrated via `@supabase/supabase-js` v2.94.1
- **AuthContext** (`frontend/src/context/AuthContext.jsx`):
  - Loads session on mount via `supabase.auth.getSession()`
  - Subscribes to auth state changes via `supabase.auth.onAuthStateChange()`
  - Exposes `user`, `session`, `accessToken`, `isAuthenticated`
  - Provides `signInWithGoogle()`, `signInWithEmail()`, `signUpWithEmail()`, `signOut()`
- **authService** (`frontend/src/services/authService.js`):
  - `signInWithGoogle()` - OAuth redirect to Google
  - `signInWithGitHub()` - OAuth redirect to GitHub (implemented, not enabled in UI)
  - `signInWithEmail()` - Email/password sign-in
  - `signUpWithEmail()` - Email/password sign-up
  - `signOut()` - Sign out
- **SignInModal** (`frontend/src/components/SignInModal.jsx`):
  - UI unchanged from original design
  - Wired to real Supabase Auth methods
  - Shows error messages on failure

**Backend Auth** (✅ Complete):
- **JWT Verification** (`src/extension_shield/api/supabase_auth.py`):
  - `verify_supabase_access_token()` - Verifies JWT via JWKS
  - `get_current_user_id()` - Extracts `user_id` from `Authorization: Bearer <token>` header
  - JWKS fetched from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (cached 1 hour)
  - Validates: signature (RS256), expiration (`exp`), audience (`aud`)
  - Returns `None` if token missing/invalid (graceful degradation)
- **Middleware** (`src/extension_shield/api/main.py`):
  - `@app.middleware("http")` extracts `user_id` and stores in `request.state.user_id`
  - All requests processed; invalid tokens result in `user_id = None`

**Environment Variables**:
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Backend: `SUPABASE_URL`, `SUPABASE_JWT_AUD` (default: `"authenticated"`)
- Backend DB (optional): `SUPABASE_SERVICE_ROLE_KEY`, `DB_BACKEND=supabase`

### 1.3 Backend API Endpoints

**Scan Endpoints**:
- `POST /api/scan/trigger` - Trigger scan from URL
- `POST /api/scan/upload` - Upload CRX/ZIP and scan
- `GET /api/scan/status/{extension_id}` - Get scan status
- `GET /api/scan/results/{extension_id}` - Get scan results
- `GET /api/scan/files/{extension_id}` - List extracted files
- `GET /api/scan/file/{extension_id}/{file_path}` - Get file content
- `GET /api/scan/icon/{extension_id}` - Get extension icon
- `DELETE /api/scan/{extension_id}` - Delete scan result

**History Endpoint** (✅ User-scoped):
- `GET /api/history?limit=50` - **Requires authentication**
  - Returns 401 if no `user_id` (no token or invalid token)
  - Returns user's scan history via `db.get_user_scan_history(user_id, limit)`
  - Joins `user_scan_history` with `scan_results` by `extension_id`

**Analytics Endpoints** (✅ Privacy-first):
- `POST /api/telemetry/pageview` - Track pageview (no auth required, no PII)
- `GET /api/telemetry/summary?days=14` - Get aggregated counts (currently open, should be admin-only in prod)

**Other Endpoints**:
- `GET /api/statistics` - Global statistics (not user-scoped)
- `GET /api/recent` - Recent scans (not user-scoped, legacy)

### 1.4 Database Layer

**SQLite** (`src/extension_shield/api/database.py`):
- **`scan_results`** table (global cache):
  - Primary key: `extension_id` (unique)
  - Stores full scan results (JSON fields: metadata, manifest, permissions_analysis, etc.)
  - **No `user_id` column** (intentional: global cache)
- **`user_scan_history`** table (user-scoped):
  - Primary key: `id` (UUID)
  - Columns: `user_id`, `extension_id`, `created_at`
  - Index: `(user_id, created_at DESC)`
  - **References `scan_results.extension_id`** (not a foreign key, but logical reference)
- **`page_views_daily`** table (analytics):
  - Primary key: `(day, path)`
  - Columns: `day` (TEXT, UTC `YYYY-MM-DD`), `path` (TEXT), `count` (INTEGER)

**Supabase** (`src/extension_shield/api/database.py` - `SupabaseDatabase` class):
- **`scan_results`** table (global cache, same schema as SQLite)
- **`user_scan_history`** table (migration: `docs/supabase_migrations/002_user_scan_history.sql`):
  - RLS enabled
  - Policies: users can only SELECT/INSERT/DELETE their own rows
  - Foreign key: `user_id` references `auth.users(id)` ON DELETE CASCADE

**Database Backend Selection**:
- Auto-detects: if `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY`) exist → use Supabase
- Override: `DB_BACKEND=sqlite` or `DB_BACKEND=supabase`
- Default: SQLite if Supabase vars not set

### 1.5 Storage Model: Global Cache + User History

**✅ Design Choice Implemented**: 
- **`scan_results`** is a **global cache** keyed by `extension_id` (no `user_id`)
- **`user_scan_history`** is a **separate table** that references `scan_results.extension_id`

**Why This Design**:
- Scans are expensive; results are cached globally
- Multiple users can scan the same extension; only one result stored
- User history tracks which extensions each user has scanned
- History can be deleted per-user without affecting global cache

**Implementation Details**:
- On scan completion (`run_analysis_workflow`):
  1. Save/update `scan_results[extension_id]` (global cache)
  2. If `user_id` exists: insert into `user_scan_history(user_id, extension_id)`
  3. If `user_id` is `None`: skip history insert (anonymous scan)
- On `/api/history` request:
  1. Extract `user_id` from JWT (401 if missing)
  2. Query `user_scan_history` for `user_id`
  3. Join with `scan_results` by `extension_id`
  4. Return enriched history

**Files Involved**:
- `src/extension_shield/api/main.py`:
  - Line 363: `db.save_scan_result(scan_results[extension_id])` (global save)
  - Line 369: `db.add_user_scan_history(user_id=user_id, extension_id=extension_id)` (user history)
  - Line 1518: `db.get_user_scan_history(user_id=user_id, limit=limit)` (user-scoped query)
- `src/extension_shield/api/database.py`:
  - `save_scan_result()` - Upserts global cache
  - `add_user_scan_history()` - Inserts user history row
  - `get_user_scan_history()` - Joins user history with scan_results

---

## 2. Gaps & Limitations

### 2.1 Analytics
- ✅ **Implemented**: Privacy-first pageview tracking (SQLite)
- ⚠️ **Gap**: Supabase persistence not implemented (backend only writes to SQLite)
- ⚠️ **Gap**: `/api/telemetry/summary` is open (should be admin-only in production)

### 2.2 Auth
- ✅ **Implemented**: Supabase Auth (Google OAuth + email/password)
- ✅ **Implemented**: Backend JWT verification (JWKS)
- ⚠️ **Gap**: Issuer (`iss`) validation not enforced (recommended but not required)
- ⚠️ **Gap**: GitHub OAuth implemented but not enabled in UI (SignInModal only shows Google)

### 2.3 History
- ✅ **Implemented**: User-scoped history (`user_scan_history` table)
- ✅ **Implemented**: Auth-required `/api/history` endpoint
- ✅ **Implemented**: Frontend sends `Authorization` header
- ✅ **Implemented**: Frontend shows sign-in prompt when not authenticated
- ⚠️ **Gap**: No UI for deleting individual history items (only global scan deletion exists)

### 2.4 Database
- ✅ **Implemented**: SQLite schema with `user_scan_history`
- ✅ **Implemented**: Supabase migration SQL with RLS policies
- ⚠️ **Gap**: No migration script to run Supabase SQL (manual execution required)

---

## 3. Implementation Steps (Already Completed)

### Phase 1: Privacy-first Analytics ✅
1. **Backend**:
   - Added `page_views_daily` table to SQLite schema
   - Added `increment_page_view()` and `get_page_view_summary()` methods
   - Added `POST /api/telemetry/pageview` endpoint
   - Added `GET /api/telemetry/summary` endpoint
2. **Frontend**:
   - Created `frontend/src/services/telemetryService.js`
   - Added route change tracking in `frontend/src/App.jsx` (debounced, fails silently)

**Files Changed**:
- `src/extension_shield/api/database.py` (added telemetry methods)
- `src/extension_shield/api/main.py` (added telemetry endpoints)
- `frontend/src/services/telemetryService.js` (new file)
- `frontend/src/App.jsx` (added telemetry tracking)

### Phase 2: Supabase Auth (Frontend) ✅
1. **Dependencies**:
   - Installed `@supabase/supabase-js` v2.94.1
2. **Frontend**:
   - Created `frontend/src/services/supabaseClient.js` (singleton client)
   - Replaced `frontend/src/services/authService.js` with Supabase Auth calls
   - Updated `frontend/src/context/AuthContext.jsx`:
     - Load session on mount
     - Subscribe to auth state changes
     - Expose `accessToken` getter
   - SignInModal UI unchanged (wired to real auth)

**Files Changed**:
- `frontend/package.json` (added dependency)
- `frontend/package-lock.json` (dependency lock)
- `frontend/src/services/supabaseClient.js` (new file)
- `frontend/src/services/authService.js` (replaced implementation)
- `frontend/src/context/AuthContext.jsx` (updated to use Supabase)

### Phase 3: Backend JWT Verification ✅
1. **Dependencies**:
   - Added `python-jose[cryptography]` to `pyproject.toml`
2. **Backend**:
   - Created `src/extension_shield/api/supabase_auth.py`:
     - JWKS fetching and caching (1 hour TTL)
     - JWT verification (signature, exp, aud)
     - `get_current_user_id()` helper
   - Updated `src/extension_shield/core/config.py`:
     - Added `SUPABASE_JWKS_URL` (derived from `SUPABASE_URL`)
     - Added `SUPABASE_JWT_AUD` (default: `"authenticated"`)
   - Added middleware in `src/extension_shield/api/main.py`:
     - Extracts `user_id` from JWT and stores in `request.state.user_id`

**Files Changed**:
- `pyproject.toml` (added dependency)
- `src/extension_shield/core/config.py` (added JWKS config)
- `src/extension_shield/api/supabase_auth.py` (new file)
- `src/extension_shield/api/main.py` (added middleware)

### Phase 4: User-scoped History ✅
1. **Database Schema**:
   - Added `user_scan_history` table to SQLite schema
   - Created Supabase migration: `docs/supabase_migrations/002_user_scan_history.sql`
2. **Backend**:
   - Added `add_user_scan_history()` and `get_user_scan_history()` to `Database` class
   - Updated `run_analysis_workflow()` to insert user history on scan completion
   - Updated `/api/history` endpoint to require auth and return user-scoped results
3. **Frontend**:
   - Updated `frontend/src/services/databaseService.js` to send `Authorization` header
   - Updated `frontend/src/pages/ScanHistoryPage.jsx`:
     - Only loads history if authenticated
     - Shows sign-in prompt when not authenticated

**Files Changed**:
- `src/extension_shield/api/database.py` (added user history methods)
- `src/extension_shield/api/main.py` (updated scan completion + history endpoint)
- `docs/supabase_migrations/002_user_scan_history.sql` (new file)
- `frontend/src/services/databaseService.js` (added auth headers)
- `frontend/src/pages/ScanHistoryPage.jsx` (auth-gated history loading)

### Phase 5: Documentation & Cleanup ✅
1. **Documentation**:
   - Created `docs/auth_setup.md` (Supabase Auth setup guide)
   - Created `docs/analytics.md` (analytics API documentation)
2. **Cleanup**:
   - Removed IP-based fallback from `_get_user_id()` (privacy-first)

**Files Changed**:
- `docs/auth_setup.md` (new file)
- `docs/analytics.md` (new file)
- `src/extension_shield/api/main.py` (removed IP fallback)

---

## 4. Exact Files Changed (Reference)

### Backend Files
1. `src/extension_shield/api/database.py`
   - Added `page_views_daily` table schema
   - Added `increment_page_view()` method
   - Added `get_page_view_summary()` method
   - Added `user_scan_history` table schema
   - Added `add_user_scan_history()` method
   - Added `get_user_scan_history()` method (SQLite + Supabase)

2. `src/extension_shield/api/main.py`
   - Added JWT verification middleware
   - Added `POST /api/telemetry/pageview` endpoint
   - Added `GET /api/telemetry/summary` endpoint
   - Updated `run_analysis_workflow()` to save user history
   - Updated `/api/history` to require auth and return user-scoped results
   - Removed IP-based user ID fallback

3. `src/extension_shield/api/supabase_auth.py` (new)
   - JWKS fetching and caching
   - JWT verification logic
   - `get_current_user_id()` helper

4. `src/extension_shield/core/config.py`
   - Added `SUPABASE_JWKS_URL` (derived from `SUPABASE_URL`)
   - Added `SUPABASE_JWT_AUD` (default: `"authenticated"`)

5. `pyproject.toml`
   - Added `python-jose[cryptography]` dependency

### Frontend Files
1. `frontend/src/services/supabaseClient.js` (new)
   - Supabase client singleton

2. `frontend/src/services/authService.js`
   - Replaced demo auth with Supabase Auth calls

3. `frontend/src/context/AuthContext.jsx`
   - Updated to use Supabase Auth
   - Added session loading and subscription
   - Exposed `accessToken` getter

4. `frontend/src/services/databaseService.js`
   - Added `_authHeaders()` helper
   - Updated `getScanHistory()` to send `Authorization` header

5. `frontend/src/pages/ScanHistoryPage.jsx`
   - Auth-gated history loading
   - Shows sign-in prompt when not authenticated

6. `frontend/src/services/telemetryService.js` (new)
   - Pageview tracking service

7. `frontend/src/App.jsx`
   - Added route change tracking (calls `trackPageView()`)

8. `frontend/package.json`
   - Added `@supabase/supabase-js` dependency

### Documentation Files
1. `docs/auth_setup.md` (new)
   - Supabase Auth setup guide
   - OAuth redirect configuration
   - JWT verification details
   - Security notes

2. `docs/analytics.md` (new)
   - Analytics API documentation
   - Privacy guarantees
   - Troubleshooting

3. `docs/supabase_migrations/002_user_scan_history.sql` (new)
   - Supabase migration for `user_scan_history` table
   - RLS policies

---

## 5. Next Steps (Optional Enhancements)

### 5.1 Analytics
- [ ] Implement Supabase persistence for `page_views_daily` (backend writes to Supabase)
- [ ] Add admin authentication to `/api/telemetry/summary` endpoint
- [ ] Add rate limiting to telemetry endpoints

### 5.2 Auth
- [ ] Add issuer (`iss`) validation to JWT verification
- [ ] Enable GitHub OAuth in SignInModal UI
- [ ] Add password reset flow
- [ ] Add email verification flow

### 5.3 History
- [ ] Add UI for deleting individual history items
- [ ] Add pagination to history endpoint
- [ ] Add search/filter to history page

### 5.4 Database
- [ ] Create migration script runner for Supabase
- [ ] Add database migration versioning
- [ ] Add backup/restore utilities

---

## 6. Testing Checklist

### Auth
- [ ] Google OAuth sign-in works
- [ ] Email/password sign-in works
- [ ] Email/password sign-up works
- [ ] Sign-out works
- [ ] Session persists across page refreshes
- [ ] Invalid JWT tokens are rejected
- [ ] Missing JWT tokens result in anonymous requests

### History
- [ ] Authenticated users see their scan history
- [ ] Unauthenticated users see sign-in prompt
- [ ] History only includes scans performed by the user
- [ ] History joins correctly with global scan_results

### Analytics
- [ ] Pageviews are tracked on route changes
- [ ] Pageviews are persisted to database
- [ ] Summary endpoint returns aggregated counts
- [ ] Telemetry fails silently if API is down

---

## 7. Environment Variables Reference

### Frontend (Vite)
```bash
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<anon-key>"
```

### Backend (FastAPI)
```bash
# JWT Verification (required)
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_JWT_AUD="authenticated"  # Optional, default: "authenticated"

# Database Backend (optional, for Supabase persistence)
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"  # Backend-only!
DB_BACKEND=supabase  # Optional override
```

---

**Last Updated**: After Phase 5 completion
**Status**: ✅ All phases implemented and committed

