# Lessons Learned

Project-specific patterns and corrections to avoid repeating mistakes.

---

## Project Fundamentals

### JavaScript Only
**Rule:** Never use TypeScript (.ts/.tsx) in this project - user preference is JavaScript (.js/.jsx)

### Plugin Edit Location
**Rule:** Always edit WordPress plugin at `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\` - never use the deprecated `wp-plugin/` folder in bbj-app

### Database Access
**Rule:** Only query `duesaptjae` database for this project. Never touch `ca_db` (different project) or `bbj_db` (local dev, not used)

---

## Next.js Patterns

### Server vs Client Components
**Mistake:** Using async Server Components inside Client Components
**Rule:** If parent has "use client", only use Client Components or non-async Server Components. Use `ClientAdPlaceholder` instead of `AdPlaceholder` in client contexts.

### API Fetching
**Rule:** Always include `revalidate` option in API fetches. Use `bbjdFetch()` wrapper, not raw `fetch()`.

### Dynamic Routes
**Rule:** Set `dynamicParams = true` on all `[slug]` routes to allow on-demand page generation for new content.

---

## SEO

### Timestamps
**Rule:** Use `data-nosnippet` attribute on non-content dates (BB Time in header) to prevent Google from misreading as article dates.

---

## Corrections Log

<!--
Add new corrections here as they happen:

### YYYY-MM-DD: Brief Title
**Mistake:** What I did wrong
**Correction:** What user said to do instead
**Rule:** The pattern to follow going forward
-->
