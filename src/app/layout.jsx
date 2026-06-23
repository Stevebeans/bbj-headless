import { Roboto, Oswald, Yanone_Kaffeesatz, Caveat, Source_Serif_4, Inter_Tight, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import "@/styles/bean-chat.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { Providers } from "@/components/Providers";
import { FloatingUpdater } from "@/components/feed-updates/FloatingUpdater";
import { BackToTop } from "@/components/layout/BackToTop";
import BeanLauncher from "@/components/bean/BeanLauncher";
// PWA install banner parked 2026-06-07 (pursuing a real native app instead of A2HS).
// Code kept for the future native-app wrap. See memory/project_push_notifications_spec.md
// import InstallBanner from "@/components/pwa/InstallBanner";
import NewPostFAB from "@/components/editor/NewPostFAB";
import { getAdScripts } from "@/lib/api/ads";
import { DEFAULT_PWA_SUPPRESSED } from "@/config/ads";
import { getActiveLiveThread } from "@/lib/api/liveThread";
import { RoleSimulationBanner } from "@/components/admin/RoleSimulationBanner";
import { FreestarSDKLoader } from "@/components/ads/FreestarSDKLoader";
import { TopLeaderboard } from "@/components/ads/TopLeaderboard";
import CountdownBanner from "@/components/CountdownBanner";
import { SITE_URL, IS_PROD } from "@/lib/seo";

// Default supporter roles — used as fallback if ad-settings doesn't provide a list.
// AdContext and Header both do the client-side supporter check.
const SUPPORTER_ROLES = ["administrator", "editor", "supporter", "lifetime"];

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const yanone = Yanone_Kaffeesatz({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-yanone",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

// Ask the Bean chat type system (editorial: serif answers, mono labels)
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "600", "700"],
  variable: "--font-source-serif",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter-tight",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata = {
  // Resolves relative OG/canonical URLs and silences the Next.js build warning.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Big Brother Junkies - Live Feed Spoilers & Updates",
    template: "%s | Big Brother Junkies",
  },
  description:
    "Your source for Big Brother live feed updates, spoilers, recaps, and community discussion.",
  keywords: ["Big Brother", "BB27", "live feeds", "spoilers", "CBS", "reality TV"],
  authors: [{ name: "Steve Beans" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Big Brother Junkies",
  },
  twitter: {
    card: "summary_large_image",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  // Staging/preview/localhost are publicly reachable AND emit self-referential
  // canonicals — without this gate they get indexed and split ranking signals
  // with prod. Only the canonical prod host is indexable.
  robots: IS_PROD
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      }
    : { index: false, follow: false, nocache: true },
  alternates: {
    types: {
      "application/rss+xml": "/feed",
    },
  },
};

export const viewport = {
  themeColor: "#35546e",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  // IMPORTANT: This layout must NOT call cookies()/headers()/draftMode().
  // Doing so opts the entire route tree into dynamic rendering, which burns
  // Vercel function duration on every page view. Auth hydration happens
  // client-side in AuthContext via getUserCache()/getToken() from cookies.js.
  // ALSO: never use a time-based `revalidate` on a layout fetch — it floors
  // every page in the tree to that interval (Next.js takes the lowest
  // revalidate of the route segment), causing ISR write storms. Use
  // `revalidate: false` + a tag invalidated via /api/revalidate.
  // See: memory/project_vercel_cost_incident.md, project_isr_webhook_strategy.md
  const [adScripts, adSettings, liveThread] = await Promise.all([
    getAdScripts(),
    fetch(`${process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json"}/bbjd/v1/ad-settings`, { next: { tags: ["ad-settings"], revalidate: false } })
      .then(r => r.ok ? r.json() : { ads_enabled: true })
      .catch(() => ({ ads_enabled: true })),
    getActiveLiveThread(),
  ]);

  // Anonymous-baseline: do we show ads at all on this site?
  // If a user is a supporter, AdContext will override this to false client-side.
  const initialShouldShowAds = adSettings.ads_enabled !== false;
  const supporterRoles = adSettings.supporter_roles || SUPPORTER_ROLES;

  // Live-feeds header state — manual admin toggle + configurable Paramount+ link.
  // Defaults keep the button "on" if the WP plugin hasn't shipped the fields yet.
  const feedsLive = adSettings.feeds_live !== false;
  const paramountUrl = adSettings.feeds_paramount_url || "https://paramountplus.qflm.net/c/161260/3116112/3065";

  // Countdown banner — site-wide event timer above the header. Off unless enabled.
  const countdownEnabled = adSettings.countdown_enabled === true;
  const countdownLabel = adSettings.countdown_label || "";
  const countdownTarget = adSettings.countdown_target || "";

  return (
    <html
      lang="en"
      className={`${roboto.variable} ${oswald.variable} ${yanone.variable} ${caveat.variable} ${sourceSerif.variable} ${interTight.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-paper dark:bg-gray-900">
        <Providers
          initialShouldShowAds={initialShouldShowAds}
          supporterRoles={supporterRoles}
          disabledPlacements={adSettings.disabled_placements || []}
          pwaSuppressed={adSettings.pwa_suppressed || DEFAULT_PWA_SUPPRESSED}
        >
          {/* Above-header leaderboard — replaces the removed Freestar pushdown.
              Global (like the sticky footer); self-gates for ad-free users. */}
          <TopLeaderboard />
          <Header liveThread={liveThread} feedsLive={feedsLive} paramountUrl={paramountUrl} />
          {/* Event countdown — under the nav, above the page's spoiler bar; self-hides when target passes. */}
          <CountdownBanner enabled={countdownEnabled} label={countdownLabel} target={countdownTarget} />
          <RoleSimulationBanner />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          {/* Content-creation FAB dock — bottom-left, stacked (Feed on top, New Post under).
              Each child self-gates by role; flex-col gap collapses when only one renders. */}
          <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-3">
            <FloatingUpdater />
            <NewPostFAB />
          </div>
          <BackToTop />
          <BeanLauncher />
          {/* <InstallBanner /> parked — PWA on hold (see import note above) */}
          <FreestarSDKLoader />
        </Providers>
        {/* Global scripts - deferred to not block rendering (analytics, etc.) */}
        {adScripts.global_header && extractInlineScript(adScripts.global_header) && (
          <Script id="global-header" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: extractInlineScript(adScripts.global_header) }} />
        )}
        {extractDeferredScripts(adScripts.global_header, 'global-hdr')}
        {adScripts.global_footer && extractInlineScript(adScripts.global_footer) && (
          <Script id="global-footer" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: extractInlineScript(adScripts.global_footer) }} />
        )}
        {extractDeferredScripts(adScripts.global_footer, 'global-ftr')}
      </body>
    </html>
  );
}

/**
 * Extract inline script content from an HTML string containing script tags
 */
function extractInlineScript(html) {
  if (!html) return "";
  const matches = html.match(/<script(?:\s[^>]*)?>([^<]*)<\/script>/gi) || [];
  return matches
    .map((tag) => {
      // Only get inline scripts (no src attribute)
      if (tag.match(/\ssrc\s*=/i)) return "";
      const content = tag.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
      return content.trim();
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Extract external script tags (with src) and return as deferred Next.js Script elements
 */
function extractDeferredScripts(html, prefix) {
  if (!html) return null;
  const matches = html.match(/<script\s[^>]*src\s*=\s*["'][^"']+["'][^>]*><\/script>/gi) || [];
  return matches.map((tag, i) => {
    const src = tag.match(/src\s*=\s*["']([^"']+)["']/i)?.[1];
    const crossOrigin = tag.match(/crossorigin\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src) return null;
    return (
      <Script
        key={`${prefix}-${i}`}
        src={src}
        strategy="afterInteractive"
        crossOrigin={crossOrigin || undefined}
      />
    );
  });
}
