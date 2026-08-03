"use client";

import { useLayoutEffect } from "react";
import { useAds } from "@/context/AdContext";

// Rendered by pages whose content is brand-safety flagged (_bbjd_ads_unsafe).
// Freestar requires pubfig fully disabled on non-compliant URLs — slots alone
// aren't enough because the SDK auto-injects managed units once booted.
export default function PageAdKill() {
  const { setPageAdKill } = useAds();
  useLayoutEffect(() => {
    setPageAdKill(true);
    return () => setPageAdKill(false);
  }, [setPageAdKill]);
  return null;
}
