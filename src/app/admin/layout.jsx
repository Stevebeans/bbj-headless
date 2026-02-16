"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getMyPermissions, getRoles, simulatePermissions } from "@/lib/api/admin";
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

const TABS = [
  { id: "overview", label: "Overview", href: "/admin", icon: HomeIcon, permission: null },
  { id: "comments", label: "Comments", href: "/admin/comments", icon: ChatIcon, permission: "comment_moderation" },
  { id: "bug-reports", label: "Bug Reports", href: "/admin/bug-reports", icon: BugIcon, permission: "bug_reports" },
  { id: "announcements", label: "Announcements", href: "/admin/announcements", icon: MegaphoneIcon, permission: "announcements" },
  { id: "stats", label: "Stats", href: "/admin/stats", icon: ChartIcon, permission: "analytics_dashboard" },
  { id: "settings", label: "Settings", href: "/admin/settings", icon: GearIcon, permission: "admin_settings" },
];

export default function AdminLayout({ children }) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const [simulatedRole, setSimulatedRole] = useState(null);
  const [realPermissions, setRealPermissions] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;

      if (!isAuthenticated) {
        router.push("/login?redirect=/admin");
        return;
      }

      try {
        const data = await getMyPermissions();
        setPermissions(data.features);
        setRealPermissions(data.features);

        if (Object.keys(data.features).length === 0) {
          setError("You do not have permission to access the admin panel.");
          return;
        }

        // Fetch roles for simulation dropdown (only if user has admin_settings)
        if (data.features.admin_settings) {
          try {
            const rolesData = await getRoles();
            const SIMULATION_HIDDEN_ROLES = [
              "subscriber", "seo_manager", "seo_editor", "wiki_updater",
              "ad_admin", "ad_manager", "lifetime", "beta_tester",
              "wikiupdate", "legacy", "author", "editor", "contributor",
            ];
            setRoles(rolesData.filter((r) => !SIMULATION_HIDDEN_ROLES.includes(r.key)));

            // Restore simulation from sessionStorage if active
            const savedRole = sessionStorage.getItem("bbj_simulate_role");
            if (savedRole) {
              const simData = await simulatePermissions(savedRole);
              setSimulatedRole(savedRole);
              setPermissions(simData.features);
            }
          } catch {}
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [authLoading, isAuthenticated, router]);

  const handleSimulateRole = async (role) => {
    if (!role) {
      setSimulatedRole(null);
      setPermissions(realPermissions);
      sessionStorage.removeItem("bbj_simulate_role");
      sessionStorage.removeItem("bbj_simulate_role_name");
      return;
    }

    try {
      const data = await simulatePermissions(role);
      setSimulatedRole(role);
      setPermissions(data.features);
      sessionStorage.setItem("bbj_simulate_role", role);
      const roleName = roles.find(r => r.key === role)?.name || role;
      sessionStorage.setItem("bbj_simulate_role_name", roleName);
    } catch (err) {
      console.error("Failed to simulate role:", err);
    }
  };

  // Loading state
  if (authLoading || loading) {
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

  return (
    <main className="min-h-screen bg-slate-200 dark:bg-gray-950 py-8">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 sm:flex sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage content, reports, and site settings
            </p>
          </div>
          {roles.length > 0 && (
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Preview as:
              </label>
              <select
                value={simulatedRole || ""}
                onChange={(e) => handleSimulateRole(e.target.value || null)}
                className="text-sm px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
        </div>

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

        {/* Tabs + Content Container */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex overflow-x-auto" aria-label="Admin tabs">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">{children}</div>
        </div>

        {/* Back to Site */}
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Back to Site
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Logged in as {user?.user_display_name || "User"}
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              Return to Site
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
