"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  createFeedUpdate,
  getMode,
  setMode as setModeApi,
  getSocialConfig,
} from "@/lib/api/feedUpdates";

// Roles that can post feed updates
const UPDATER_ROLES = ["administrator", "editor", "updater", "second_in_command"];

// Character limits
const MAX_CONTENT_LENGTH = 1000;
const BLUESKY_LIMIT = 300;

function getCharCountColor(isOverLimit, blueskyWarning) {
  if (isOverLimit) return "text-red-500";
  if (blueskyWarning) return "text-yellow-600 dark:text-yellow-400";
  return "text-gray-500";
}

export function FloatingUpdater() {
  const { user, isAuthenticated, hasAnyRole } = useAuth();

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [content, setContent] = useState("");
  const [mode, setModeState] = useState("feed"); // feed or show
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Social posting
  const [postToBluesky, setPostToBluesky] = useState(true);
  const [postToFacebook, setPostToFacebook] = useState(false);
  const [socialConfig, setSocialConfig] = useState(null);

  // Refs
  const fileInputRef = useRef(null);

  // Check if user can post updates
  const canPost = isAuthenticated && hasAnyRole(UPDATER_ROLES);

  // Load user's mode preference and social config
  useEffect(() => {
    if (canPost && user?.token) {
      // Load mode preference
      getMode(user.token)
        .then((data) => {
          if (data.mode) setModeState(data.mode);
        })
        .catch(() => {}); // Silently fail

      // Load social config
      getSocialConfig(user.token)
        .then((data) => {
          setSocialConfig(data);
          // Set defaults based on config
          setPostToBluesky(data.bluesky?.configured || false);
          setPostToFacebook(false); // Always default off for Facebook
        })
        .catch(() => {});
    }
  }, [canPost, user?.token]);

  // Don't render if user can't post
  if (!canPost) return null;

  const handleModeToggle = async () => {
    const newMode = mode === "feed" ? "show" : "feed";
    setModeState(newMode);

    // Persist to server
    if (user?.token) {
      setModeApi(newMode, user.token).catch(() => {});
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    // Warn if Facebook is checked but no image
    if (postToFacebook && !imageFile) {
      const proceed = window.confirm(
        "Facebook posts perform better with an image. Continue without one?"
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createFeedUpdate(
        {
          content: content.trim(),
          mode,
          image: imageFile,
          postToBluesky,
          postToFacebook,
        },
        user.token
      );

      // Show success message
      let successMsg = "Update posted!";
      const socialPosts = [];
      if (result.social_results?.bluesky?.posted) socialPosts.push("Bluesky");
      if (result.social_results?.facebook?.posted) socialPosts.push("Facebook");
      if (socialPosts.length > 0) {
        successMsg += ` Also posted to ${socialPosts.join(" & ")}.`;
      }
      setSuccess(successMsg);

      // Reset form
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Auto-close after success
      setTimeout(() => {
        setSuccess(null);
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to post update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CONTENT_LENGTH;
  const blueskyWarning = postToBluesky && charCount > BLUESKY_LIMIT;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          mode === "feed"
            ? "bg-primary-500 hover:bg-primary-600"
            : "bg-secondary-600 hover:bg-secondary-500"
        }`}
        aria-label={isOpen ? "Close updater" : "Post feed update"}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-2 rounded-t-lg ${
              mode === "feed"
                ? "bg-primary-500 text-white"
                : "bg-secondary-600 text-white"
            }`}
          >
            <span className="font-semibold">
              {mode === "feed" ? "Feed Update" : "Show Update"}
            </span>
            <button
              onClick={handleModeToggle}
              className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
            >
              Switch to {mode === "feed" ? "Show" : "Feed"}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-3 p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm">
                {success}
              </div>
            )}

            {/* Content Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                mode === "feed"
                  ? "What's happening on the feeds?"
                  : "What's happening on the show?"
              }
              className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:outline-none dark:bg-gray-700 dark:text-white ${
                isOverLimit
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
              }`}
              rows={4}
              maxLength={MAX_CONTENT_LENGTH + 50}
            />

            {/* Character Count */}
            <div className="flex justify-between text-xs mt-1 mb-3">
              <span className={getCharCountColor(isOverLimit, blueskyWarning)}>
                {charCount}/{MAX_CONTENT_LENGTH}
                {blueskyWarning && (
                  <span className="ml-1">(Bluesky limit: {BLUESKY_LIMIT})</span>
                )}
              </span>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mb-3 inline-block">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={120}
                  height={80}
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}

            {/* Actions Row */}
            <div className="flex items-center justify-between gap-2 mb-3">
              {/* Image Upload */}
              <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Add Image</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>

              {/* Social Posting Options */}
              <div className="flex items-center gap-3 text-sm">
                <label
                  className={`flex items-center gap-1 ${
                    socialConfig?.bluesky?.configured
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  }`}
                  title={
                    socialConfig?.bluesky?.configured
                      ? "Post to Bluesky"
                      : "Bluesky not configured"
                  }
                >
                  <input
                    type="checkbox"
                    checked={postToBluesky && socialConfig?.bluesky?.configured}
                    onChange={(e) => setPostToBluesky(e.target.checked)}
                    disabled={!socialConfig?.bluesky?.configured}
                    className="w-4 h-4 text-blue-500 rounded disabled:opacity-50"
                  />
                  <span className={socialConfig?.bluesky?.configured ? "text-blue-500" : "text-gray-400"}>
                    <svg className="w-4 h-4" viewBox="0 0 568 501" fill="currentColor">
                      <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.89-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.659 0 75.291 0 57.946 0-28.906 76.135-1.612 123.121 33.664Z" />
                    </svg>
                  </span>
                </label>
                <label
                  className={`flex items-center gap-1 ${
                    socialConfig?.facebook?.configured
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  }`}
                  title={
                    socialConfig?.facebook?.configured
                      ? "Post to Facebook"
                      : "Facebook not configured"
                  }
                >
                  <input
                    type="checkbox"
                    checked={postToFacebook && socialConfig?.facebook?.configured}
                    onChange={(e) => setPostToFacebook(e.target.checked)}
                    disabled={!socialConfig?.facebook?.configured}
                    className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                  />
                  <span className={socialConfig?.facebook?.configured ? "text-blue-600" : "text-gray-400"}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || isOverLimit}
              className={`w-full py-2 rounded-lg font-semibold text-white transition-colors ${
                isSubmitting || !content.trim() || isOverLimit
                  ? "bg-gray-400 cursor-not-allowed"
                  : mode === "feed"
                  ? "bg-primary-500 hover:bg-primary-600"
                  : "bg-secondary-600 hover:bg-secondary-500"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Posting...
                </span>
              ) : (
                `Post ${mode === "feed" ? "Feed" : "Show"} Update`
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
