"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const TABS = [
  { id: "profile", label: "User Settings", icon: UserIcon },
  { id: "notifications", label: "Notifications", icon: BellIcon },
  { id: "premium", label: "Premium", icon: StarIcon },
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

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  // For now, use existing user data from auth context
  // TODO: Create /bbjd/v1/user/settings endpoint to fetch full profile data
  useEffect(() => {
    if (isAuthenticated && user) {
      // Map auth context data to userData format
      setUserData({
        id: user.user_id || user.id,
        username: user.user_nicename,
        email: user.user_email || user.email,
        display_name: user.user_display_name || user.display_name,
        avatar: user.avatar,
        first_name: "",
        last_name: "",
        nickname: user.user_nicename,
        description: "",
        registered_date: null,
        registered_via: user.avatar?.includes("googleusercontent") ? "google" : "email",
        email_verified: true,
        is_supporter: user.user_roles?.includes("supporter") || false,
        roles: user.user_roles || [],
        stats: {
          total_comments: 0,
          total_likes: 0,
          total_dislikes: 0,
          total_votes: 0,
          user_rank: "Member",
          special_rank: null,
        },
        notifications: {
          new_reply: true,
          new_mention: true,
          new_message: true,
          feed_updates: false,
          newsletter: false,
        },
      });
      setLoadingData(false);
    }
  }, [user, isAuthenticated]);

  if (loading) {
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
    <main className="min-h-screen bg-slate-50 dark:bg-gray-950 py-8">
      <div className="max-w-screen-xl mx-auto px-4">
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
            <nav className="flex" aria-label="Settings tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
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
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "profile" && (
              <ProfileTab user={user} userData={userData} loading={loadingData} />
            )}
            {activeTab === "notifications" && (
              <NotificationsTab userData={userData} loading={loadingData} />
            )}
            {activeTab === "premium" && (
              <PremiumTab user={user} userData={userData} loading={loadingData} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileTab({ user, userData, loading }) {
  if (loading) {
    return <SettingsSkeleton />;
  }

  const avatarUrl = user?.avatar || userData?.avatar;
  const displayName = user?.user_display_name || user?.display_name || userData?.display_name;

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <div className="flex items-start gap-6">
        <div className="relative">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || "User"}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center border-4 border-slate-100 dark:border-slate-800">
              <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {displayName?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <button className="absolute bottom-0 right-0 p-1.5 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Photo</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {userData?.registered_via === "google"
              ? "Your profile photo is synced from your Google account."
              : "Upload a profile photo or use your Gravatar."}
          </p>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="grid gap-6 sm:grid-cols-2">
        <SettingsField
          label="Display Name"
          value={displayName}
          placeholder="Your display name"
        />
        <SettingsField
          label="Username"
          value={user?.user_nicename || userData?.username}
          placeholder="username"
          disabled
          hint="Username cannot be changed"
        />
        <SettingsField
          label="First Name"
          value={userData?.first_name}
          placeholder="First name"
        />
        <SettingsField
          label="Last Name"
          value={userData?.last_name}
          placeholder="Last name"
        />
        <SettingsField
          label="Email"
          value={user?.user_email || user?.email || userData?.email}
          placeholder="email@example.com"
          type="email"
          className="sm:col-span-2"
          badge={userData?.email_verified ? "Verified" : "Unverified"}
          badgeColor={userData?.email_verified ? "green" : "yellow"}
        />
        <SettingsField
          label="Bio"
          value={userData?.description}
          placeholder="Tell us about yourself..."
          multiline
          className="sm:col-span-2"
        />
      </div>

      {/* Account Info */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Account Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Member Since</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {userData?.registered_date
                ? new Date(userData.registered_date).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Account Type</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {userData?.registered_via === "google" ? "Google Account" : "Email/Password"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">User ID</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {user?.user_id || user?.id || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button (disabled for now) */}
      <div className="flex justify-end pt-4">
        <button
          disabled
          className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium opacity-50 cursor-not-allowed"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

function NotificationsTab({ userData, loading }) {
  if (loading) {
    return <SettingsSkeleton />;
  }

  const notifications = [
    {
      id: "new_reply",
      label: "Comment Replies",
      description: "Get notified when someone replies to your comment",
      enabled: userData?.notifications?.new_reply ?? true,
    },
    {
      id: "new_mention",
      label: "Mentions",
      description: "Get notified when someone mentions you in a comment",
      enabled: userData?.notifications?.new_mention ?? true,
    },
    {
      id: "new_message",
      label: "Direct Messages",
      description: "Get notified when you receive a private message",
      enabled: userData?.notifications?.new_message ?? true,
    },
    {
      id: "feed_updates",
      label: "Feed Update Alerts",
      description: "Get push notifications for breaking feed updates",
      enabled: userData?.notifications?.feed_updates ?? false,
      premium: true,
    },
    {
      id: "newsletter",
      label: "Email Newsletter",
      description: "Receive our weekly Big Brother newsletter",
      enabled: userData?.notifications?.newsletter ?? false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notification Preferences
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choose how you want to be notified about activity on your account.
        </p>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
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
            <ToggleSwitch enabled={notification.enabled} disabled />
          </div>
        ))}
      </div>

      {/* Save Button (disabled for now) */}
      <div className="flex justify-end pt-4">
        <button
          disabled
          className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium opacity-50 cursor-not-allowed"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

function PremiumTab({ user, userData, loading }) {
  if (loading) {
    return <SettingsSkeleton />;
  }

  const isSupporter = user?.user_roles?.includes("supporter") || userData?.is_supporter;
  const stats = {
    totalComments: userData?.stats?.total_comments ?? 0,
    totalLikes: userData?.stats?.total_likes ?? 0,
    totalDislikes: userData?.stats?.total_dislikes ?? 0,
    totalVotes: userData?.stats?.total_votes ?? 0,
    userRank: userData?.stats?.user_rank ?? "New Member",
    specialRank: userData?.stats?.special_rank ?? null,
  };

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
                <span className="text-2xl">⭐</span>
              ) : (
                <span className="text-2xl">👤</span>
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
          <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <p className="text-sm text-secondary-700 dark:text-secondary-300">
              Your support helps keep the lights on and the spoilers flowing!
            </p>
          </div>
        )}
      </div>

      {/* User Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Activity Stats
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Comments" value={stats.totalComments} icon="💬" />
          <StatCard label="Likes Received" value={stats.totalLikes} icon="👍" />
          <StatCard label="Total Votes" value={stats.totalVotes} icon="🗳️" />
          <StatCard
            label="Community Rank"
            value={stats.userRank}
            icon="🏆"
            isText
          />
        </div>
      </div>

      {/* Badges / Special Ranks */}
      {stats.specialRank && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Special Badges
          </h3>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
              ✨ {stats.specialRank}
            </span>
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
            { text: "Priority push notifications", included: isSupporter },
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

function SettingsField({ label, value, placeholder, type = "text", disabled, hint, multiline, className, badge, badgeColor }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {badge && (
          <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
            badgeColor === "green"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}>
            {badge}
          </span>
        )}
      </label>
      {multiline ? (
        <textarea
          value={value || ""}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed resize-none"
          readOnly
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
          readOnly
        />
      )}
      {hint && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

function ToggleSwitch({ enabled, disabled }) {
  return (
    <button
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

function StatCard({ label, value, icon, isText }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
      <span className="text-2xl">{icon}</span>
      <p className={`font-bold text-gray-900 dark:text-white mt-1 ${isText ? "text-sm" : "text-2xl"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
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
