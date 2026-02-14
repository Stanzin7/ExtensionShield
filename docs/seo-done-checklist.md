# SEO work — done vs remaining

Quick checklist of what’s been done in the codebase and what’s left for production/you.

---

## Done (in repo)

### Audit & docs
- [x] **docs/seo-audit.md** — Phase 1 audit (findings, route table, what’s missing)
- [x] **docs/seo-checklist.md** — P0/P1/P2 fix list with examples
- [x] **docs/seo-verification-production.md** — Production verification (curl, page source, GSC, Cloudflare WAF)
- [x] **docs/seo-done-checklist.md** — This file

### Sitemap & robots
- [x] Sitemap generated **from routes.jsx** (single source of truth; no drift)
- [x] All indexable routes in sitemap (incl. `/about`, `/community`, `/privacy-policy`, `/research/benchmarks`)
- [x] **`<lastmod>`** on every URL (YYYY-MM-DD, build date)
- [x] **frontend/public/robots.txt** — Allow `/`, Sitemap line, Disallow `/settings`, `/reports`

### Meta & SEO per page
- [x] **Privacy Policy** — SEOHead with title, description, pathname, Organization JSON-LD
- [x] **All indexable content pages** — Raw Helmet replaced with SEOHead (research/, about, open-source, community, contribute, gsoc/) — titles/descriptions/canonicals kept; OG + Twitter added
- [x] **Noindex** — SEOHead with `noindex` on Settings, Reports, Report detail, Auth callback/diagnostics, Scan progress, Scan results (all states), Scan results dashboard
- [x] **index.html** — Default title + meta description (unchanged)

### OG image & tags
- [x] **frontend/public/og.png** — 1200×630; used for og:image
- [x] **seoUtils.js** — `getOGImage()` returns `…/og.png`; `getOGTags()` includes `og:image:width` and `og:image:height`

### Headers & cache
- [x] **frontend/public/_headers** — Cache-Control for `/sitemap.xml`, `/robots.txt`, `/og.png` (CSP unchanged)

### Verification doc updates
- [x] robots.txt note: Cloudflare Managed Content blocks (AI crawlers) — expected; doesn’t affect Googlebot
- [x] Sitemap check: every `<url>` must include `<lastmod>`; redeploy if missing in production
- [x] **Sitemap/robots fetch reliability** — Section on WAF/bot protection; Cloudflare custom rule to allow verified bots (`cf.client.bot`) for `/sitemap.xml` and `/robots.txt`
- [x] Quick reference + GSC troubleshooting link for “Sitemap could not be read”

---

## Remaining (your side / production)

### Deploy
- [ ] **Redeploy** so production serves the latest `public/sitemap.xml` (with lastmod and all URLs) and `public/og.png`, `public/_headers`, etc.

### Cloudflare
- [ ] **WAF custom rule** — Allow (or skip WAF for) verified bots for `/sitemap.xml` and `/robots.txt` so Googlebot isn’t challenged. See [seo-verification-production.md — Sitemap/robots fetch reliability](seo-verification-production.md#sitemaprobots-fetch-reliability-waf--bot-protection).

### Google Search Console
- [ ] **Submit sitemap** — `https://extensionshield.com/sitemap.xml`; confirm “Success”
- [ ] **URL Inspection** — For `/about`, `/research/benchmarks`, `/privacy-policy`: confirm “Indexed”, “Crawled as Googlebot”, and rendered HTML contains main content

### Optional
- [ ] Confirm **Twitter handle** `@ExtensionShield` in `seoUtils.js` is correct (or remove/update)
- [ ] P2 items in seo-checklist.md (LCP/CLS, image optimization, cache headers at CDN) if you want to go further

---

## One-line summary

**Code:** Sitemap from routes + lastmod, full meta/OG/Twitter on indexable pages, noindex on private/dynamic pages, og.png + Cache-Control, verification docs. **You:** Redeploy, add Cloudflare WAF rule for bots on sitemap/robots, submit sitemap and check indexing in GSC.
