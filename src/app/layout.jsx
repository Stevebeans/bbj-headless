import { Roboto, Oswald, Yanone_Kaffeesatz, Caveat } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { Providers } from "@/components/Providers";

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
};

export const viewport = {
  themeColor: "#35546e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
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
        <Providers>
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
