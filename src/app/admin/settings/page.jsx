"use client";

import { useEffect, useState, useCallback } from "react";
import { getSettings, updateSettings, getRoles } from "@/lib/api/admin";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [settingsData, rolesData] = await Promise.all([
        getSettings(),
        getRoles(),
      ]);
      setSettings(settingsData);
      setRoles(rolesData);
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
                    <span className="text-xs">{role.name}</span>
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
