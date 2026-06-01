// src/lib/bean/persona.js
// Resolves which persona (Voice Guide) a given user gets. Today everyone gets the
// public "Steve Beans" guide. The seam exists so a PRIVATE persona — e.g. a personal
// "Steve" gated to a specific account (his wife) — can be dropped in later WITHOUT
// touching the route or prompt assembly. Selection is server-side and identity-based,
// so a private persona can never be reached by anyone but its intended account.
import { VOICE_GUIDE } from "./voiceGuide.js";

/**
 * @param {object|null} user  the authenticated user (from verifyAuth), or null
 * @returns {{ id: string, guide: string }}
 */
export function resolvePersona(user) {
  // Future (Phase 2+): if (isPrivatePersonaUser(user)) return { id: "private", guide: PRIVATE_GUIDE };
  return { id: "public", guide: VOICE_GUIDE };
}
