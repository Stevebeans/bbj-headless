"use client";

import { useSyncExternalStore, useEffect } from "react";
import { getToken } from "@/lib/auth/cookies";
import { getSocialFilters, muteUser, unmuteUser, blockUser, unblockUser } from "@/lib/api/dm";

/**
 * Session-wide mute/block filter sets, shared across every comment section,
 * author modal, and the settings panel via a module-level store. Fetched once
 * per page load for logged-in users; guests get empty sets and no fetch.
 * Fails open: if the fetch errors, sets stay empty and comments render normally.
 */
const store = {
  state: { ready: false, mutedIds: new Set(), blockedIds: new Set() },
  listeners: new Set(),
  fetched: false,
};

function emit(next) {
  store.state = { ...store.state, ...next };
  store.listeners.forEach((l) => l());
}

function subscribe(listener) {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

const getSnapshot = () => store.state;

async function ensureFetched() {
  if (store.fetched) return;
  store.fetched = true;
  if (!getToken()) {
    emit({ ready: true });
    return;
  }
  try {
    const data = await getSocialFilters();
    emit({
      ready: true,
      mutedIds: new Set(data.muted_ids || []),
      blockedIds: new Set(data.blocked_ids || []),
    });
  } catch {
    emit({ ready: true }); // fail open
  }
}

function withSet(setName, id, present) {
  const next = new Set(store.state[setName]);
  if (present) next.add(id);
  else next.delete(id);
  emit({ [setName]: next });
}

async function apply(setName, id, present, apiCall) {
  withSet(setName, id, present); // optimistic
  try {
    await apiCall(id);
  } catch (err) {
    withSet(setName, id, !present); // roll back
    throw err;
  }
}

export default function useUserFilters() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    ensureFetched();
  }, []);
  return {
    ...state,
    mute: (id) => apply("mutedIds", id, true, muteUser),
    unmute: (id) => apply("mutedIds", id, false, unmuteUser),
    block: (id) => apply("blockedIds", id, true, blockUser),
    unblock: (id) => apply("blockedIds", id, false, unblockUser),
  };
}
