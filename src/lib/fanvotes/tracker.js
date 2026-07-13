/**
 * Pure chart/leaderboard prep for the Fan Favorite tracker.
 * Chart geometry: x = index / (points-1), y = share on a fixed 0..yMax axis.
 */

// Top-N by current share get solid colored lines; the rest are dashed gray.
// Legacy rank palette, kept as the fallback when no colorMap is supplied.
export const LINE_COLORS = ["#1e3a5f", "#c0392b", "#1e7a4f", "#6b3fa0", "#e8940c"];

// Player-stable categorical palettes (color follows the entity, never its rank).
// Both validated with the dataviz palette checker: lightness band, chroma floor,
// adjacent-pair CVD separation, and contrast vs the light/dark chart surfaces.
export const PLAYER_COLORS = {
  light: ["#3b64d8", "#e8940c", "#8b4dd4", "#0f9b6c", "#d63a8a", "#22a3dd", "#c1a417", "#b8551f", "#16b5a8", "#a06be0"],
  dark: ["#5b7ee8", "#c08424", "#9a6cd8", "#1fa87a", "#e0559a", "#2f8fc0", "#a88f12", "#c05a80", "#1f9d92", "#8a68c8"],
};

// Deterministic player -> color assignment: sorted ids walk the palette, so a
// player keeps one hue all season regardless of rank, filter, or day.
export function playerColorMap(players, mode = "light") {
  const pal = PLAYER_COLORS[mode] || PLAYER_COLORS.light;
  const map = {};
  (players || [])
    .map((p) => p.id)
    .sort((a, b) => a - b)
    .forEach((id, i) => {
      map[id] = pal[i % pal.length];
    });
  return map;
}

// Competition-ranked standings rows: equal points (to 0.1) share a rank and the
// next rank skips (1, 2, 2, 4). Ties are ordered by name and flagged.
export function standingsRows(players) {
  const sorted = [...(players || [])].sort(
    (a, b) =>
      Number(b.points || 0) - Number(a.points || 0) ||
      String(a.name || "").localeCompare(String(b.name || ""))
  );
  let prevKey = null;
  let prevRank = 0;
  const rows = sorted.map((p, i) => {
    const key = (Number(p.points) || 0).toFixed(1);
    const rank = key === prevKey ? prevRank : i + 1;
    const row = { rank, tied: key === prevKey, player: p };
    prevKey = key;
    prevRank = rank;
    return row;
  });
  for (let i = 0; i < rows.length - 1; i++) {
    if (rows[i + 1].tied && rows[i + 1].rank === rows[i].rank) rows[i].tied = true;
  }
  return rows;
}

// Vertically separate overlapping chart end-faces. items: [{y, r}] in any
// order; returns adjusted y per item (same order), preserving top-to-bottom
// ordering with >= gap between circle edges, clamped inside [lo, hi].
export function dodgeYs(items, lo, hi, gap = 2) {
  const idx = items.map((it, i) => ({ y: it.y, r: it.r, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < idx.length; k++) {
    const need = idx[k - 1].y + idx[k - 1].r + idx[k].r + gap;
    if (idx[k].y < need) idx[k].y = need;
  }
  for (let k = idx.length - 1; k >= 0; k--) {
    const maxY =
      k === idx.length - 1 ? hi - idx[k].r : idx[k + 1].y - idx[k + 1].r - idx[k].r - gap;
    if (idx[k].y > maxY) idx[k].y = maxY;
    const minY = lo + idx[k].r;
    if (idx[k].y < minY) idx[k].y = minY;
  }
  const out = new Array(items.length);
  idx.forEach((it) => {
    out[it.i] = it.y;
  });
  return out;
}

// Group chart line ends whose faces would visually collide. Input:
// [{y, r, share}] ordered by ascending y (= descending share); adjacent ends
// chain when the gap between their circle edges is under `gap`, and chains
// then SPLIT on whole-percent boundaries (all the 3.x players share a row,
// the 4.x players get their own). Each cluster renders as one face row.
export function endClusters(items, gap = 2) {
  const chains = [];
  let current = null;
  items.forEach((it, i) => {
    if (current === null || it.y - items[i - 1].y >= items[i - 1].r + it.r + gap) {
      current = [i];
      chains.push(current);
    } else {
      current.push(i);
    }
  });
  const clusters = [];
  chains.forEach((chain) => {
    if (chain.length === 1) {
      clusters.push(chain);
      return;
    }
    let row = null;
    let bucket = null;
    chain.forEach((idx) => {
      const b = Math.floor(Number(items[idx].share ?? 0));
      if (row === null || b !== bucket) {
        row = [idx];
        clusters.push(row);
        bucket = b;
      } else {
        row.push(idx);
      }
    });
  });
  return clusters;
}

// Face positions for clustered line ends: every row is RIGHT-ALIGNED to a
// shared column edge (`alignX`), extending leftward, so faces form one tidy
// column regardless of row length; rows are vertically dodged apart and
// singles keep their own line-end y. Returns {x, y} keyed back to line order.
// lines: [{endX, endY, r}] in the SAME desc-share order used for endClusters.
export function clusterFaceLayout(lines, clusters, { lo, hi, alignX = null, maxSpread = 200, gap = 2 } = {}) {
  const rows = clusters.map((members) => {
    const r = Math.max(...members.map((i) => lines[i].r));
    const meanY = members.reduce((s, i) => s + lines[i].endY, 0) / members.length;
    // Facepile step: slight overlap keeps long rows compact; compress to fit.
    const step =
      members.length > 1
        ? Math.min(r * 1.5, maxSpread / (members.length - 1))
        : 0;
    return { members, r, y: meanY, step };
  });
  const dodged = dodgeYs(rows.map((row) => ({ y: row.y, r: row.r })), lo, hi, gap);
  const pos = {};
  rows.forEach((row, k) => {
    const n = row.members.length;
    row.members.forEach((lineIdx, j) => {
      const right = alignX ?? lines[lineIdx].endX + (n - 1) * row.step;
      pos[lineIdx] = { x: right - (n - 1 - j) * row.step, y: dodged[k] };
    });
  });
  return pos;
}

// Gutter width the right-aligned face column needs beyond the plot's right
// edge: the widest row plus a face radius of breathing room.
export function clusterGutter(clusters, radii, { maxSpread = 200 } = {}) {
  let need = 0;
  clusters.forEach((members) => {
    const r = Math.max(...members.map((i) => radii[i]));
    const step =
      members.length > 1 ? Math.min(r * 1.5, maxSpread / (members.length - 1)) : 0;
    need = Math.max(need, (members.length - 1) * step + r * 2 + 4);
  });
  return Math.ceil(need);
}

// "big-brother-26" / "bb17" -> "BB26" / "BB17"; unknown shapes -> "".
export function seasonShort(slug) {
  const m = /(?:^bb|big-brother-)(\d+)$/.exec(String(slug || "").toLowerCase());
  return m ? `BB${m[1]}` : "";
}

export function chartModel(payload, { topN = 5, width = 1000, height = 380, pad = 40, filterIds = null, colorMap = null } = {}) {
  const allPlayers = payload.players || [];
  // When filterIds is set, restrict lines to that set (preserving the payload's
  // points-desc order) and recompute the solid top-N within it. null = all.
  const players = filterIds
    ? allPlayers.filter((p) => filterIds.includes(p.id))
    : allPlayers;
  const series = payload.series || [];
  if (series.length === 0) return { lines: [], xLabels: [], yMax: 10 };

  const top = players.slice(0, topN).map((p) => p.id);
  const maxShare = Math.max(
    0,
    ...series.flatMap((s) => Object.values(s.shares || {}).map(Number))
  );
  // Fit the axis to the data (5% steps, ~10% headroom) so early-season
  // clustering fills the canvas instead of hugging the bottom of a 0-10 axis.
  const yMax = Math.max(5, Math.ceil((maxShare * 1.1) / 5) * 5);

  // A single snapshot centers horizontally instead of pinning to the left edge.
  const x = (i) =>
    series.length === 1 ? width / 2 : pad + (i / (series.length - 1)) * (width - pad * 2);
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
      color: isTop
        ? (colorMap?.[p.id] ?? LINE_COLORS[top.indexOf(p.id) % LINE_COLORS.length])
        : "#9ca3af",
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
