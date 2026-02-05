# Privacy-first Analytics (Pageviews)

ExtensionShield tracks **page views** without storing IPs, user IDs, or other PII.

## Storage

### SQLite (default)

Table: `page_views_daily` (created automatically on first use):

- `day` TEXT (UTC, `YYYY-MM-DD`)
- `path` TEXT (route path like `/research`)
- `count` INTEGER
- Primary key: `(day, path)`

**⚠️ Production Warning**: SQLite files may be lost on ephemeral filesystems (e.g., Railway, Heroku, Docker containers without volumes). For production persistence, use Supabase (see below).

### Supabase (recommended for production)

To persist analytics in Supabase, create the table manually:

```sql
CREATE TABLE IF NOT EXISTS page_views_daily (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (day, path)
);

CREATE INDEX IF NOT EXISTS idx_page_views_day ON page_views_daily(day DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views_daily(path);
```

**Note**: The backend currently only writes to SQLite. Supabase support for analytics is planned for a future release.

## API

### POST `/api/telemetry/pageview`

Body:

```json
{ "path": "/research" }
```

Behavior:

- Server computes day in **UTC**
- Upserts `(day, path)` and increments `count`
- Returns `{ day, path, count }`
- **No authentication required** (privacy-first, no PII stored)
- Fails silently on frontend if API is down (doesn't break UI)

**Tracked paths** (examples):
- `/`
- `/scan`
- `/research`
- `/research/benchmarks`
- `/research/methodology`

### GET `/api/telemetry/summary?days=14`

Returns aggregated counts:

- `days`: number of days requested
- `start_day`: `YYYY-MM-DD` (inclusive)
- `end_day`: `YYYY-MM-DD` (inclusive)
- `by_day`: `{ "YYYY-MM-DD": total_count }` (summed across all paths)
- `by_path`: `{ "/research": total_count }` (summed across all days)
- `rows`: raw `[{ "day": "...", "path": "...", "count": 123 }]`

**⚠️ Security**: This endpoint is **currently open** but should be **admin-only in production**.

**Recommended production setup**:
- Add authentication middleware to `/api/telemetry/summary`
- Verify admin role via JWT or API key
- Consider rate limiting to prevent abuse
- Optionally restrict to specific IP ranges or VPN access

**Example admin check** (pseudo-code):
```python
@app.get("/api/telemetry/summary")
async def get_telemetry_summary(request: Request, days: int = 14):
    user_id = get_current_user_id(request)
    if not user_id or not is_admin(user_id):
        raise HTTPException(status_code=403, detail="Admin access required")
    # ... return summary
```

## Privacy Guarantees

- ✅ **No IP addresses** stored
- ✅ **No user IDs** stored
- ✅ **No cookies** or tracking pixels
- ✅ **No third-party analytics** (self-hosted only)
- ✅ **Aggregated data only** (daily counts, not individual sessions)

## Troubleshooting

**Issue**: Analytics not persisting in production

**Check**:
1. Verify SQLite database file path is writable and persistent
2. Check filesystem is not ephemeral (use volumes/mounted storage)
3. Monitor disk space (SQLite can grow over time)
4. Consider migrating to Supabase for production (see Storage section above)

**Issue**: Summary endpoint returns empty data

**Check**:
1. Verify `page_views_daily` table exists in database
2. Check if any pageviews have been recorded (`SELECT * FROM page_views_daily LIMIT 10`)
3. Verify `days` parameter is reasonable (default: 14, max: 365)
4. Check server logs for database errors

