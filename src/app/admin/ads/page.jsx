"use client";

import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { getAdSettings, updateAdSettings } from "@/lib/api/ad-settings";

const PREVIEW_COOKIE_NAME = "bbj_ad_preview";
const PREVIEW_COOKIE_DAYS = 7;

const MANUAL_PLACEMENTS = [
  { key: "bigbrotherjunkies_leaderboard_atf", label: "Leaderboard ATF" },
  { key: "bigbrotherjunkies_incontent_reusable", label: "In-Content Reusable" },
  { key: "bigbrotherjunkies_incontent_reusable_Homepage2", label: "In-Content Homepage 2" },
  { key: "bigbrotherjunkies_middle_feed", label: "Middle Feed" },
  { key: "bigbrotherjunkies_middle_post", label: "Middle Post" },
  { key: "bigbrotherjunkies_siderail_right_1", label: "Siderail Right 1" },
  { key: "bigbrotherjunkies_siderail_right_2", label: "Siderail Right 2" },
  { key: "bigbrotherjunkies_sticky_siderail_right", label: "Sticky Siderail Right" },
];

const AUTO_MANAGED_PLACEMENTS = [
  { key: "bigbrotherjunkies_articles_dynamic_incontent", label: "Articles Dynamic In-Content" },
  { key: "bigbrotherjunkies_comments_dynamic_incontent", label: "Comments Dynamic In-Content" },
  { key: "bigbrotherjunkies_sticky_footer", label: "Sticky Footer" },
  { key: "bigbrotherjunkies_sticky_pushdown", label: "Sticky Pushdown" },
  { key: "bigbrotherjunkies_google_interstitial", label: "Google Interstitial" },
  { key: "FreeStarVideoAdContainer_Slider", label: "Video Ad Slider" },
];

const ALL_PLACEMENTS = [...MANUAL_PLACEMENTS, ...AUTO_MANAGED_PLACEMENTS];

const HOUSE_AD_OPTIONS = [
  { value: "", label: "None" },
  { value: "premium-cta", label: "Premium CTA" },
  { value: "newsletter", label: "Newsletter Signup" },
];

const SUPPORTER_ROLES = [
  { key: "administrator", label: "Administrator" },
  { key: "editor", label: "Editor" },
  { key: "supporter", label: "Supporter" },
  { key: "lifetime", label: "Lifetime" },
];

export default function AdminAds() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getAdSettings();
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setPreviewMode(Cookies.get(PREVIEW_COOKIE_NAME) === "1");
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateAdSettings(settings);
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleKillSwitch = () => {
    setSettings((prev) => ({
      ...prev,
      ads_enabled: !prev.ads_enabled,
    }));
  };

  const togglePreviewMode = () => {
    const next = !previewMode;
    if (next) {
      Cookies.set(PREVIEW_COOKIE_NAME, "1", {
        expires: PREVIEW_COOKIE_DAYS,
        sameSite: "Lax",
        path: "/",
        secure: window.location.protocol === "https:",
      });
    } else {
      Cookies.remove(PREVIEW_COOKIE_NAME, { path: "/" });
    }
    setPreviewMode(next);
  };

  const togglePlacement = (placementKey) => {
    setSettings((prev) => {
      const disabled = prev.disabled_placements || [];
      const isDisabled = disabled.includes(placementKey);
      return {
        ...prev,
        disabled_placements: isDisabled
          ? disabled.filter((p) => p !== placementKey)
          : [...disabled, placementKey],
      };
    });
  };

  const toggleSupporterRole = (role) => {
    setSettings((prev) => {
      const roles = prev.supporter_roles || [];
      const hasRole = roles.includes(role);
      return {
        ...prev,
        supporter_roles: hasRole
          ? roles.filter((r) => r !== role)
          : [...roles, role],
      };
    });
  };

  const togglePwaSuppression = (placementKey) => {
    setSettings((prev) => {
      const suppressed = prev.pwa_suppressed || [];
      const isSuppressed = suppressed.includes(placementKey);
      return {
        ...prev,
        pwa_suppressed: isSuppressed
          ? suppressed.filter((p) => p !== placementKey)
          : [...suppressed, placementKey],
      };
    });
  };

  const handleHouseAdChange = (value) => {
    setSettings((prev) => ({
      ...prev,
      house_ad: value,
    }));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
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

      {/* Kill Switch + Preview Mode */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">
          Global Ad Control
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Master switch to enable or disable all ads site-wide.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleKillSwitch}
            aria-pressed={!!settings?.ads_enabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings?.ads_enabled
                ? "bg-green-500"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.ads_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {settings?.ads_enabled ? "Ads Enabled" : "Ads Disabled"}
          </span>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-osw font-bold text-slate-800 dark:text-white mb-1">
            Ad Preview Mode
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Replaces all ads with sized placeholders so you can lay out the page without distractions.
            Only YOU see this — visitors still get real ads. Setting persists 7 days in this browser.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={togglePreviewMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                previewMode
                  ? "bg-amber-500"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
              aria-pressed={previewMode}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  previewMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {previewMode ? "Preview Mode ON (showing placeholders)" : "Preview Mode OFF"}
            </span>
          </div>
        </div>
      </section>

      {/* Placement Toggles */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">
          Placement Toggles
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Enable or disable individual Freestar placements.
        </p>

        {/* Manual Placements */}
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
          Manual Placements
        </h3>
        <div className="space-y-2 mb-6">
          {MANUAL_PLACEMENTS.map((placement) => {
            const isEnabled = !(settings?.disabled_placements || []).includes(placement.key);
            return (
              <div key={placement.key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50">
                <div>
                  <span className="text-slate-800 dark:text-white text-sm font-medium">{placement.label}</span>
                  <span className="block text-xs text-slate-400 dark:text-slate-500 font-mono">{placement.key}</span>
                </div>
                <button
                  onClick={() => togglePlacement(placement.key)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isEnabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Auto-Managed Placements */}
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
          Auto-Managed Placements
        </h3>
        <div className="space-y-2">
          {AUTO_MANAGED_PLACEMENTS.map((placement) => {
            const isEnabled = !(settings?.disabled_placements || []).includes(placement.key);
            return (
              <div key={placement.key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50">
                <div>
                  <span className="text-slate-800 dark:text-white text-sm font-medium">{placement.label}</span>
                  <span className="block text-xs text-slate-400 dark:text-slate-500 font-mono">{placement.key}</span>
                </div>
                <button
                  onClick={() => togglePlacement(placement.key)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isEnabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* In-Content Ad Interval */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">
          In-Content Ad Interval
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Insert an ad every X paragraphs in blog posts. (Min: 2, Max: 10)
        </p>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={2}
            max={10}
            value={settings?.incontent_interval ?? 5}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                incontent_interval: Math.max(2, Math.min(10, parseInt(e.target.value) || 5)),
              }))
            }
            className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-lg font-medium"
          />
          <span className="text-slate-600 dark:text-slate-400 text-sm">
            paragraphs between ads (max 5 ads per article)
          </span>
        </div>
      </section>

      {/* House Ad Selection */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">
          House Ad
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Select which house ad to show when Freestar ads are hidden (e.g., for supporters).
        </p>
        <select
          value={settings?.house_ad || ""}
          onChange={(e) => handleHouseAdChange(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {HOUSE_AD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      {/* Supporter Roles */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">
          Supporter Roles
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Users with these roles will not see ads (ad-free experience).
        </p>
        <div className="space-y-3">
          {SUPPORTER_ROLES.map((role) => (
            <label key={role.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={(settings?.supporter_roles || []).includes(role.key)}
                onChange={() => toggleSupporterRole(role.key)}
                className="w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500"
              />
              <span className="text-slate-700 dark:text-slate-300">{role.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* PWA Suppressions */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">
          PWA Suppressions
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Select which placements to hide when the site is running in PWA (installed app) mode.
        </p>
        <div className="space-y-2">
          {ALL_PLACEMENTS.map((placement) => (
            <label key={placement.key} className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={(settings?.pwa_suppressed || []).includes(placement.key)}
                onChange={() => togglePwaSuppression(placement.key)}
                className="w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-slate-700 dark:text-slate-300 text-sm">{placement.label}</span>
                <span className="block text-xs text-slate-400 dark:text-slate-500 font-mono">{placement.key}</span>
              </div>
            </label>
          ))}
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
