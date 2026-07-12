/**
 * Pure chart/leaderboard prep for the Fan Favorite tracker.
 * Chart geometry: x = index / (points-1), y = share on a fixed 0..yMax axis.
 */

// Top-N by current share get solid colored lines; the rest are dashed gray.
export const LINE_COLORS = ["#1e3a5f", "#c0392b", "#1e7a4f", "#6b3fa0", "#e8940c"];

export function chartModel(payload, { topN = 5, width = 1000, height = 380, pad = 40 } = {}) {
  const players = payload.players || [];
  const series = payload.series || [];
  if (series.length === 0) return { lines: [], xLabels: [], yMax: 10 };

  const top = players.slice(0, topN).map((p) => p.id);
  const maxShare = Math.max(
    10,
    ...series.flatMap((s) => Object.values(s.shares || {}).map(Number))
  );
  const yMax = Math.ceil(maxShare / 10) * 10;

  const x = (i) =>
    pad + (series.length === 1 ? 0 : (i / (series.length - 1)) * (width - pad * 2));
  const y = (share) => height - pad - (share / yMax) * (height - pad * 2);

  const lines = players.map((p, idx) => {
    const pts = series.map((s, i) => ({ x: x(i), y: y(Number(s.shares?.[p.id] ?? 0)) }));
    const isTop = top.includes(p.id);
    return {
      player: p,
      points: pts,
      path: pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" "),
      end: pts[pts.length - 1],
      solid: isTop,
      color: isTop ? LINE_COLORS[top.indexOf(p.id) % LINE_COLORS.length] : "#9ca3af",
    };
  });

  return { lines, xLabels: series.map((s) => s.date), yMax, x, y };
}

// "Jul 10" style tick labels, thinned to ~7 across the range.
export function thinLabels(dates, maxTicks = 7) {
  if (dates.length <= maxTicks) return dates.map((d, i) => ({ date: d, index: i }));
  const step = Math.ceil(dates.length / maxTicks);
  return dates.map((d, i) => ({ date: d, index: i })).filter((_, i) => i % step === 0 || i === dates.length - 1);
}

export function formatDelta(d) {
  const n = Number(d) || 0;
  if (n > 0) return { text: `+${n.toFixed(1)}%`, dir: "up" };
  if (n < 0) return { text: `${n.toFixed(1)}%`, dir: "down" };
  return { text: "—", dir: "flat" };
}

// Ballot slot values (mirror of the plugin's FanVoteMath::SLOT_POINTS).
export const BALLOT_SLOT_POINTS = [15, 10, 7, 5, 3];

// Points for a 0-based ballot index: 15/10/7/5/3, then 1 for everyone below.
export function slotPointsFor(index) {
  return index < BALLOT_SLOT_POINTS.length ? BALLOT_SLOT_POINTS[index] : 1;
}
