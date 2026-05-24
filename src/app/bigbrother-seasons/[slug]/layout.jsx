import { Source_Serif_4, IBM_Plex_Mono } from "next/font/google";

// Editorial-only fonts, preloaded ONLY on the season route subtree.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-serif-4",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
});

export default function SeasonProfileLayout({ children }) {
  // Static layout — NO cookies()/headers()/draftMode() (caching gatekeeper).
  // Only exposes the two editorial font CSS variables to the subtree.
  return (
    <div className={`${sourceSerif.variable} ${plexMono.variable}`}>
      {children}
    </div>
  );
}
