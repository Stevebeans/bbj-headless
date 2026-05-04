# Lighthouse Score Log

Append new rows below. See [README.md](README.md) for testing methodology.

## Score History

### 2026-05-03 — Baseline (post-Vercel-optimization deploy, pre-home-page-redesign)

Tested local DevTools Lighthouse, mobile, after the May 3 production deploy that added FreestarSDKLoader (lazyOnload) + spoiler-bar layout removal + ISR audit.

| Site    | Perf  | A11y  | Best Prac | SEO   | FCP     | LCP     | TBT        | CLS      | Speed Idx |
| ------- | ----- | ----- | --------- | ----- | ------- | ------- | ---------- | -------- | --------- |
| **BBJ** | 🔴 34 | 🟢 97 | 🟡 77     | 🟢 92 | 🟢 1.5s | 🔴 4.9s | 🔴 3,380ms | 🟡 0.185 | 🔴 17.4s  |
| **BBN** | 🟡 54 | 🟡 88 | 🟡 69     | 🟢 92 | 🟡 2.2s | 🟡 2.7s | 🔴 6,070ms | 🟢 0.011 | _n/a_     |

**Observations from baseline:**

- BBJ wins on TBT (3.4s vs BBN's 6.1s) — main thread less blocked despite scoring lower overall
- BBJ wins on FCP (1.5s vs 2.2s) — initial paint is faster
- BBJ wins on Accessibility (97 vs 88) — clean semantic HTML
- BBN wins on LCP (2.7s vs 4.9s) — biggest gap, hero image likely better optimized
- BBN wins on CLS (0.011 vs 0.185) — ad slot heights better reserved
- BBN had IndexedDB warning — score may be slightly inflated; re-test for true clean number

**Where to focus next on BBJ:**

1. **LCP** is the biggest single Performance gain available — fix hero image (`priority` + dimensions) during home page redesign
2. **CLS** — investigate which slots aren't reserving height. Likely Primis video slot or in-content ads
3. TBT is already competitive — won't be the next big win

---

### Template for future entries (copy this when adding a new run)

```
### YYYY-MM-DD — [event/context, e.g., "post-home-page-redesign", "pre-BB28"]

| Site | Perf | A11y | Best Prac | SEO | FCP | LCP | TBT | CLS | Speed Idx |
|---|---|---|---|---|---|---|---|---|---|
| **BBJ** | XX | XX | XX | XX | X.Xs | X.Xs | X,XXXms | 0.XXX | X.Xs |
| **BBN** | XX | XX | XX | XX | X.Xs | X.Xs | X,XXXms | 0.XXX | X.Xs |

**Observations:**
- (what changed since last run, what got better/worse, theories why)

**Next focus:**
- (one specific thing to attack next)
```

## Color legend (for quick scan)

- 🟢 Good (90+) / Fast (FCP <1.8s, LCP <2.5s, TBT <200ms, CLS <0.1)
- 🟡 Needs work (50-89) / Borderline (FCP 1.8-3s, LCP 2.5-4s, TBT 200-600ms, CLS 0.1-0.25)
- 🔴 Poor (0-49) / Slow (FCP >3s, LCP >4s, TBT >600ms, CLS >0.25)
