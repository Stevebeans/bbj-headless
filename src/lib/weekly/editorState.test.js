import { describe, it, expect } from "vitest";
import { deriveActiveIds, weekToForm, collectJuryVotes, formToPayload } from "./editorState.js";

const weeks = [
  {
    id: 11, week_num: 1,
    players: [
      { player_id: 101, nom: 0, evicted: 0, havenot: 0, voted_for: 0, saved_by_player_id: null, vote_to_win_for: null },
      { player_id: 103, nom: 1, evicted: 1, havenot: 1, voted_for: 0, saved_by_player_id: null, vote_to_win_for: 101 },
      { player_id: 104, nom: 1, evicted: 0, havenot: 1, voted_for: 103, saved_by_player_id: 102, vote_to_win_for: null },
    ],
    comps: [
      { player_id: 101, comp_type_id: 1, slug: "hoh", notes: null },
      { player_id: 102, comp_type_id: 2, slug: "pov", notes: null },
      { player_id: 106, comp_type_id: 9, slug: "ai-arena", notes: "AI Arena" },
    ],
    summary: "wk one", start_date: "2026-07-10", end_date: null,
  },
  { id: 12, week_num: 2, players: [{ player_id: 105, nom: 1, evicted: 1, voted_for: 0, saved_by_player_id: null, vote_to_win_for: 102 }], comps: [] },
];

describe("deriveActiveIds", () => {
  it("removes players evicted in earlier weeks only", () => {
    const roster = [101, 102, 103, 104, 105];
    expect(deriveActiveIds(roster, weeks, 2)).toEqual([101, 102, 104, 105]); // 103 out after wk1
    expect(deriveActiveIds(roster, weeks, 1)).toEqual(roster);               // wk1: everyone in
    expect(deriveActiveIds(roster, weeks, 3)).toEqual([101, 102, 104]);      // 105 out after wk2
  });
});

describe("weekToForm", () => {
  it("maps rows back to form state", () => {
    const form = weekToForm(weeks[0]);
    expect(form.hoh).toBe(101);
    expect(form.pov).toBe(102);
    expect(form.noms).toEqual([103, 104]);
    expect(form.vetoUsedOn).toBe(104); // row with saved_by_player_id
    expect(form.evicted).toEqual([103]);
    expect(form.havenot).toEqual([103, 104]);
    expect(form.votes).toEqual({ 104: 103 });
    expect(form.miscComps).toEqual([{ player_id: 106, comp_type_id: 9, notes: "AI Arena" }]);
    expect(form.summary).toBe("wk one");
    expect(form.startDate).toBe("2026-07-10");
    expect(form.endDate).toBe("");
  });
});

describe("collectJuryVotes", () => {
  it("gathers vote_to_win_for across all weeks", () => {
    expect(collectJuryVotes(weeks)).toEqual({ 103: 101, 105: 102 });
  });
});

describe("formToPayload", () => {
  it("round-trips a form into the save payload", () => {
    const form = weekToForm(weeks[0]);
    const payload = formToPayload(form, [101, 102, 104, 105, 106]);
    expect(payload).toEqual({
      active: [101, 102, 104, 105, 106],
      hoh: 101, pov: 102,
      noms: [103, 104],
      veto_used_on: 104,
      evicted: [103],
      havenot: [103, 104],
      votes: { 104: 103 },
      misc_comps: [{ player_id: 106, comp_type_id: 9, notes: "AI Arena" }],
      summary: "wk one", start_date: "2026-07-10", end_date: null,
    });
  });

  it("omits jury_votes unless present, drops blank misc rows and zero votes", () => {
    const form = { hoh: 0, pov: 0, noms: [], vetoUsedOn: 0, evicted: [], havenot: [], votes: { 101: 0 }, miscComps: [{ player_id: 0, comp_type_id: 9, notes: "" }], summary: "", startDate: "", endDate: "", juryVotes: {} };
    const payload = formToPayload(form, [101]);
    expect(payload.hoh).toBeNull();
    expect(payload.votes).toEqual({});
    expect(payload.misc_comps).toEqual([]);
    expect(payload.jury_votes).toBeUndefined();

    const payload2 = formToPayload({ ...form, juryVotes: { 103: 101, 105: 0 } }, [101]);
    expect(payload2.jury_votes).toEqual({ 103: 101 });
  });
});
