"use client";

import { useEffect, useState, useCallback } from "react";
import { getSettings, updateSettings, getRoles, getRoleMembers } from "@/lib/api/admin";
import { getCategories } from "@/lib/api/editor";

const HIDDEN_ROLES = [
  "subscriber",
  "seo_manager",
  "seo_editor",
  "wiki_updater",
  "ad_admin",
  "ad_manager",
  "lifetime",
  "beta_tester",
  "wikiupdate",
  "legacy",
  "author",
  "editor",
  "contributor",
];

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rolePopover, setRolePopover] = useState(null); // { role, roleName, members, x, y }
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [seasons, setSeasons] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [settingsData, rolesData, categoriesData] = await Promise.all([
        getSettings(),
        getRoles(),
        getCategories(),
      ]);
      setSettings(settingsData);
      setRoles(rolesData.filter((r) => !HIDDEN_ROLES.includes(r.key)));
      const seasonList = Array.isArray(categoriesData) ? categoriesData : (categoriesData.seasons || []);
      setSeasons(seasonList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePermissionChange = (feature, role, checked) => {
    setSettings((prev) => {
      const newPermissions = { ...prev.permissions };
      const currentRoles = newPermissions[feature]?.roles || [];

      if (checked) {
        newPermissions[feature] = {
          ...newPermissions[feature],
          roles: [...currentRoles, role],
        };
      } else {
        newPermissions[feature] = {
          ...newPermissions[feature],
          roles: currentRoles.filter((r) => r !== role),
        };
      }

      return { ...prev, permissions: newPermissions };
    });
  };

  const handleNotificationChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        comment_reports: {
          ...prev.notifications.comment_reports,
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateSettings(settings);
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInfoClick = async (role, event) => {
    // Toggle off if clicking same role
    if (rolePopover?.role === role.key) {
      setRolePopover(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setLoadingMembers(true);
    setRolePopover({ role: role.key, roleName: role.name, members: [], x: rect.left, y: rect.bottom });

    try {
      const data = await getRoleMembers(role.key);
      setRolePopover((prev) => prev ? { ...prev, members: data.members } : null);
    } catch {
      setRolePopover(null);
    } finally {
      setLoadingMembers(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* General Settings */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-4">General</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Current Season
            </label>
            <select
              value={settings?.current_season || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, current_season: parseInt(e.target.value) || 0 }))}
              className="w-full max-w-md px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">None</option>
              {(settings?.seasons_list || []).map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-slate-500 mt-1">Controls the spoiler bar, homepage headings, houseboard, and season stats across the site</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Default Post Category
            </label>
            <select
              value={settings?.current_season_category || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, current_season_category: parseInt(e.target.value) || 0 }))}
              className="w-full max-w-md px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">None</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-slate-500 mt-1">Auto-selected season/category when creating new posts in the editor</p>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-4">Notifications</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Report Notification Email
            </label>
            <input
              type="email"
              value={settings?.notifications?.comment_reports?.email || ""}
              onChange={(e) => handleNotificationChange("email", e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="admin@example.com"
            />
            <p className="text-sm text-slate-500 mt-1">Email address to receive report notifications</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Report Threshold
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings?.notifications?.comment_reports?.threshold || 3}
              onChange={(e) => handleNotificationChange("threshold", parseInt(e.target.value))}
              className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-sm text-slate-500 mt-1">Number of reports before sending notification</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="notifications_enabled"
              checked={settings?.notifications?.comment_reports?.enabled || false}
              onChange={(e) => handleNotificationChange("enabled", e.target.checked)}
              className="w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="notifications_enabled" className="ml-2 text-slate-700 dark:text-slate-300">
              Enable email notifications
            </label>
          </div>
        </div>
      </section>

      {/* Permissions Section */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-4">Feature Permissions</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Select which roles can access each admin feature
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Feature</th>
                {roles.map((role) => (
                  <th key={role.key} className="text-center py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs">{role.name}</span>
                      <button
                        onClick={(e) => handleInfoClick(role, e)}
                        className="text-slate-400 hover:text-primary-500 transition-colors"
                        title={`View users with ${role.name} role`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settings?.permissions &&
                Object.entries(settings.permissions).map(([feature, config]) => (
                  <tr key={feature} className="border-b border-slate-200 dark:border-slate-700">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800 dark:text-white">{config.label}</p>
                      <p className="text-xs text-slate-500">{config.description}</p>
                    </td>
                    {roles.map((role) => (
                      <td key={role.key} className="text-center py-3 px-2">
                        <input
                          type="checkbox"
                          checked={config.roles?.includes(role.key) || false}
                          onChange={(e) => handlePermissionChange(feature, role.key, e.target.checked)}
                          disabled={feature === "admin_settings" && role.key === "administrator"}
                          className="w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500 disabled:opacity-50"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Role Members Popover */}
        {rolePopover && (
          <div className="fixed inset-0 z-50" onClick={() => setRolePopover(null)}>
            <div
              className="absolute bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 min-w-[200px] max-w-[280px]"
              style={{ top: rolePopover.y + 8, left: Math.min(rolePopover.x, window.innerWidth - 300) }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                {rolePopover.roleName}
              </h4>
              {loadingMembers ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
                  Loading...
                </div>
              ) : rolePopover.members.length === 0 ? (
                <p className="text-sm text-slate-500">No users with this role</p>
              ) : (
                <ul className="space-y-2">
                  {rolePopover.members.map((member) => (
                    <li key={member.id} className="flex items-center gap-2">
                      <img
                        src={member.avatar}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                        {member.display_name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-slate-400 mt-2">
                {rolePopover.members.length} {rolePopover.members.length === 1 ? "user" : "users"}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Save Button */}
      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
