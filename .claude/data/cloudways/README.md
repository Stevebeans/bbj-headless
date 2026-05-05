# Cloudways Server Stats Tracking

Long-term log of server resource usage to inform sizing decisions. Collected monthly via reminder routine; key context: BB28 starts July 2026 — peak load expected Thursday nights.

## Why this exists

Currently paying $99/mo for an 8 GB / 4-core / 160 GB Cloudways server. Real CPU usage is ~15% peak. Real RAM usage is ~330 MB across all apps. **The box is wildly over-provisioned for normal load** — but we don't know what BB28 peak (Thursday live shows, 2-3k concurrent users) will actually look like with the new Vercel-front-end architecture absorbing most traffic.

End goal: gather a year of monthly snapshots to make a confident downsizing decision off-season.

## Filing convention

Save monthly screenshot exports as: `YYYY-MM.png` (or `.jpg`)
- e.g., `2026-05.png` for May 2026

If multiple screenshots in a month (peak event, anomaly), append a label:
- `2026-07-finale.png`
- `2026-08-anomaly-spike.png`

## What to capture each month

From Cloudways → Server → Monitoring tab, set range to **Last Month**, screenshot:
1. CPU usage chart
2. RAM usage chart
3. Bandwidth chart
4. Disk usage (just the current number is enough)

Optional: Application-Wise breakdown if anything looks unusual.

## Stats Log

Add a row each month with key observations. Fill in actual numbers after taking the screenshot.

| Month | Peak CPU% | Peak RAM% | Bandwidth (GB) | Disk used (GB) | Notes |
|---|---|---|---|---|---|
| 2026-05 | _TBD_ | _TBD_ | _TBD_ | 55.91 | Baseline. Pre-BB28. Vercel optimization just shipped. |

## Decision triggers to watch for

Flag these if observed and revisit sizing immediately, not at year-end:
- Sustained CPU > 60% for >1 hour
- RAM > 70% sustained
- Disk > 80% (currently 36%)
- Bandwidth approaching 5 TB/mo cap (currently using ~50 GB/mo, so massive headroom)

If none of these trip during BB28 peak: confidence to downgrade off-season is high.
