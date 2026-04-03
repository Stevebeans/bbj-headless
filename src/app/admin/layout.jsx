"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { getRoles, simulatePermissions } from "@/lib/api/admin";
import Link from "next/link";

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function BugIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GearIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function MegaphoneIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
}

function ChartIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function FeedIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );
}

function PlayerIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function SeasonIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function AdIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}

function PencilSquareIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function DocumentTextIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

const TABS = [
  { id: "overview", label: "Overview", href: "/admin", icon: HomeIcon, permission: null },
  { id: "posts", label: "Posts", href: "/admin/posts", icon: DocumentTextIcon, permission: "blog_review" },
  { id: "feed-updates", label: "Feed Updates", href: "/admin/feed-updates", icon: FeedIcon, permission: "feed_updates" },
  { id: "comments", label: "Comments", href: "/admin/comments", icon: ChatIcon, permission: "comment_moderation" },
  { id: "players", label: "Players", href: "/admin/players", icon: PlayerIcon, permission: "player_management" },
  { id: "seasons", label: "Seasons", href: "/admin/seasons", icon: SeasonIcon, permission: "season_management" },
  { id: "bug-reports", label: "Bugs", href: "/admin/bug-reports", icon: BugIcon, permission: "bug_reports" },
  { id: "announcements", label: "Announcements", href: "/admin/announcements", icon: MegaphoneIcon, permission: "announcements" },
  { id: "content-engine", label: "Content", href: "/admin/content-engine", icon: PencilSquareIcon, permission: "content_engine" },
  { id: "ads", label: "Ads", href: "/admin/ads", icon: AdIcon, permission: "ad_management" },
  { id: "users", label: "Users", href: "/admin/users", icon: UsersIcon, permission: "user_management" },
  { id: "stats", label: "Stats", href: "/admin/stats", icon: ChartIcon, permission: "analytics_dashboard" },
  { id: "settings", label: "Settings", href: "/admin/settings", icon: GearIcon, permission: "admin_settings" },
];

export default function AdminLayout({ children }) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { permissions: realPermissions, loading: permLoading, hasAnyPermission } = usePermissions();
  const [simulatedPermissions, setSimulatedPermissions] = useState(null);
  const [roles, setRoles] = useState([]);
  const [simulatedRole, setSimulatedRole] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // The active permissions: simulated if active, otherwise real
  const permissions = simulatedPermissions || realPermissions;

  useEffect(() => {
    if (authLoading || permLoading) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/admin");
      return;
    }

    if (!hasAnyPermission()) {
      setError("You do not have permission to access the admin panel.");
      return;
    }

    // Fetch roles for simulation dropdown (only if admin)
    if (realPermissions?.admin_settings) {
      const SIMULATION_HIDDEN_ROLES = [
        "subscriber", "seo_manager", "seo_editor", "wiki_updater",
        "ad_admin", "ad_manager", "lifetime", "beta_tester",
        "wikiupdate", "legacy", "author", "editor", "contributor",
      ];

      getRoles()
        .then((rolesData) => {
          setRoles(rolesData.filter((r) => !SIMULATION_HIDDEN_ROLES.includes(r.key)));

          // Restore simulation from sessionStorage
          const savedRole = sessionStorage.getItem("bbj_simulate_role");
          if (savedRole) {
            simulatePermissions(savedRole)
              .then((simData) => {
                setSimulatedRole(savedRole);
                setSimulatedPermissions(simData.features);
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [authLoading, permLoading, isAuthenticated, realPermissions, router, hasAnyPermission]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSimulateRole = async (role) => {
    if (!role) {
      setSimulatedRole(null);
      setSimulatedPermissions(null);
      sessionStorage.removeItem("bbj_simulate_role");
      sessionStorage.removeItem("bbj_simulate_role_name");
      return;
    }

    try {
      const data = await simulatePermissions(role);
      setSimulatedRole(role);
      setSimulatedPermissions(data.features);
      sessionStorage.setItem("bbj_simulate_role", role);
      const roleName = roles.find(r => r.key === role)?.name || role;
      sessionStorage.setItem("bbj_simulate_role_name", roleName);
    } catch (err) {
      console.error("Failed to simulate role:", err);
    }
  };

  // Loading state
  if (authLoading || permLoading) {
    return (
      <div className="min-h-screen bg-slate-200 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Error state (no access)
  if (error) {
    return (
      <div className="min-h-screen bg-slate-200 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Link href="/" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Filter tabs based on permissions
  const visibleTabs = TABS.filter(
    (tab) => !tab.permission || permissions?.[tab.permission]
  );

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-lg font-display font-bold text-gray-900 dark:text-white">
          Admin
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {user?.user_display_name || "User"}
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label="Admin navigation">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg mb-0.5 transition-colors ${
                isActive
                  ? "bg-primary-500 text-white"
                  : "text-gray-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role simulation */}
      {roles.length > 0 && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Preview as:
          </label>
          <select
            value={simulatedRole || ""}
            onChange={(e) => handleSimulateRole(e.target.value || null)}
            className="w-full text-sm px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">My Permissions</option>
            {roles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Back to site */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          <span>Back to Site</span>
        </Link>
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-slate-200 dark:bg-gray-950">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-primary-500 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white p-1"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-white font-display font-bold">Admin</span>
        <Link href="/" className="text-white text-sm hover:text-secondary-500">
          Site
        </Link>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 bg-white dark:bg-gray-900 flex flex-col h-full shadow-xl">
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-2 py-6">
        {/* Simulation Banner */}
        {simulatedRole && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Previewing as: <strong>{roles.find(r => r.key === simulatedRole)?.name || simulatedRole}</strong>
              </span>
            </div>
            <button
              onClick={() => handleSimulateRole(null)}
              className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline"
            >
              Exit Preview
            </button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:flex md:flex-col md:w-52 shrink-0 sticky top-4 self-start bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {sidebarContent}
          </aside>

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
