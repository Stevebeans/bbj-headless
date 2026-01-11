"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getSettings,
  updateSettings,
  getRoles,
  getDatabaseStatus,
  runMigration,
  getVoteMigrationPreview,
  runVoteMigration,
  resetVoteMigration,
  recalculateRanks,
} from "@/lib/api/admin";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);
  const [voteMigrationPreview, setVoteMigrationPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [settingsData, rolesData, dbStatusData, votePreview] = await Promise.all([
        getSettings(),
        getRoles(),
        getDatabaseStatus(),
        getVoteMigrationPreview(),
      ]);
      setSettings(settingsData);
      setRoles(rolesData);
      setDbStatus(dbStatusData);
      setVoteMigrationPreview(votePreview);
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

  const handleRunMigration = async () => {
    setMigrating(true);
    setError(null);

    try {
      await runMigration();
      const newStatus = await getDatabaseStatus();
      setDbStatus(newStatus);
      setSuccess("Database tables created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleVoteMigration = async () => {
    setMigrating(true);
    setError(null);

    try {
      let result = { completed: false };
      while (!result.completed) {
        result = await runVoteMigration(5000);
        const newStatus = await getDatabaseStatus();
        setDbStatus(newStatus);

        if (!result.completed) {
          // Small delay between batches
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      setSuccess("Vote migration completed!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleResetVoteMigration = async () => {
    if (!confirm("Are you sure you want to reset the vote migration? This will allow you to re-run it.")) {
      return;
    }

    try {
      await resetVoteMigration();
      const newStatus = await getDatabaseStatus();
      setDbStatus(newStatus);
      setSuccess("Vote migration reset!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRecalculateRanks = async () => {
    setMigrating(true);
    try {
      const result = await recalculateRanks();
      setSuccess(`Recalculated ranks for ${result.results.processed} users!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-8"></div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-osw font-bold text-slate-800 dark:text-white">Admin Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Configure permissions, notifications, and database</p>
      </div>

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
      <section className="bg-white dark:bg-slate-700 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-osw font-bold text-slate-800 dark:text-white mb-4">Notifications</h2>

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
      <section className="bg-white dark:bg-slate-700 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-osw font-bold text-slate-800 dark:text-white mb-4">Feature Permissions</h2>
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
                  <tr key={feature} className="border-b border-slate-100 dark:border-slate-600">
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
      <div className="mb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Database Section */}
      <section className="bg-white dark:bg-slate-700 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-osw font-bold text-slate-800 dark:text-white mb-4">Database Management</h2>

        {/* Tables Status */}
        <div className="mb-6">
          <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Comment System Tables</h3>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Version:</span>
              <span className="font-mono text-slate-800 dark:text-white">{dbStatus?.version}</span>
            </div>
            {dbStatus?.tables &&
              Object.entries(dbStatus.tables).map(([name, info]) => (
                <div key={name} className="flex items-center justify-between py-1 text-sm">
                  <span className="font-mono text-slate-600 dark:text-slate-400">{info.full_name}</span>
                  <span className={info.exists ? "text-green-500" : "text-red-500"}>
                    {info.exists ? `${info.rows.toLocaleString()} rows` : "Not created"}
                  </span>
                </div>
              ))}
          </div>

          {dbStatus?.needs_migration && (
            <button
              onClick={handleRunMigration}
              disabled={migrating}
              className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {migrating ? "Creating tables..." : "Create/Update Tables"}
            </button>
          )}
        </div>

        {/* Vote Migration */}
        <div className="mb-6 pt-6 border-t border-slate-200 dark:border-slate-600">
          <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Vote Migration (from WPDiscuz)</h3>

          {voteMigrationPreview?.source_stats?.exists && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Source Data (logged-in users only):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Total Votes:</span>
                  <span className="ml-2 font-medium text-slate-800 dark:text-white">
                    {voteMigrationPreview.source_stats.total_votes?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Upvotes:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {voteMigrationPreview.source_stats.upvotes?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Downvotes:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {voteMigrationPreview.source_stats.downvotes?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Unique Voters:</span>
                  <span className="ml-2 font-medium text-slate-800 dark:text-white">
                    {voteMigrationPreview.source_stats.unique_voters?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {dbStatus?.vote_migration?.started && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Migration Progress: {dbStatus.vote_migration.migrated_count?.toLocaleString()} votes migrated
                {dbStatus.vote_migration.completed && " (Complete!)"}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!dbStatus?.vote_migration?.completed && (
              <button
                onClick={handleVoteMigration}
                disabled={migrating || !dbStatus?.tables?.bbj_comment_votes?.exists}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {migrating
                  ? "Migrating..."
                  : dbStatus?.vote_migration?.started
                  ? "Continue Migration"
                  : "Start Vote Migration"}
              </button>
            )}

            {dbStatus?.vote_migration?.started && (
              <button
                onClick={handleResetVoteMigration}
                disabled={migrating}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Reset Migration
              </button>
            )}
          </div>
        </div>

        {/* Rank Recalculation */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-600">
          <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">User Ranks</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Recalculate ranks for all users based on current comment counts and karma
          </p>
          <button
            onClick={handleRecalculateRanks}
            disabled={migrating}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {migrating ? "Calculating..." : "Recalculate All Ranks"}
          </button>
        </div>
      </section>
    </div>
  );
}
