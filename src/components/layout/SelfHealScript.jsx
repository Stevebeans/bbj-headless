// Inline script that rescues "zombie" pages: HTML cached at the Cloudflare
// edge (30-day content TTL) can outlive its JS — after a deploy + Vercel's
// skew-protection window, the old build's webpack runtime chunk 404s and the
// page renders with zero client JS (looks logged out, no ads, frozen widgets).
// This runs before any chunk loads; if a /_next/static script fails, or the
// app never boots after load, it reloads once with a cache-busting query so
// Cloudflare misses and fresh current-deployment HTML is served.
// SelfHealBeacon sets window.__BBJ_HYDRATED once React mounts, clears the
// one-shot guard, and strips the bbjheal param from the URL.

export function SelfHealScript() {
  const script = `
    (function () {
      var GUARD = 'bbj_heal';
      try { if (sessionStorage.getItem(GUARD)) return; } catch (e) { return; }
      var healed = false;
      function heal() {
        if (healed || window.__BBJ_HYDRATED) return;
        healed = true;
        try { sessionStorage.setItem(GUARD, '1'); } catch (e) {}
        var url = new URL(window.location.href);
        url.searchParams.set('bbjheal', Date.now().toString(36));
        window.location.replace(url.toString());
      }
      window.addEventListener('error', function (e) {
        var t = e && e.target;
        var src = t && t.tagName === 'SCRIPT' && t.src;
        if (src && src.indexOf('/_next/static/') !== -1) heal();
      }, true);
      window.addEventListener('load', function () {
        setTimeout(heal, 10000);
      });
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
