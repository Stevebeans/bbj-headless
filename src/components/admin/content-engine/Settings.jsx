"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getContentEngineSettings,
  updateContentEngineSettings,
} from "@/lib/api/admin";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form state
  const [anthropicKey, setAnthropicKey] = useState("");
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [facebookPages, setFacebookPages] = useState([]);
  const [newsFeedSources, setNewsFeedSources] = useState([]);
  const [defaultTimes, setDefaultTimes] = useState(["09:00", "12:00", "18:00"]);

  // New page form
  const [newPageName, setNewPageName] = useState("");
  const [newPageId, setNewPageId] = useState("");
  const [newPageToken, setNewPageToken] = useState("");

  // New source form
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContentEngineSettings();
      setSettings(data);
      setHasAnthropicKey(!!data.has_anthropic_key);
      setFacebookPages(data.facebook_pages || []);
      setNewsFeedSources(data.news_sources || []);
      setDefaultTimes(
        data.default_posting_times || ["09:00", "12:00", "18:00"]
      );
    } catch (err) {
      showFeedback("error", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddPage = () => {
    if (!newPageName.trim() || !newPageId.trim() || !newPageToken.trim()) return;
    setFacebookPages((prev) => [
      ...prev,
      { id: newPageId.trim(), name: newPageName.trim(), token: newPageToken.trim() },
    ]);
    setNewPageName("");
    setNewPageId("");
    setNewPageToken("");
  };

  const handleRemovePage = (index) => {
    setFacebookPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;
    setNewsFeedSources((prev) => [
      ...prev,
      { name: newSourceName.trim(), url: newSourceUrl.trim() },
    ]);
    setNewSourceName("");
    setNewSourceUrl("");
  };

  const handleRemoveSource = (index) => {
    setNewsFeedSources((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        facebook_pages: facebookPages,
        news_sources: newsFeedSources,
        default_posting_times: defaultTimes,
      };
      if (anthropicKey) {
        payload.anthropic_api_key = anthropicKey;
      }
      await updateContentEngineSettings(payload);
      showFeedback("success", "Settings saved successfully!");
      setAnthropicKey("");
      fetchSettings();
    } catch (err) {
      showFeedback("error", err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Anthropic API Key */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Anthropic API Key
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="password"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder={hasAnthropicKey ? "Key configured (enter to update)" : "sk-ant-..."}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
          />
          {hasAnthropicKey && (
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">
              Connected
            </span>
          )}
        </div>
      </div>

      {/* Facebook Pages */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Facebook Pages
        </h3>
        {facebookPages.length > 0 && (
          <div className="space-y-2 mb-3">
            {facebookPages.map((pg, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {pg.name}
                  </span>
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs">
                    Connected
                  </span>
                </div>
                <button
                  onClick={() => handleRemovePage(i)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            placeholder="Page name"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400"
          />
          <input
            type="text"
            value={newPageId}
            onChange={(e) => setNewPageId(e.target.value)}
            placeholder="Page ID"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400"
          />
          <input
            type="text"
            value={newPageToken}
            onChange={(e) => setNewPageToken(e.target.value)}
            placeholder="Access token"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400"
          />
        </div>
        <button
          onClick={handleAddPage}
          disabled={!newPageName.trim() || !newPageId.trim() || !newPageToken.trim()}
          className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          Add Page
        </button>
      </div>

      {/* News Sources */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          News Sources (RSS Feeds)
        </h3>
        {newsFeedSources.length > 0 && (
          <div className="space-y-2 mb-3">
            {newsFeedSources.map((src, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {src.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-400 truncate">
                    {src.url}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveSource(i)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium flex-shrink-0 ml-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            placeholder="Source name"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400"
          />
          <input
            type="url"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            placeholder="RSS feed URL"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400"
          />
        </div>
        <button
          onClick={handleAddSource}
          disabled={!newSourceName.trim() || !newSourceUrl.trim()}
          className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          Add Source
        </button>
      </div>

      {/* Default Posting Times */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Default Posting Times
        </h3>
        <div className="flex items-center gap-3">
          {defaultTimes.map((time, i) => (
            <input
              key={i}
              type="time"
              value={time}
              onChange={(e) => {
                const updated = [...defaultTimes];
                updated[i] = e.target.value;
                setDefaultTimes(updated);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
            />
          ))}
        </div>
      </div>

      {/* Save button */}
      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
