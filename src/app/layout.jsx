import { Roboto, Oswald, Yanone_Kaffeesatz, Caveat } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { Providers } from "@/components/Providers";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import { FloatingUpdater } from "@/components/feed-updates/FloatingUpdater";
import { AdScripts } from "@/components/ads/AdScripts";
import { getInitialAuthState } from "@/lib/auth/serverCookies";
import { getAdScripts } from "@/lib/api/ads";

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

  return (
    <html
      lang="en"
      className={`${roboto.variable} ${oswald.variable} ${yanone.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        {/* Global scripts - always loaded for all users (analytics, etc.) */}
        {adScripts.global_header && (
          <script dangerouslySetInnerHTML={{ __html: extractInlineScript(adScripts.global_header) }} />
        )}
        {extractExternalScripts(adScripts.global_header)}
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-slate-200 dark:bg-slate-700">
        <Providers initialUser={initialUser}>
          <Header />
          <SpoilerBarWrapper />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <FloatingUpdater />
          {/* Ad network scripts - blocked for supporters */}
          <AdScripts adHeader={adScripts.ad_header} adFooter={adScripts.ad_footer} />
        </Providers>
        {/* Global footer scripts */}
        {adScripts.global_footer && (
          <script dangerouslySetInnerHTML={{ __html: extractInlineScript(adScripts.global_footer) }} />
        )}
        {extractExternalScripts(adScripts.global_footer)}
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
 * Extract external script tags (with src) and return as Next.js-compatible elements
 */
function extractExternalScripts(html) {
  if (!html) return null;
  const matches = html.match(/<script\s[^>]*src\s*=\s*["'][^"']+["'][^>]*><\/script>/gi) || [];
  return matches.map((tag, i) => {
    const src = tag.match(/src\s*=\s*["']([^"']+)["']/i)?.[1];
    const isAsync = /\basync\b/i.test(tag);
    const isDefer = /\bdefer\b/i.test(tag);
    const crossOrigin = tag.match(/crossorigin\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!src) return null;
    return (
      <script
        key={`ext-script-${i}`}
        src={src}
        async={isAsync || undefined}
        defer={isDefer || undefined}
        crossOrigin={crossOrigin || undefined}
      />
    );
  });
}
