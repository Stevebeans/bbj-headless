// Pre-paint supporter ad gate — same blocking-inline-script pattern as
// ThemeScript. Before first paint it reads the bbj_user profile-cache cookie
// (rewritten at every login/refresh) and, when the cached roles include a
// supporter role, tags <html> with .bbj-adfree (CSS hides ad chrome) and sets
// window.__bbjAdFree (FreestarSDKLoader never boots the SDK).
//
// Why: supporter detection otherwise lives entirely in AdContext, which waits
// on AuthContext hydration — so every supporter starts every page load in the
// anonymous "ads on" state and races the ad stack. Losing that race is what
// paying members report as "I still see ads" (2026-08-13, nicolet77). Booting
// the SDK also churns dozens of ad cookies that can evict the auth cookies
// from the browser's per-domain jar (Priority=High only protects Chromium),
// which loops back into "logged out every 10-15 minutes."
//
// Caching: the script body is identical for every visitor — the only inlined
// data is the site-wide supporter-role list the layout already fetches. The
// per-user cookie read happens in the browser, so ISR/CF caching is untouched.
//
// Fails open: a missing or corrupt cookie, roles that aren't list-shaped (PHP
// can serialize them as {0:"supporter"}), or any thrown error is a no-op —
// exactly today's behavior. Admin ad-preview mode (bbj_ad_preview cookie)
// skips the gate so slot placeholders stay visible.

import { SUPPORTER_ROLES_BASE } from "@/lib/supporterRoles";

/**
 * Build the self-contained inline script. Exported for tests.
 * @param {string[]} configuredRoles admin-configured list from bbjd ad settings
 */
export function buildAdGateScript(configuredRoles = []) {
  const supporterRolesJson = JSON.stringify([
    ...new Set([...SUPPORTER_ROLES_BASE, ...configuredRoles]),
  ]);
  return `(function(){try{
    if(document.cookie.indexOf('bbj_ad_preview=1')!==-1)return;
    var match=document.cookie.match(/(?:^|; )bbj_user=([^;]*)/);
    if(!match)return;
    var cached=JSON.parse(decodeURIComponent(match[1]));
    var userRoles=cached&&cached.r;
    if(userRoles&&typeof userRoles==='object'&&!Array.isArray(userRoles))userRoles=Object.values(userRoles);
    if(!Array.isArray(userRoles))return;
    var supporterRoles=${supporterRolesJson};
    for(var i=0;i<userRoles.length;i++){
      if(supporterRoles.indexOf(userRoles[i])===-1)continue;
      document.documentElement.classList.add('bbj-adfree');
      window.__bbjAdFree=true;
      return;
    }
  }catch(e){}})();`;
}

export function AdGateScript({ supporterRoles = [] }) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: buildAdGateScript(supporterRoles) }}
      suppressHydrationWarning
    />
  );
}
