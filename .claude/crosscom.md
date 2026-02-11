# Cross-Machine Communication

Messages between PC and Laptop for Claude Code sessions.

---

## Unread Messages

### From: PC → Laptop
**Date:** 2026-02-10
**Status:** UNREAD
**Subject:** Work on Staging Branch — Main has been merged in

**IMPORTANT:** Make sure you're on the `staging` branch before doing any work. Run:

```bash
git fetch && git checkout staging && git pull
```

Main was merged into staging today (Feb 10). Staging now includes:
- Player comparison pages with premium gating and 4 discovery methods
- Interactive player map with Leaflet clustering and dark mode support

All new work should be done on `staging` until further notice.

---

### From: PC → Laptop
**Date:** 2026-02-08
**Status:** UNREAD
**Subject:** Session Handoff — Subscriptions Page + Auth Fix Deployed to Production

Big session today. Here's what was done:

1. **WP Admin Subscriptions Page** — Full implementation deployed. WP Admin > BBJ Data > Subscriptions. Stats cards, filter tabs, data table, cancel actions (end-of-cycle + immediate), manual status override. Also fixed `cancelSubscription($immediate)` which was previously ignoring the param.

2. **Auth/Me Endpoint Created** — `GET /bbjd/v1/auth/me` was MISSING. This caused `refreshUser()` to silently fail, meaning supporter status didn't update across the site after subscribing (only showed after logout/login/refresh). Now fixed — endpoint returns fresh user data from DB.

3. **Hall of Fame** — Added to roadmap Phase 6.2 with "In Memoriam" section for deceased comment moderator.

4. **Full push to production** — Everything merged to main, Vercel deployed, WP plugin deployed via SSH.

**Known pending issues:**
- Stripe webhook URL needs fixing (stg-bigbrotherjunkies.com → stg-wp.bigbrotherjunkies.com)
- Test account may still have dual subscriber+supporter roles
- PayPal sandbox buyer account needed for testing
- Latent auth inconsistency: email/password JWT has roles at `payload.user_roles` (top level) vs SSR expects `payload.data?.user?.roles` (nested). Works via bbj_user cookie cache fallback.

**Read:** `.claude/history/2026-02-08.md` for full details.

---

### From: PC → Laptop
**Date:** 2026-02-03
**Status:** UNREAD
**Subject:** Copy global CLAUDE.md from PC

The global `~/.claude/CLAUDE.md` file (user-level instructions) doesn't sync via git — it lives outside the repo. Remind the user to copy it from the PC to this laptop so both machines have identical Claude behavior.

The file contains:
1. **Context7 MCP rule** — Use Context7 server for docs lookup instead of training data
2. **Code-simplifier rule** — Auto-run `/code-simplifier` after builds/implementations

**Action:** Ask the user to copy `C:\Users\sbeli\.claude\CLAUDE.md` from the PC to the same path on this laptop. Or have them paste the contents so you can write it.

---

## Read Messages

### From: PC → Laptop (RESOLVED)
**Date:** 2026-01-30
**Status:** RESOLVED
**Subject:** SSH Credentials Needed for Plugin Deployment

~~Original request for SSH credentials.~~

**Resolution:** Found existing `cloudways_deploy` SSH key at `~/.ssh/cloudways_deploy` was already authorized on the server. SSH config updated with `bbj-prod` and `bbj-staging` aliases. Deployment script created at `.claude/scripts/deploy-plugin.sh`.

---

## How to Use This File

**When you receive a message:**
1. Read the message in "Unread Messages"
2. Take the requested action
3. Move the message to "Read Messages" section
4. Optionally add a reply message back

**When you want to send a message:**
1. Add a new message under "Unread Messages"
2. Include: Date, Status (UNREAD), Subject, and your message
3. The other machine will see it when they sync and start a Claude session
