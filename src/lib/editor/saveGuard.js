// Near-empty auto-save guard (2026-08-08 spec).
//
// Root cause of the 8/8 post wipe: an auth flicker left the editor holding
// an empty document, and the 5s auto-save persisted it over 1,200+ chars of
// real content. If an AUTO save would shrink the post to under 10% of its
// last saved length, skip it and make the writer save manually.

export const MIN_GUARDED_LENGTH = 200; // don't guard stubs — clearing those is normal
export const SHRINK_RATIO = 0.1;

export function shouldBlockAutoSave({ lastSavedLength, nextLength, isManual }) {
  if (isManual) return false;
  if (!lastSavedLength || lastSavedLength < MIN_GUARDED_LENGTH) return false;
  return nextLength < lastSavedLength * SHRINK_RATIO;
}
