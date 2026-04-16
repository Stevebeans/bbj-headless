# BBJ DNS Flip — Rollback Plan

## Pre-Flip Prep (T-48 hrs)

| When     | Action                                                                                   |
| -------- | ---------------------------------------------------------------------------------------- |
| T-48 hrs | Lower Cloudflare DNS TTL on `@` A record from default → **60 seconds**                   |
| T-24 hrs | Snapshot Vercel deployment ID (commit SHA) — record the working baseline                 |
| T-24 hrs | Verify WP staging server is healthy: `curl -I https://stg-wp.bigbrotherjunkies.com`      |
| T-1 hr   | Note current Cloudways DNS state (record exact A record value, proxy on/off)             |
| T-1 hr   | Open Vercel dashboard, Search Console, Freestar dashboard in tabs for live monitoring    |

## The Flip

**Current state:**
- `@` A record → `45.55.225.162` (Cloudways), Proxied via Cloudflare
- `staging` CNAME → `cname.vercel-dns.com`, DNS only

**Target state:**
- `@` CNAME → `cname.vercel-dns.com` (Vercel), DNS only
- `stg-wp` A → `45.55.225.162` (keep — WP staging stays alive)

**Note:** Vercel requires CNAME for apex (or A record to Vercel's anycast IPs `76.76.21.21`). If keeping the apex as A record, use Vercel's documented anycast IPs.

## Abort Triggers (Roll Back If…)

| Trigger                                              | Threshold                  | Source                        |
| ---------------------------------------------------- | -------------------------- | ----------------------------- |
| Homepage fully broken / 5xx                          | >2 min sustained           | Vercel logs + manual check    |
| Single-post pages 5xx                                | >5% error rate             | Vercel function logs          |
| Comment system broken (can't post / can't load)      | Confirmed                  | Manual test                   |
| Ad revenue drop                                      | >40% vs hourly baseline    | Freestar dashboard            |
| Vercel function-hours burn                           | >$50 in first 6 hrs        | Vercel Spend Management alert |
| Search Console crawl errors                          | >500 net new 404s in 24 hr | Google Search Console         |
| WP API unreachable from Vercel                       | Sustained 502/504          | Vercel function logs          |

**Not abort triggers** (expected, monitor only): minor CLS regressions, occasional cold starts on BB21-era pages, individual 404s for legitimately-deleted content.

## Rollback Procedure (Cloudflare DNS)

**Time to recover: ~5-10 min after DNS changes propagate (TTL=60s).**

1. **Cloudflare → DNS → Records** for `bigbrotherjunkies.com`
2. **Edit the `@` record:**
   - Change back to: A record, content `45.55.225.162`
   - Proxy: **Proxied** (orange cloud)
3. **Save.** TTL is 60s, so propagation is fast.
4. **Verify:**
   ```bash
   dig +short bigbrotherjunkies.com
   # Should return Cloudflare's edge IPs (proxied), or 45.55.225.162 if not proxied
   curl -I https://bigbrotherjunkies.com
   # Should return 200 from WP/nginx, not Vercel
   ```
5. **Vercel:** Don't touch the project — leave the deployment in place for retry analysis.
6. **Communicate:** post in Twitter/Discord if downtime exceeded 5 min.

## Post-Rollback

| Step | Action                                                                                                      |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| 1    | Capture Vercel logs from the failure window (last 1 hr of function invocations + build logs)                |
| 2    | Capture Search Console URL Inspection on any newly-404'd URL                                                |
| 3    | Identify root cause before retry. Common: WP API auth, image domain whitelist, missing route, ISR timeouts. |
| 4    | Fix on `staging` branch, test thoroughly at `staging.bigbrotherjunkies.com`                                 |
| 5    | Re-attempt flip ONLY after addressing the abort trigger                                                     |
| 6    | Bump DNS TTL back to default (3600s) once stable for >48 hrs                                                |

## Validation Timeline (Post-Flip)

| Time   | Check                                                                          |
| ------ | ------------------------------------------------------------------------------ |
| T+15m  | Smoke test: home, 1 post, 1 player, 1 season, /live-feed-updates, /tag/bb19    |
| T+1hr  | Vercel function-hours burn rate; Freestar revenue trend; Search Console errors |
| T+6hr  | Spend Management alerts clear; ad CPM tracking; comment posts working          |
| T+24hr | Search Console crawl stats; new 404 spike (compare to baseline)                |
| T+7d   | SEO ranking impact (top 20 keywords vs pre-flip baseline)                      |

## Solo-Operator Notes

- **You are the only person flipping the switch.** No team, no escalation. If you can't fix in 30 min, roll back.
- **Don't flip during sleep.** Window: morning, with 8+ hrs of awake-time after flip.
- **Don't flip during a live BB episode** (Wed/Thu/Sun nights). Pick Mon/Tue daytime.
- **Don't flip during a merge freeze.** Check `.claude/projects/` for active blocks.
- **The flip is reversible in <10 min.** Don't hesitate to roll back — failed flips are normal.

## Vercel-Specific Safeguards

- Spend Management caps must be set BEFORE flip (item #11 in migrate.md)
- Fluid Compute enabled — keeps function-hours billing flat under sudden traffic
- ISR with revalidate=60-3600 means static cache absorbs traffic spikes
- `/compare/` already disallowed in robots.js (prevented prior cost spike)

## Quick Reference: DNS Records

**Pre-flip (current production):**
```
@        A      45.55.225.162           Proxied
www      CNAME  bigbrotherjunkies.com   Proxied
staging  CNAME  cname.vercel-dns.com    DNS only
stg-wp   A      45.55.225.162           DNS only
```

**Post-flip target:**
```
@        CNAME  cname.vercel-dns.com    DNS only   ← changed
www      CNAME  cname.vercel-dns.com    DNS only   ← changed
staging  CNAME  cname.vercel-dns.com    DNS only   (unchanged)
stg-wp   A      45.55.225.162           DNS only   (unchanged — WP backend stays here)
```

**Rollback target (revert apex/www):**
```
@        A      45.55.225.162           Proxied    ← revert
www      CNAME  bigbrotherjunkies.com   Proxied    ← revert
```
