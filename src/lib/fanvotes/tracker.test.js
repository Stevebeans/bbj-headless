import { describe, it, expect } from "vitest";
import { chartModel, thinLabels, formatDelta, LINE_COLORS, slotPointsFor, BALLOT_SLOT_POINTS } from "./tracker";

describe("chartModel", () => {
  const payload = {
    players: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Cara" },
      { id: 4, name: "Deven" },
      { id: 5, name: "Eli" },
      { id: 6, name: "Finn" },
    ],
    series: [
      { date: "Jul 1", shares: { 1: 20, 2: 15, 3: 10, 4: 5, 5: 3, 6: 1 } },
      { date: "Jul 2", shares: { 1: 25, 2: 18, 3: 12, 4: 6, 5: 4, 6: 2 } },
      { date: "Jul 3", shares: { 1: 30, 2: 20, 3: 14, 4: 7, 5: 5, 6: 3 } },
    ],
  };

  it("returns one line per player", () => {
    const model = chartModel(payload);
    expect(model.lines).toHaveLength(6);
  });

  it("marks top-N players (by players order, default topN=5) as solid, rest dashed", () => {
    const model = chartModel(payload);
    // players[0..4] are the top 5 (indices 0-4), players[5] (id 6) is not
    const solids = model.lines.filter((l) => l.solid);
    const dashed = model.lines.filter((l) => !l.solid);
    expect(solids).toHaveLength(5);
    expect(dashed).toHaveLength(1);
    expect(dashed[0].player.id).toBe(6);
  });

  it("assigns LINE_COLORS to top players in order, gray to the rest", () => {
    const model = chartModel(payload);
    expect(model.lines[0].color).toBe(LINE_COLORS[0]);
    expect(model.lines[1].color).toBe(LINE_COLORS[1]);
    expect(model.lines[4].color).toBe(LINE_COLORS[4]);
    expect(model.lines[5].color).toBe("#9ca3af");
  });

  it("respects a custom topN", () => {
    const model = chartModel(payload, { topN: 2 });
    const solids = model.lines.filter((l) => l.solid);
    expect(solids).toHaveLength(2);
    expect(solids.map((l) => l.player.id)).toEqual([1, 2]);
  });

  it("returns empty lines/labels and yMax=10 when series is empty", () => {
    const model = chartModel({ players: [{ id: 1 }], series: [] });
    expect(model.lines).toEqual([]);
    expect(model.xLabels).toEqual([]);
    expect(model.yMax).toBe(10);
  });

  it("does not divide by zero with a single-point series (points centered)", () => {
    const singlePayload = {
      players: [{ id: 1 }, { id: 2 }],
      series: [{ date: "Jul 1", shares: { 1: 10, 2: 5 } }],
    };
    const model = chartModel(singlePayload, { pad: 40 });
    expect(model.lines).toHaveLength(2);
    for (const line of model.lines) {
      expect(line.points).toHaveLength(1);
      expect(Number.isFinite(line.points[0].x)).toBe(true);
      expect(Number.isFinite(line.points[0].y)).toBe(true);
      expect(line.points[0].x).toBe(500); // width/2: a lone snapshot centers horizontally
    }
  });

  it("fits yMax to the data in 5% steps with ~10% headroom", () => {
    const model = chartModel(payload);
    // max share in fixture is 30 -> 33 with headroom -> next 5 step = 35
    expect(model.yMax).toBe(35);
  });

  it("rounds yMax up to the next 5 step above the padded max share", () => {
    const p = {
      players: [{ id: 1 }],
      series: [{ date: "Jul 1", shares: { 1: 22 } }],
    };
    const model = chartModel(p);
    // 22 * 1.1 = 24.2 -> next 5 step = 25
    expect(model.yMax).toBe(25);
  });

  it("floors yMax at 5 even when all shares are near zero", () => {
    const p = {
      players: [{ id: 1 }],
      series: [{ date: "Jul 1", shares: { 1: 0.5 } }],
    };
    const model = chartModel(p);
    expect(model.yMax).toBe(5);
  });

  it("treats missing shares for a player/date as 0", () => {
    const p = {
      players: [{ id: 1 }, { id: 2 }],
      series: [
        { date: "Jul 1", shares: { 1: 10 } },
        { date: "Jul 2", shares: { 1: 12, 2: 4 } },
      ],
    };
    const model = chartModel(p);
    const line2 = model.lines.find((l) => l.player.id === 2);
    // first point for player 2 should be computed from share 0
    const height = 380;
    const pad = 40;
    const yMax = model.yMax;
    const expectedYAtZero = height - pad - (0 / yMax) * (height - pad * 2);
    expect(line2.points[0].y).toBeCloseTo(expectedYAtZero, 5);
  });

  it("builds xLabels from series dates", () => {
    const model = chartModel(payload);
    expect(model.xLabels).toEqual(["Jul 1", "Jul 2", "Jul 3"]);
  });

  it("filterIds null keeps current behavior (all players get lines)", () => {
    const model = chartModel(payload, { filterIds: null });
    expect(model.lines).toHaveLength(6);
    expect(model.lines.filter((l) => l.solid)).toHaveLength(5);
  });

  it("filterIds limits lines to only the given players", () => {
    const model = chartModel(payload, { filterIds: [2, 4] });
    expect(model.lines).toHaveLength(2);
    expect(model.lines.map((l) => l.player.id).sort((a, b) => a - b)).toEqual([2, 4]);
  });

  it("recomputes solid top-N and colors WITHIN the filtered set", () => {
    // Filter to ids 3,4,5,6 (players pre-sorted, so filtered order is [3,4,5,6]).
    // Default topN=5 -> all four are solid; colors assigned in filtered order.
    const model = chartModel(payload, { filterIds: [3, 4, 5, 6] });
    expect(model.lines.filter((l) => l.solid)).toHaveLength(4);
    expect(model.lines[0].player.id).toBe(3);
    expect(model.lines[0].color).toBe(LINE_COLORS[0]);
    expect(model.lines[1].color).toBe(LINE_COLORS[1]);
    expect(model.lines[3].color).toBe(LINE_COLORS[3]);
  });

  it("applies topN within the filtered set (rest dashed gray)", () => {
    const model = chartModel(payload, { filterIds: [2, 3, 4], topN: 2 });
    const solids = model.lines.filter((l) => l.solid);
    const dashed = model.lines.filter((l) => !l.solid);
    expect(solids.map((l) => l.player.id)).toEqual([2, 3]);
    expect(dashed.map((l) => l.player.id)).toEqual([4]);
    expect(dashed[0].color).toBe("#9ca3af");
  });

  it("an empty filterIds array yields no lines (e.g. nobody in the house)", () => {
    const model = chartModel(payload, { filterIds: [] });
    expect(model.lines).toEqual([]);
  });
});

describe("thinLabels", () => {
  it("returns all labels unchanged when count <= maxTicks", () => {
    const dates = ["Jul 1", "Jul 2", "Jul 3"];
    const result = thinLabels(dates, 7);
    expect(result).toEqual([
      { date: "Jul 1", index: 0 },
      { date: "Jul 2", index: 1 },
      { date: "Jul 3", index: 2 },
    ]);
  });

  it("thins to roughly maxTicks and always keeps the last label", () => {
    const dates = Array.from({ length: 30 }, (_, i) => `day-${i}`);
    const result = thinLabels(dates, 7);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(30);
    const last = result[result.length - 1];
    expect(last.date).toBe("day-29");
    expect(last.index).toBe(29);
  });

  it("keeps the last label even when it doesn't land on the step", () => {
    // 22 items, default maxTicks=7 -> step = ceil(22/7) = 4
    // indices kept by step: 0,4,8,12,16,20 -- 21 (last) isn't on-step, but must still be included
    const dates = Array.from({ length: 22 }, (_, i) => `d${i}`);
    const result = thinLabels(dates, 7);
    const indices = result.map((r) => r.index);
    expect(indices).toContain(21);
    expect(indices[indices.length - 1]).toBe(21);
  });

  it("defaults maxTicks to 7", () => {
    const dates = Array.from({ length: 10 }, (_, i) => `d${i}`);
    const result = thinLabels(dates);
    expect(result.length).toBeLessThan(10);
  });
});

describe("formatDelta", () => {
  it("formats a positive delta with a leading + and 'up' direction", () => {
    expect(formatDelta(2.456)).toEqual({ text: "+2.5%", dir: "up" });
  });

  it("formats a negative delta with the sign preserved and 'down' direction", () => {
    expect(formatDelta(-3.14)).toEqual({ text: "-3.1%", dir: "down" });
  });

  it("formats zero as an em dash with 'flat' direction", () => {
    expect(formatDelta(0)).toEqual({ text: "—", dir: "flat" });
  });

  it("treats non-numeric input as zero/flat", () => {
    expect(formatDelta(undefined)).toEqual({ text: "—", dir: "flat" });
    expect(formatDelta(null)).toEqual({ text: "—", dir: "flat" });
    expect(formatDelta("not-a-number")).toEqual({ text: "—", dir: "flat" });
  });

  it("formats string numbers correctly", () => {
    expect(formatDelta("5.2")).toEqual({ text: "+5.2%", dir: "up" });
  });
});

describe("slotPointsFor", () => {
  it("returns the top-heavy decay values for the first five slots", () => {
    expect([0, 1, 2, 3, 4].map(slotPointsFor)).toEqual([15, 10, 7, 5, 3]);
    expect(BALLOT_SLOT_POINTS).toEqual([15, 10, 7, 5, 3]);
  });
  it("returns 1 point for slot six and below", () => {
    expect(slotPointsFor(5)).toBe(1);
    expect(slotPointsFor(15)).toBe(1);
  });
});
