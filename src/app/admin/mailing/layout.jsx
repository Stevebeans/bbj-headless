"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUBNAV = [
  { href: "/admin/mailing", label: "Stats", match: (p) => p === "/admin/mailing" },
  { href: "/admin/mailing/lists", label: "Lists", match: (p) => p.startsWith("/admin/mailing/lists") },
  { href: "/admin/mailing/welcome-emails", label: "Welcome Emails", match: (p) => p.startsWith("/admin/mailing/welcome-emails") },
];

export default function MailingLayout({ children }) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-6 -mx-2 px-2" aria-label="Mailing sections">
        {SUBNAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
