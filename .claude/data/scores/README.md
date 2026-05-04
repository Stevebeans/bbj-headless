# Lighthouse Score Tracking — BBJ vs Competitors

Long-term log of Lighthouse scores for BBJ and competitor sites. Both BBJ and BigBrotherNetwork (BBN) use Freestar — apples-to-apples comparison on ad-running performance.

## Why this exists

Track BBJ Lighthouse scores over time alongside the #1 competitor (BBN), so we can:

1. Measure whether each optimization actually moves the needle
2. See how BBJ stacks up in real terms — not just absolute scores but relative to a site running the same ad stack
3. Identify what BBN does well that BBJ doesn't (and vice versa)

## How to test

Always test under the same conditions for comparable numbers:

| Setting    | Value                                              |
| ---------- | -------------------------------------------------- |
| Browser    | Chrome **incognito** (extensions skew results)     |
| Tool       | DevTools → Lighthouse tab                          |
| Device     | Mobile (matches PSI default + most real traffic)   |
| Categories | Performance + Accessibility + Best Practices + SEO |
| Throttling | Default (Simulated Slow 4G + 4× CPU slowdown)      |
| Cache      | Clear storage before run                           |

**Run from incognito.** If Lighthouse warns "stored data may be affecting performance" — that result is not comparable to a clean run. Re-run in fresh incognito.

## Files in this folder

- `scores.md` — main tracking table (append rows over time)
- `bbj-YYYY-MM-DD.png` — optional raw screenshots of BBJ runs
- `bbn-YYYY-MM-DD.png` — optional raw screenshots of BBN runs

## What to look at

The Performance number is the headline, but the **individual metrics** tell the real story:

| Metric      | What it measures                   | Lighthouse weight        |
| ----------- | ---------------------------------- | ------------------------ |
| FCP         | First text/image visible           | 10%                      |
| LCP         | Largest meaningful content visible | 25%                      |
| TBT         | Main thread blocked time           | **30%** ← biggest weight |
| CLS         | Layout shift / jumpy content       | 25%                      |
| Speed Index | Visual progress over time          | 10%                      |

When comparing to BBN, look for **where BBJ wins and where BBN wins**. If BBN crushes us on CLS but we crush them on TBT, that tells us specifically what to attack next.
