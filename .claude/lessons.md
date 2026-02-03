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

## Workflow

### Context Files on Plan Approval
**Mistake:** Built entire user profiles feature without writing context files until user pointed it out at end of session
**Correction:** Write context files IMMEDIATELY when user approves a plan, before writing any code
**Rule:** On plan approval → (1) create/update `.claude/history/YYYY-MM-DD.md` with plan summary, (2) create `.claude/projects/context-[projectname].md` with architecture details. Code comes AFTER.

---

## Corrections Log

### 2026-02-02: Forgot context files for user profiles
**Mistake:** Completed entire user profiles implementation without writing history or project context until reminded
**Correction:** User asked "did you write anything for context?" - had to backfill after the fact
**Rule:** Context files are step 1 after plan approval, not an afterthought at session end

### 2026-02-03: No daily history written despite full day of work
**Mistake:** 7 commits across 7 hours with plan mode sessions, zero history entries written. Previous session made the exact same mistake with context files.
**Correction:** User pointed out nothing was logged despite workflow step 7 being explicit about it
**Rules:**
1. Context files on plan approval is MANDATORY, not aspirational. This was already a lesson from yesterday and was ignored again.
2. On every context compaction, write a checkpoint to `.claude/history/YYYY-MM-DD.md` - this makes history logging automatic rather than relying on memory
3. After every commit, add a brief entry to daily history - commits are natural checkpoints
4. If you realize you haven't written to history in a while, do it NOW before continuing other work
