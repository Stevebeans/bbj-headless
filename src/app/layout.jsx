import { Roboto, Oswald, Yanone_Kaffeesatz, Caveat } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { Providers } from "@/components/Providers";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import { FloatingUpdater } from "@/components/feed-updates/FloatingUpdater";
import { BugReportFAB } from "@/components/bug-report/BugReportFAB";
import { BackToTop } from "@/components/layout/BackToTop";
import { getInitialAuthState } from "@/lib/auth/serverCookies";
import { getAdScripts } from "@/lib/api/ads";
import { RoleSimulationBanner } from "@/components/admin/RoleSimulationBanner";

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
  const [initialUser, adScripts] = await Promise.all([
    getInitialAuthState(),
    getAdScripts(),
  ]);

  // Check if user is a supporter (ad-free) server-side
  const roles = Array.isArray(initialUser?.user_roles) ? initialUser.user_roles : [];
  const isSupporter = roles.some((role) => SUPPORTER_ROLES.includes(role));

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
        <Providers initialUser={initialUser}>
          <Header />
          <SpoilerBarWrapper />
          <RoleSimulationBanner />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <FloatingUpdater />
          <BugReportFAB />
          <BackToTop />
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
        {/* Ad network scripts - only for non-supporters, deferred */}
        {!isSupporter && adScripts.ad_header && extractInlineScript(adScripts.ad_header) && (
          <Script id="ad-header" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: extractInlineScript(adScripts.ad_header) }} />
        )}
        {!isSupporter && extractDeferredScripts(adScripts.ad_header, 'ad-hdr')}
        {!isSupporter && adScripts.ad_footer && extractInlineScript(adScripts.ad_footer) && (
          <Script id="ad-footer" strategy="lazyOnload" dangerouslySetInnerHTML={{ __html: extractInlineScript(adScripts.ad_footer) }} />
        )}
        {!isSupporter && extractDeferredScripts(adScripts.ad_footer, 'ad-ftr')}
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
