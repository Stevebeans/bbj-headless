"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getSettings,
  updateSettings,
  updateNotifications,
  uploadAvatar,
  deleteAvatar,
  verifyEmailChange,
  getEmailPreferences,
  updateEmailPreferences,
} from "@/lib/api/settings";
import PlayerSearchDropdown from "@/components/settings/PlayerSearchDropdown";
import EmailChangeModal from "@/components/settings/EmailChangeModal";
import HelpTab from "@/components/settings/HelpTab";
import RankBadge from "@/components/comments/RankBadge";
// Push toggle parked 2026-06-07 with the PWA (native-app path TBD). Code kept.
// import PushToggle from "@/components/notifications/PushToggle";

const TABS = [
  { id: "profile", label: "User Settings", icon: UserIcon },
  { id: "notifications", label: "Notifications", icon: BellIcon },
  { id: "premium", label: "Premium", icon: StarIcon },
  { id: "help", label: "Help", icon: HelpIcon },
];

function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function StarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function HelpIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LabeledThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) {
    return <div className="h-10 w-24" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          <span className="hidden sm:inline">Dark Mode</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Light Mode</span>
        </>
      )}
    </button>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-200 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [toast, setToast] = useState(null);

  // Handle tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle email verification from URL
  useEffect(() => {
    const action = searchParams.get("action");
    const token = searchParams.get("token");

    if (action === "verify_email" && token) {
      (async () => {
        try {
          const result = await verifyEmailChange(token);
          if (result.success) {
            setToast({ message: "Email updated successfully!", type: "success" });
            // Reload settings to get new email
            const settingsResult = await getSettings();
            if (settingsResult.success) {
              setSettings(settingsResult.settings);
            }
          }
        } catch (err) {
          setToast({ message: err.message, type: "error" });
        }
        // Clean up URL
        router.replace("/settings", { scroll: false });
      })();
    }
  }, [searchParams, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load settings
  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      const result = await getSettings();
      if (result.success) {
        setSettings(result.settings);
      }
    } catch (err) {
      showToast("Failed to load settings", "error");
    } finally {
      setLoadingSettings(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-200 dark:bg-gray-950 py-8">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Toast notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}>
            {toast.message}
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
            Account Settings
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage your profile, notifications, and subscription
          </p>
        </div>

        {/* Tabs + Content Container */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <nav className="flex overflow-x-auto" aria-label="Settings tabs">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                        ${isActive
                          ? "border-primary-500 text-primary-600 dark:text-primary-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-slate-300"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
              {/* Theme Toggle */}
              <div className="flex items-center border-b-2 border-transparent">
                <LabeledThemeToggle />
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "profile" && (
              <ProfileTab
                settings={settings}
                loading={loadingSettings}
                onUpdate={loadSettings}
                showToast={showToast}
                refreshUser={refreshUser}
              />
            )}
            {activeTab === "notifications" && (
              <NotificationsTab
                settings={settings}
                loading={loadingSettings}
                onUpdate={loadSettings}
                showToast={showToast}
              />
            )}
            {activeTab === "premium" && (
              <PremiumTab settings={settings} loading={loadingSettings} showToast={showToast} />
            )}
            {activeTab === "help" && <HelpTab />}
          </div>
        </div>

        {/* Logout Section */}
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Sign Out
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Log out of your account on this device
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileTab({ settings, loading, onUpdate, showToast, refreshUser }) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings?.profile) {
      setFormData({
        display_name: settings.profile.display_name || "",
        first_name: settings.profile.first_name || "",
        last_name: settings.profile.last_name || "",
        bio: settings.profile.bio || "",
        favorite_player: settings.profile.favorite_player || null,
      });
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        display_name: formData.display_name,
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
        favorite_player_id: formData.favorite_player?.id || null,
      });
      showToast("Profile updated successfully!");
      setHasChanges(false);
      onUpdate();
      // Refresh auth context so header uses new display name
      refreshUser?.();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Only JPG, PNG, GIF, and WebP images are allowed", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("File size must be under 2MB", "error");
      return;
    }

    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      showToast("Avatar updated!");
      onUpdate();
      // Refresh auth context so header/comments use new avatar
      refreshUser?.();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    if (!confirm("Remove your custom avatar? Your Gravatar (if any) will be used instead.")) {
      return;
    }

    setUploadingAvatar(true);
    try {
      await deleteAvatar();
      showToast("Avatar removed");
      onUpdate();
      // Refresh auth context so header/comments use new avatar
      refreshUser?.();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  const profile = settings?.profile;

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <div className="flex items-start gap-6">
        <div className="relative">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name || "User"}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center border-4 border-slate-100 dark:border-slate-800">
              <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {profile?.display_name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          {uploadingAvatar ? (
            <div className="absolute bottom-0 right-0 p-1.5 bg-slate-500 text-white rounded-full">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Photo</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {profile?.registered_via === "google"
              ? "Upload a custom photo or keep using your Google account photo."
              : "Upload a profile photo or use your Gravatar."}
          </p>
          {profile?.has_custom_avatar && (
            <button
              onClick={handleAvatarDelete}
              className="mt-2 text-sm text-red-500 hover:text-red-600"
            >
              Remove custom avatar
            </button>
          )}
        </div>
      </div>

      {/* Profile Fields */}
      <div className="grid gap-6 sm:grid-cols-2">
        <SettingsField
          label="Display Name"
          value={formData.display_name}
          onChange={(v) => handleChange("display_name", v)}
          placeholder="Your display name"
        />
        <SettingsField
          label="Username"
          value={profile?.username}
          placeholder="username"
          disabled
          hint="Username cannot be changed"
        />
        <SettingsField
          label="First Name"
          value={formData.first_name}
          onChange={(v) => handleChange("first_name", v)}
          placeholder="First name"
        />
        <SettingsField
          label="Last Name"
          value={formData.last_name}
          onChange={(v) => handleChange("last_name", v)}
          placeholder="Last name"
        />
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
              Verified
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={profile?.email || ""}
              disabled
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-500 dark:text-gray-400"
            />
            <button
              onClick={() => setEmailModalOpen(true)}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Change
            </button>
          </div>
        </div>
        <SettingsField
          label="Bio"
          value={formData.bio}
          onChange={(v) => handleChange("bio", v)}
          placeholder="Tell us about yourself..."
          multiline
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <PlayerSearchDropdown
            value={formData.favorite_player}
            onChange={(player) => handleChange("favorite_player", player)}
          />
        </div>
      </div>

      {/* Account Info */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Account Information
          </h3>
          {profile?.username && (
            <Link
              href={`/users/${profile.username}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Public Profile
            </Link>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Member Since</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {profile?.registered_date
                ? new Date(profile.registered_date).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Account Type</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {profile?.registered_via === "google" ? "Google Account" : "Email/Password"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">User ID</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {profile?.id || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* Email Change Modal */}
      <EmailChangeModal
        currentEmail={profile?.email}
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
}

function NotificationsTab({ settings, loading, onUpdate, showToast }) {
  const [notifications, setNotifications] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState(null);

  const isSupporter = settings?.premium?.is_supporter;

  // Initialize from settings + load email preferences
  useEffect(() => {
    if (settings?.notifications) {
      setNotifications(settings.notifications);
    }
    // Sync newsletter toggle with email preferences
    getEmailPreferences()
      .then((result) => {
        const isSubscribed = (result.lists || []).some(
          (l) => l.slug === "post-notifications" && l.subscribed
        );
        setNotifications((prev) => ({ ...prev, newsletter: isSubscribed }));
      })
      .catch(() => {});
  }, [settings]);

  // Load subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        const { getSubscriptions } = await import("@/lib/api/subscriptions");
        const result = await getSubscriptions({ perPage: 50 });
        setSubscriptions(result.subscriptions || []);
      } catch (error) {
        console.error("Failed to load subscriptions:", error);
      } finally {
        setLoadingSubs(false);
      }
    };

    loadSubscriptions();
  }, []);

  const handleToggle = (key) => {
    // Prevent non-supporters from enabling feed_updates
    if (key === "feed_updates" && !notifications[key] && !isSupporter) {
      return;
    }

    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotifications(notifications);

      // Sync newsletter toggle with email preferences API
      const lists = notifications.newsletter ? ["post-notifications"] : [];
      await updateEmailPreferences(lists).catch(() => {});

      showToast("Notification preferences saved!");
      setHasChanges(false);
      onUpdate();
    } catch (err) {
      if (err.code === "premium_required") {
        showToast("Feed update notifications require a premium subscription", "error");
        // Reset feed_updates toggle
        setNotifications((prev) => ({ ...prev, feed_updates: false }));
      } else {
        showToast(err.message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async (postId) => {
    setUnsubscribing(postId);
    try {
      const { unsubscribeFromPost } = await import("@/lib/api/subscriptions");
      await unsubscribeFromPost(postId);
      setSubscriptions((prev) => prev.filter((s) => s.post_id !== postId));
      showToast("Unsubscribed from thread");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setUnsubscribing(null);
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  const notificationOptions = [
    {
      id: "new_reply",
      label: "Comment Replies",
      description: "Get notified when someone replies to your comment",
    },
    {
      id: "new_mention",
      label: "Mentions",
      description: "Get notified when someone mentions you in a comment",
    },
    {
      id: "new_message",
      label: "Direct Messages",
      description: "Get notified when you receive a private message",
    },
    // Push notifications hidden until mobile app is ready
    // {
    //   id: "feed_updates",
    //   label: "Feed Update Alerts",
    //   description: "Get push notifications for breaking feed updates",
    //   premium: true,
    // },
    {
      id: "newsletter",
      label: "Post Notifications",
      description: "Get an email when a new blog post is published",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Notification Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notification Preferences
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choose how you want to be notified about activity on your account.
        </p>

        <div className="space-y-4 mt-4">
          {/* <PushToggle /> parked with the PWA (see import note above) */}
          {notificationOptions.map((notification) => {
            const isLocked = notification.premium && !isSupporter;

            return (
              <div
                key={notification.id}
                className={`flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg ${
                  isLocked ? "opacity-60" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {notification.label}
                    </span>
                    {notification.premium && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400 rounded-full">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {notification.description}
                  </p>
                </div>
                <ToggleSwitch
                  enabled={notifications[notification.id] ?? false}
                  onChange={() => handleToggle(notification.id)}
                  disabled={isLocked}
                />
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </div>

      {/* Thread Subscriptions */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Subscribed Threads
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Posts you're following. You'll get notified of all new comments.
        </p>

        <div className="mt-4">
          {loadingSubs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                  </div>
                  <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                You're not subscribed to any threads
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Click the bell icon in a post's comment section to subscribe
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={sub.post_url}
                      className="font-medium text-gray-900 dark:text-white hover:text-primary-500 truncate block"
                    >
                      {sub.post_title}
                    </Link>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Subscribed {sub.subscribed_ago}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnsubscribe(sub.post_id)}
                    disabled={unsubscribing === sub.post_id}
                    className="ml-3 px-3 py-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {unsubscribing === sub.post_id ? (
                      <span className="flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </span>
                    ) : (
                      "Unsubscribe"
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getInvoiceStatusClasses(status) {
  switch (status) {
    case "active":
    case "lifetime":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "canceled":
    case "expired":
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    default:
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  }
}

function PremiumTab({ settings, loading, showToast }) {
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [feedPerPage, setFeedPerPage] = useState(20);
  const [savingPerPage, setSavingPerPage] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);
  const [showChangePlanConfirm, setShowChangePlanConfirm] = useState(null);

  // Load subscription details
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const { getSubscription } = await import("@/lib/api/billing");
        const result = await getSubscription();
        if (result.has_subscription) {
          setSubscription(result.subscription);
        }
      } catch (error) {
        console.error("Failed to load subscription:", error);
      } finally {
        setLoadingSub(false);
      }
    };

    loadSubscription();
  }, []);

  // Load invoices for premium users
  useEffect(() => {
    if (settings?.premium?.is_supporter) {
      (async () => {
        try {
          const { getInvoices } = await import("@/lib/api/billing");
          const result = await getInvoices();
          setInvoices(result.invoices || []);
        } catch (error) {
          console.error("Failed to load invoices:", error);
        } finally {
          setLoadingInvoices(false);
        }
      })();
    } else {
      setLoadingInvoices(false);
    }
  }, [settings]);

  // Load feed per-page preference for premium users
  useEffect(() => {
    if (settings?.premium?.is_supporter) {
      import("@/lib/api/settings").then(({ getPreferences }) => {
        getPreferences()
          .then((result) => {
            if (result?.preferences?.feed_per_page) {
              setFeedPerPage(result.preferences.feed_per_page);
            }
          })
          .catch(() => {});
      });
    }
  }, [settings]);

  const handleFeedPerPageChange = async (value) => {
    const val = parseInt(value, 10);
    setFeedPerPage(val);
    setSavingPerPage(true);
    try {
      const { updatePreferences } = await import("@/lib/api/settings");
      await updatePreferences({ feed_per_page: val });
      showToast?.("Feed updates per-page preference saved!");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setSavingPerPage(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!subscription) return;

    // For Stripe subscriptions, open customer portal
    if (subscription.processor === "stripe") {
      try {
        const { getPortalUrl } = await import("@/lib/api/billing");
        const result = await getPortalUrl(window.location.href);
        window.location.href = result.url;
      } catch (error) {
        showToast?.(error.message, "error");
      }
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const { cancelSubscription } = await import("@/lib/api/billing");
      const result = await cancelSubscription();
      showToast?.(result.message || "Subscription cancelled", "success");
      setShowCancelConfirm(false);
      await refreshSubscription();
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      setCancelling(false);
    }
  };

  const refreshSubscription = async () => {
    const { getSubscription } = await import("@/lib/api/billing");
    const subResult = await getSubscription();
    setSubscription(subResult.has_subscription ? subResult.subscription : null);
  };

  const handleChangePlan = async (planType) => {
    setChangingPlan(true);
    try {
      const { changePlan } = await import("@/lib/api/billing");
      const result = await changePlan(planType);
      showToast?.(result.message || "Plan changed successfully!", "success");
      setShowChangePlanConfirm(null);
      await refreshSubscription();
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      setChangingPlan(false);
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  const premium = settings?.premium;
  const rank = settings?.rank;
  const isSupporter = premium?.is_supporter;

  return (
    <div className="space-y-8">
      {/* Subscription Status */}
      <div className={`p-6 rounded-xl ${
        isSupporter
          ? "bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 border border-secondary-200 dark:border-secondary-800"
          : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {isSupporter ? (
                <span className="text-2xl">&#11088;</span>
              ) : (
                <span className="text-2xl">&#128100;</span>
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {isSupporter ? "BBJ Supporter" : "Free Member"}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {isSupporter
                ? "Thank you for supporting Big Brother Junkies! You enjoy an ad-free experience."
                : "Upgrade to Supporter status to enjoy an ad-free experience and exclusive features."}
            </p>
          </div>
          {!isSupporter && (
            <Link
              href="/become-supporter"
              className="shrink-0 px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white font-medium rounded-lg transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>

        {isSupporter && (
          <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-secondary-600 dark:text-secondary-400">Supporter Since</span>
              <p className="font-medium text-secondary-800 dark:text-secondary-200">
                {premium?.supporter_since
                  ? new Date(premium.supporter_since).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-secondary-600 dark:text-secondary-400">Gifts Given</span>
              <p className="font-medium text-secondary-800 dark:text-secondary-200">
                {premium?.gifts_given || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Details (for active subscribers) */}
      {isSupporter && !loadingSub && subscription && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Subscription Details
          </h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Plan</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {subscription.plan_name}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Amount</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {subscription.amount_display}
                  {subscription.plan_type !== "lifetime" && `/${subscription.plan_type === "monthly" ? "mo" : "yr"}`}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Payment Method</span>
                {subscription.payment_method?.type === "card" ? (
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {subscription.payment_method.brand} ending in {subscription.payment_method.last4}
                  </p>
                ) : (
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {subscription.processor}
                  </p>
                )}
                {subscription.processor === "stripe" ? (
                  <button
                    onClick={handleManageSubscription}
                    className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 mt-0.5"
                  >
                    Update payment method
                  </button>
                ) : subscription.processor === "paypal" ? (
                  <a
                    href="https://www.paypal.com/myaccount/autopay"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 mt-0.5 inline-block"
                  >
                    Manage on PayPal
                  </a>
                ) : null}
              </div>
              {subscription.plan_type !== "lifetime" && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {subscription.cancel_at_period_end ? "Access Until" : "Next Billing"}
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {subscription.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              )}
            </div>

            {/* Cancellation Notice */}
            {subscription.cancel_at_period_end && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Your subscription is cancelled and will end on{" "}
                  {new Date(subscription.current_period_end).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}. You'll retain access until then.
                </p>
              </div>
            )}

            {/* Management Buttons */}
            {subscription.plan_type !== "lifetime" && !subscription.cancel_at_period_end && (
              <div className="flex gap-3 pt-2">
                {subscription.processor === "stripe" && (
                  <button
                    onClick={handleManageSubscription}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    Manage Subscription
                  </button>
                )}
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors text-sm"
                >
                  Cancel Subscription
                </button>
              </div>
            )}

            {subscription.plan_type === "lifetime" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
                You have lifetime access. Thank you for your support!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Change Plan (active non-lifetime, non-cancelled subs) */}
      {isSupporter && !loadingSub && subscription && subscription.plan_type !== "lifetime" && !subscription.cancel_at_period_end && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Change Plan
          </h3>
          <div className="space-y-3">
            {subscription.plan_type === "monthly" && (
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Switch to Season Pass</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">$35/yr — Save over 58% vs monthly</p>
                </div>
                <button
                  onClick={() => setShowChangePlanConfirm("annual")}
                  className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Switch
                </button>
              </div>
            )}
            {subscription.plan_type === "annual" && (
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Switch to Monthly</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">$6.95/mo — Flexible monthly billing</p>
                </div>
                <button
                  onClick={() => setShowChangePlanConfirm("monthly")}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors text-sm"
                >
                  Switch
                </button>
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 rounded-lg border border-secondary-200 dark:border-secondary-800">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Upgrade to Lifetime</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">$99 one-time — Never pay again</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 italic max-w-[160px] text-right">
                Cancel current sub first, then purchase Lifetime
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {isSupporter && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment History
          </h3>
          {loadingInvoices ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                  </div>
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No payment history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Plan</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="py-3 text-gray-900 dark:text-white">
                        {new Date(invoice.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-gray-900 dark:text-white">{invoice.plan_name}</td>
                      <td className="py-3 text-gray-900 dark:text-white">{invoice.amount_display}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getInvoiceStatusClasses(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Preferences (premium only) */}
      {isSupporter && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Preferences
          </h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Feed Updates Per Page
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  How many feed updates to show per page on the archive
                </p>
              </div>
              <div className="flex items-center gap-2">
                {savingPerPage && (
                  <svg className="animate-spin h-4 w-4 text-primary-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <select
                  value={feedPerPage}
                  onChange={(e) => handleFeedPerPageChange(e.target.value)}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {[10, 20, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} per page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Cancel Subscription?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel? You'll retain access until the end of your current billing period, but your subscription won't renew.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {cancelling ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Confirmation Modal */}
      {showChangePlanConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {showChangePlanConfirm === "annual" ? "Switch to Season Pass?" : "Switch to Monthly?"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {showChangePlanConfirm === "annual"
                ? "You'll be switched to the Season Pass ($35/yr). The change will be prorated, and you'll only pay the difference for the remaining time."
                : "You'll be switched to Monthly billing ($6.95/mo). The change will take effect at the start of your next billing cycle."}
            </p>
            {subscription?.processor === "paypal" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  PayPal subscriptions cannot be changed mid-cycle. Please cancel your current subscription and resubscribe with the new plan.
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setShowChangePlanConfirm(null)}
                disabled={changingPlan}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              {subscription?.processor !== "paypal" && (
                <button
                  onClick={() => handleChangePlan(showChangePlanConfirm)}
                  disabled={changingPlan}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {changingPlan ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Switching...
                    </>
                  ) : (
                    "Confirm Switch"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Rank */}
      {rank && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Community Rank
          </h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <RankBadge rank={rank} size="md" />
              {rank.is_special && (
                <span className="text-xs text-gray-500 dark:text-gray-400">Special Rank</span>
              )}
            </div>

            {rank.stats && (
              <div className="grid grid-cols-3 gap-4 text-center text-sm border-t border-slate-200 dark:border-slate-700 pt-3">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{rank.stats.comments}</p>
                  <p className="text-xs text-gray-500">Comments</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{rank.stats.karma}</p>
                  <p className="text-xs text-gray-500">Karma</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {rank.stats.upvotes_received - rank.stats.downvotes_received >= 0 ? "+" : ""}
                    {rank.stats.upvotes_received - rank.stats.downvotes_received}
                  </p>
                  <p className="text-xs text-gray-500">Net Votes</p>
                </div>
              </div>
            )}

            {rank.next_rank && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Progress to <strong>{rank.next_rank.rank_name}</strong>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Comments</span>
                      <span>{rank.next_rank.comment_progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${rank.next_rank.comment_progress}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Karma</span>
                      <span>{rank.next_rank.karma_progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary-500 rounded-full transition-all"
                        style={{ width: `${rank.next_rank.karma_progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benefits List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {isSupporter ? "Your Benefits" : "Supporter Benefits"}
        </h3>
        <ul className="space-y-3">
          {[
            { text: "Ad-free browsing experience", included: isSupporter },
            { text: "Priority feed update notifications", included: isSupporter },
            { text: "Exclusive supporter badge", included: isSupporter },
            { text: "Early access to new features", included: isSupporter },
            { text: "Support independent BB coverage", included: isSupporter },
          ].map((benefit, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                benefit.included
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}>
                {benefit.included ? "✓" : "○"}
              </span>
              <span className={benefit.included ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                {benefit.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SettingsField({ label, value, onChange, placeholder, type = "text", disabled, hint, multiline, className }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed resize-none"
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        />
      )}
      {hint && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

function ToggleSwitch({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-600"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={i >= 4 ? "sm:col-span-2" : ""}>
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
