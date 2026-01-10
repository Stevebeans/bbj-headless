import { Roboto, Oswald, Yanone_Kaffeesatz, Caveat } from "next/font/google";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Font configurations
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
  keywords: ["Big Brother", "BB26", "live feeds", "spoilers", "CBS", "reality TV"],
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
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
