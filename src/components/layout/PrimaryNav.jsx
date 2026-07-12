"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

// Primary nav items. Seasons/Stats/Map deep-link to the Directory's tabbed views
// (PlayerDirectory reads ?tab=); "Players" is the Directory's default tab.
export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  // Contact intentionally omitted — it already lives in the top utility header.
  { href: "/live-feed-updates", label: "Feed Updates" },
  { href: "/directory?tab=seasons", label: "Seasons" },
  { href: "/directory?tab=stats", label: "Stats" },
  { href: "/directory", label: "Players" },
  { href: "/fan-favorites", label: "Fan Favorites" },
  { href: "/search", label: "Ask the Bean" },
  { href: "/directory?tab=map", label: "Map" },
];

const navLinkClass = (active) =>
  `relative inline-flex items-center px-4 py-3 font-osw uppercase tracking-wider text-sm text-white transition-colors hover:bg-primary-600 ${
    active
      ? "bg-primary-600 after:content-[''] after:absolute after:left-4 after:right-4 after:bottom-0 after:h-[3px] after:bg-secondary-500"
      : ""
  }`;

const authLinkClass =
  "inline-flex items-center px-4 py-3 font-osw uppercase tracking-wider text-sm text-secondary-500 transition-colors hover:bg-primary-600 hover:text-white";

/**
 * Desktop primary navigation. Uses useSearchParams to resolve the active
 * Directory tab, so it MUST be rendered inside a <Suspense> boundary (see
 * Header) to keep the rest of the page statically renderable.
 */
export default function PrimaryNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();
  const { openLogin, openRegister } = useAuthModal();

  // Directory tabs all share the /directory path; disambiguate via ?tab=.
  const currentTab = searchParams.get("tab") || "players";
  const isActive = (href) => {
    const [path, query] = href.split("?");
    if (path === "/") return pathname === "/";
    if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
    if (path === "/directory") {
      const hrefTab = query ? new URLSearchParams(query).get("tab") || "players" : "players";
      return currentTab === hrefTab;
    }
    return true;
  };

  return (
    <ul className="hidden md:flex items-stretch" role="menubar">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <li role="none" key={item.href}>
            <Link
              href={item.href}
              role="menuitem"
              aria-current={active ? "page" : undefined}
              className={navLinkClass(active)}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
      {!isAuthenticated && !loading && (
        <>
          <li role="none">
            <a href="/login" onClick={(e) => { e.preventDefault(); openLogin(); }} role="menuitem" className={authLinkClass}>
              Log In
            </a>
          </li>
          <li role="none">
            <button onClick={() => openRegister()} role="menuitem" className={authLinkClass}>
              Register
            </button>
          </li>
        </>
      )}
    </ul>
  );
}

/**
 * Static fallback rendered during prerender / while the Suspense boundary
 * resolves. Same links, no active state (no searchParams access).
 */
export function PrimaryNavFallback() {
  return (
    <ul className="hidden md:flex items-stretch" role="menubar">
      {NAV_ITEMS.map((item) => (
        <li role="none" key={item.href}>
          <Link href={item.href} role="menuitem" className={navLinkClass(false)}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
