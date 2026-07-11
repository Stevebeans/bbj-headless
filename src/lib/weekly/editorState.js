/**
 * Pure form-state mapping for the weekly admin editor.
 * Storage semantics (must match the plugin's WeeklyAdmin planner):
 * noms = ALL nominees incl. replacement; the veto-saved nominee keeps nom=1
 * and carries saved_by_player_id; voted_for = who the player voted to evict;
 * jury votes live on each juror's own eviction-week row.
 */

export function deriveActiveIds(rosterIds, weeks, weekNum) {
  const evictedEarlier = new Set();
  for (const w of weeks) {
    if (Number(w.week_num) >= Number(weekNum)) continue;
    for (const row of w.players || []) {
      if (Number(row.evicted) === 1) evictedEarlier.add(Number(row.player_id));
    }
  }
  return rosterIds.map(Number).filter((id) => !evictedEarlier.has(id));
}

export function weekToForm(week) {
  const form = {
    hoh: 0, pov: 0, noms: [], vetoUsedOn: 0, evicted: [], votes: {}, miscComps: [],
    summary: week.summary || "", startDate: week.start_date || "", endDate: week.end_date || "",
    juryVotes: {},
  };
  for (const c of week.comps || []) {
    if (c.slug === "hoh" && !form.hoh) form.hoh = Number(c.player_id);
    else if (c.slug === "pov" && !form.pov) form.pov = Number(c.player_id);
    else form.miscComps.push({ player_id: Number(c.player_id), comp_type_id: Number(c.comp_type_id), notes: c.notes || "" });
  }
  for (const p of week.players || []) {
    const pid = Number(p.player_id);
    if (Number(p.nom) === 1) form.noms.push(pid);
    if (Number(p.evicted) === 1) form.evicted.push(pid);
    if (Number(p.saved_by_player_id) > 0) form.vetoUsedOn = pid;
    if (Number(p.voted_for) > 0) form.votes[pid] = Number(p.voted_for);
  }
  return form;
}

export function collectJuryVotes(weeks) {
  const votes = {};
  for (const w of weeks) {
    for (const p of w.players || []) {
      if (Number(p.vote_to_win_for) > 0) votes[Number(p.player_id)] = Number(p.vote_to_win_for);
    }
  }
  return votes;
}

export function formToPayload(form, activeIds) {
  const payload = {
    active: activeIds.map(Number),
    hoh: Number(form.hoh) || null,
    pov: Number(form.pov) || null,
    noms: form.noms.map(Number),
    veto_used_on: Number(form.vetoUsedOn) || null,
    evicted: form.evicted.map(Number),
    votes: {},
    misc_comps: [],
    summary: form.summary,
    start_date: form.startDate || null,
    end_date: form.endDate || null,
  };
  for (const [voter, votedFor] of Object.entries(form.votes)) {
    if (Number(votedFor) > 0) payload.votes[voter] = Number(votedFor);
  }
  for (const mc of form.miscComps) {
    if (Number(mc.player_id) && Number(mc.comp_type_id)) {
      payload.misc_comps.push({ player_id: Number(mc.player_id), comp_type_id: Number(mc.comp_type_id), notes: mc.notes || "" });
    }
  }
  const jury = Object.entries(form.juryVotes || {}).filter(([, v]) => Number(v) > 0);
  if (jury.length) {
    payload.jury_votes = Object.fromEntries(jury.map(([k, v]) => [k, Number(v)]));
  }
  return payload;
}
