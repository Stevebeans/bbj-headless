// Authoritative current-week game state for the Bean's prompt, from the same
// /spoiler-bar data the site header shows. Exists because RAG retrieval is
// season-blind: "who won veto" pulled a past-season post and the Bean answered
// "Paul" to a BB28 question (2026-08-22 member report). Cached under the
// spoiler-bar tag, so the WP webhook that refreshes the header refreshes this.
import { bbjdFetch } from "@/lib/api/wordpress";

export async function currentGameStateBlock() {
  try {
    const res = await bbjdFetch("/spoiler-bar", {
      tags: ["spoiler-bar"],
      revalidate: false,
    });
    const season = res?.season?.name || "";
    const players = Array.isArray(res?.players) ? res.players : [];
    if (!season || players.length === 0) return "";

    const byLabel = {};
    for (const p of players) {
      const label = (p.status_label || p.status || "").trim() || "In the house";
      (byLabel[label] ??= []).push(p.display_name || p.first_name || p.name);
    }
    const lines = Object.entries(byLabel).map(
      ([label, names]) => `${label}: ${names.join(", ")}`
    );
    return `${season} — this week, from the site's own records:\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}
