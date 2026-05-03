import { Roboto, Oswald, Yanone_Kaffeesatz, Caveat } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { Providers } from "@/components/Providers";
import { FloatingUpdater } from "@/components/feed-updates/FloatingUpdater";
import { BackToTop } from "@/components/layout/BackToTop";
import NewPostFAB from "@/components/editor/NewPostFAB";
import { getAdScripts } from "@/lib/api/ads";
import { DEFAULT_PWA_SUPPRESSED } from "@/config/ads";
import { RoleSimulationBanner } from "@/components/admin/RoleSimulationBanner";
import { FreestarSDKLoader } from "@/components/ads/FreestarSDKLoader";

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

export const metadata = {
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
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
  // See: memory/project_vercel_cost_incident.md
  const [adScripts, adSettings] = await Promise.all([
    getAdScripts(),
    fetch(`${process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json"}/bbjd/v1/ad-settings`, { next: { revalidate: 3600 } })
      .then(r => r.ok ? r.json() : { ads_enabled: true })
      .catch(() => ({ ads_enabled: true })),
  ]);

  // Anonymous-baseline: do we show ads at all on this site?
  // If a user is a supporter, AdContext will override this to false client-side.
  const initialShouldShowAds = adSettings.ads_enabled !== false;
  const supporterRoles = adSettings.supporter_roles || SUPPORTER_ROLES;

  return (
    <html
      lang="en"
      className={`${roboto.variable} ${oswald.variable} ${yanone.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-slate-200 dark:bg-slate-700">
        <Providers
          initialShouldShowAds={initialShouldShowAds}
          supporterRoles={supporterRoles}
          disabledPlacements={adSettings.disabled_placements || []}
          pwaSuppressed={adSettings.pwa_suppressed || DEFAULT_PWA_SUPPRESSED}
        >
          <Header />
          <RoleSimulationBanner />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <FloatingUpdater />
          <BackToTop />
          <NewPostFAB />
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
