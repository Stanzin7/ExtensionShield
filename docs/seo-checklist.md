# ExtensionShield — SEO Fix Checklist (Prioritized)

Use this with `docs/seo-audit.md`. Each item states what to change, where, and an example. No UI or routing changes.

---

## P0 — Must Do (Indexability, robots, sitemap, canonical, titles)

### P0-1. Fix sitemap coverage (add missing URLs)

- **What:** Add `/about`, `/community`, `/privacy-policy`, `/research/benchmarks` to the sitemap.
- **Where:** Either update `frontend/scripts/generate-sitemap.js` to include these four paths, or (preferred) drive sitemap from `getSitemapRoutes()` in `frontend/src/routes/routes.jsx` so the list stays in sync.
- **Example (quick fix in generate-sitemap.js):** Add to the `sitemapRoutes` array:
  - `{ path: '/about', priority: 0.7, changefreq: 'monthly' }`
  - `{ path: '/community', priority: 0.7, changefreq: 'monthly' }`
  - `{ path: '/privacy-policy', priority: 0.5, changefreq: 'monthly' }`
  - `{ path: '/research/benchmarks', priority: 0.7, changefreq: 'monthly' }`
  Then run `npm run generate:sitemap` and commit updated `frontend/public/sitemap.xml`.

### P0-2. Ensure robots.txt is correct and reachable

- **What:** Confirm production serves `robots.txt` with `Allow: /` and `Sitemap: https://extensionshield.com/sitemap.xml`; keep `Disallow: /settings` and `Disallow: /reports`.
- **Where:** `frontend/public/robots.txt` (already correct in repo). Verify in production: `curl -I https://extensionshield.com/robots.txt` and `curl https://extensionshield.com/robots.txt`.

### P0-3. Add canonical + default title/description for Privacy Policy

- **What:** Give `/privacy-policy` a per-route title, meta description, and canonical so it’s not only the index.html default.
- **Where:** `frontend/src/pages/PrivacyPolicyPage.jsx`.
- **Example:** Use `SEOHead` (preferred for OG/Twitter too) or at least `Helmet`:
  ```jsx
  import SEOHead from "../components/SEOHead";
  // Inside component return:
  <SEOHead
    title="Privacy Policy"
    description="ExtensionShield Privacy Policy — how we collect, use, and protect your data."
    pathname="/privacy-policy"
  />
  ```

### P0-4. Resolve OG image 404 (logo.png)

- **What:** Either add a `logo.png` (or equivalent) under `frontend/public/` for OG/Twitter, or point `getOGImage()` to an existing asset (e.g. `favicon-512x512.png`).
- **Where:** `frontend/src/utils/seoUtils.js` and/or `frontend/public/`.
- **Example (use existing favicon):**
  ```js
  export const getOGImage = (pathname = '/') => {
    return `${CANONICAL_DOMAIN}/favicon-512x512.png`;
  };
  ```
  Or add `frontend/public/logo.png` (1200×630 or similar) and keep current URL.

### P0-5. Default fallback title/description in index.html

- **What:** Keep a single, sensible default in `index.html` for first paint and for pages that don’t set meta (e.g. before React hydrates). Already present; ensure it’s the brand + value proposition.
- **Where:** `frontend/index.html`.
- **Example (current is fine):**
  ```html
  <title>ExtensionShield | Chrome Extension Scanner</title>
  <meta name="description" content="Paste a Chrome Web Store URL or extension ID and get a safety report in seconds. Free Chrome extension scanner for malware, privacy, and compliance." />
  ```

---

## P1 — Per-route meta (OG/Twitter), structured data, internal linking

### P1-1. Add OpenGraph + Twitter to all indexable content pages

- **What:** For every route that has `Helmet` with only title/description/canonical, add full OG and Twitter tags (og:title, og:description, og:image, og:url, og:type; twitter:card, twitter:title, twitter:description, twitter:image).
- **Where:** Replace raw `Helmet` with `SEOHead` in: ResearchPage, CaseStudiesPage, HoneyCaseStudyPage, MethodologyPage, BenchmarksPage, AboutUsPage, OpenSourcePage, CommunityLandingPage, GSoCIdeasPage, ContributePage, CommunityPage, BlogPage. Reuse route’s existing title/description/canonical; pass `pathname` so SEOHead can build og:url and canonical.
- **Example:** In `frontend/src/pages/research/ResearchPage.jsx`, replace:
  ```jsx
  <Helmet>
    <title>...</title>
    <meta name="description" content="..." />
    <link rel="canonical" href="https://extensionshield.com/research" />
  </Helmet>
  ```
  with:
  ```jsx
  <SEOHead
    title="Extension Threat Research & Case Studies | ExtensionShield"
    description="In-depth security research on Chrome extension threats, malware analysis, and case studies."
    pathname="/research"
  />
  ```
  (Use the same title/description as in `routes.jsx` seo block for consistency.)

### P1-2. Optional: noindex for non-public routes

- **What:** If `/settings`, `/reports`, `/auth/callback`, `/auth/diagnostics` should not be indexed, set `noindex` on those pages (e.g. via SEOHead with `noindex={true}` or a minimal Helmet with `<meta name="robots" content="noindex, nofollow" />`).
- **Where:** SettingsPage, ReportsPage, ReportDetailPage, AuthCallbackPage, AuthDiagnosticsPage.
- **Example:** In the component’s return, add:
  ```jsx
  <SEOHead title="Settings" description="Account settings." pathname="/settings" noindex />
  ```

### P1-3. Structured data (JSON-LD) on key pages

- **What:** Add Organization or WebSite schema where missing (e.g. About, Research landing). Homepage/Scanner/Enterprise/Glossary already have some schema.
- **Where:** AboutUsPage, ResearchPage, PrivacyPolicyPage (optional). Use `SEOHead`’s `schema` prop.
- **Example:** Pass `schema={organizationSchema}` to `SEOHead` on About page.

### P1-4. Internal linking

- **What:** Ensure key indexable pages (home, scan, research, enterprise, privacy, about) are linked from nav/footer so crawlers and users can discover them. Audit already assumes nav/footer exist; verify links use canonical paths and descriptive anchor text.

---

## P2 — Performance-related SEO (LCP/CLS), images, caching

### P2-1. LCP / CLS (Lighthouse)

- **What:** Improve LCP (e.g. hero image or main content), avoid layout shift (CLS). No change to routing or page structure required; optimize images, font loading, and above-the-fold content.
- **Where:** Hero sections, any large images, fonts in `index.html` (preconnect already present). Consider `fetchpriority="high"` for LCP image, `width`/`height` on images to reduce CLS.

### P2-2. Image optimization

- **What:** Serve OG image at recommended size (e.g. 1200×630), use appropriate format (e.g. PNG/WebP). Ensure `/favicon-512x512.png` or `/logo.png` is optimized if used for OG.
- **Where:** `frontend/public/` assets; `seoUtils.getOGImage()`.

### P2-3. Caching headers

- **What:** Cache static assets (JS, CSS, images) and optionally `sitemap.xml`/`robots.txt` at CDN/Cloudflare. Not in repo today; configure in Cloudflare or hosting.
- **Where:** Cloudflare Page Rules or Transform Rules, or `_headers` (e.g. Cache-Control for `/assets/*`, `/sitemap.xml`, `/robots.txt`).
- **Example (in `frontend/public/_headers`):**
  ```
  /sitemap.xml
    Cache-Control: public, max-age=3600
  /robots.txt
    Cache-Control: public, max-age=3600
  ```

---

## How to Verify

### Local commands

1. **Build and serve**
   ```bash
   cd frontend && npm run build && npm run preview
   ```
2. **Generate sitemap (after changing routes/script)**
   ```bash
   cd frontend && npm run generate:sitemap
   ```
3. **SEO smoke tests (if available)**
   ```bash
   cd frontend && npm run seo:test:local   # local
   npm run seo:test                        # production
   ```

### DevTools (Elements)

1. **Per-route title:** Navigate to a page; in Elements, check `<head>` → single `<title>` with expected text for that route.
2. **Meta description:** One `<meta name="description" content="...">` with the right content for the route.
3. **Canonical:** One `<link rel="canonical" href="https://extensionshield.com/...">` with the exact URL (no trailing slash except for `/`).
4. **OG:** `<meta property="og:title">`, `og:description`, `og:image`, `og:url`, `og:type` (and optionally `og:site_name`).
5. **Twitter:** `<meta name="twitter:card">`, `twitter:title`, `twitter:description`, `twitter:image`.
6. **No duplicate title/canonical:** Only one of each in `<head>` after React has run.

### Lighthouse (SEO tab)

1. Run Lighthouse (Chrome DevTools → Lighthouse → SEO).
2. Confirm: “Document has a meta description”, “Page has successful HTTP status”, “Links are crawlable”, “Page isn’t blocked from indexing”, “Valid hreflang” (if applicable).
3. Check “Meta tags” and “Structured data” sections for errors.
4. After OG fix: “Page has the optimal size for a social image” (e.g. 1200×630).

### Production checks

1. **robots.txt:** `curl https://extensionshield.com/robots.txt` — expect Allow, Sitemap, Disallow for /settings and /reports.
2. **sitemap:** `curl https://extensionshield.com/sitemap.xml` — expect XML with all indexable URLs including /about, /community, /privacy-policy, /research/benchmarks after P0-1.
3. **OG image:** Open a shared link in a social debugger (e.g. Facebook Sharing Debugger, Twitter Card Validator) and confirm image loads (no 404).

---

*Use this checklist after implementing the minimal fixes in Phase 3; re-run verification and Lighthouse to confirm.*
