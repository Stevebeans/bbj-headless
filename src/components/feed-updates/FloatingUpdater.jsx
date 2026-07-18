"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  createFeedUpdate,
  getMode,
  setMode as setModeApi,
  getSocialConfig,
} from "@/lib/api/feedUpdates";
import { downscaleImage } from "@/lib/images/downscaleImage";

// Character limits
const MAX_CONTENT_LENGTH = 1000;
const BLUESKY_LIMIT = 300;

// Video clip limits — mirror the server (FeedUpdateCreator::VIDEO_MAX_BYTES /
// VIDEO_MIMES). Duration is a client-side courtesy check; size is enforced on
// both ends.
const VIDEO_MAX_MB = 80;
const VIDEO_MAX_SECONDS = 180;
const VIDEO_ACCEPT = "video/mp4,video/x-m4v,video/quicktime,video/webm";

/** Resolve a video File's duration in seconds (null when unreadable). */
function getVideoDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(el.duration) ? el.duration : null);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    el.src = url;
  });
}

function getCharCountColor(isOverLimit, blueskyWarning) {
  if (isOverLimit) return "text-red-500";
  if (blueskyWarning) return "text-yellow-600 dark:text-yellow-400";
  return "text-gray-500";
}

export function FloatingUpdater() {
  const { user, isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();

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
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Social posting
  const [postToBluesky, setPostToBluesky] = useState(true);
  const [socialConfig, setSocialConfig] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Gate on the real feed_updates permission (matches the backend's
  // checkUpdaterPermission and the admin permission matrix) rather than a
  // hardcoded role list — so the button honors whatever roles you grant.
  const canPost = isAuthenticated && hasPermission("feed_updates");

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
          // Default on when configured
          setPostToBluesky(data.bluesky?.configured || false);
        })
        .catch(() => {});
    }
  }, [canPost, user?.token]);

  // Paste-to-attach: while the panel is open, an image on the clipboard
  // (feed screenshots!) attaches exactly like a picked file. Same pattern as
  // BugReportFAB. Registered before the canPost early-return (hooks rule).
  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e) => {
      const item = Array.from(e.clipboardData?.items || []).find((i) =>
        i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        attachImage(file);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  // Shared by the file input AND clipboard paste. Downscale before the size
  // guard so a large camera photo (5-8MB) gets shrunk first and can still
  // pass — the guard only rejects files that remain oversized after
  // processing (e.g. undecodable formats).
  async function attachImage(rawFile) {
    const file = await downscaleImage(rawFile);
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) await attachImage(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
      setError(`Video must be under ${VIDEO_MAX_MB}MB`);
      return;
    }
    const duration = await getVideoDuration(file);
    if (duration !== null && duration > VIDEO_MAX_SECONDS) {
      setError(`Clips max out at ${VIDEO_MAX_SECONDS / 60} minutes (this one is ${Math.round(duration)}s)`);
      return;
    }
    setError(null);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Downscale/re-encode at submit (not preview — preview keeps the instant
      // local blob). Converts multi-MB camera photos to a web-friendly JPEG so
      // they clear server upload limits; passes small files through untouched.
      const upload = imageFile ? await downscaleImage(imageFile) : null;

      const result = await createFeedUpdate(
        {
          content: content.trim(),
          mode,
          image: upload,
          video: videoFile,
          postToBluesky,
        },
        user.token
      );

      // Show success message
      let successMsg = "Update posted!";
      if (result.social_results?.bluesky?.posted) {
        successMsg += " Also posted to Bluesky.";
      }
      setSuccess(successMsg);

      // The post itself succeeded, but if media could not be attached the
      // server tells us why — surface it as a warning (not a full failure).
      let mediaError = null;
      if (result.image_error) {
        mediaError = `Image could not be attached: ${result.image_error}`;
      } else if (result.video_error) {
        mediaError = `Video could not be attached: ${result.video_error}`;
      }
      const hasMediaError = Boolean(mediaError);
      if (hasMediaError) {
        setError(mediaError);
      }

      // Let live feed lists (homepage + hub) prepend this instantly — the
      // poster sees their own update without a refresh, on ANY tier.
      // The create response has raw_content but no rendered `content` key,
      // which the homepage card renders — normalize so the optimistic card
      // isn't body-less (dedupe means a later poll can't repair it).
      if (result.update?.id) {
        window.dispatchEvent(
          new CustomEvent("bbjd:feed-update-created", {
            detail: {
              ...result.update,
              content: result.update.content ?? result.update.raw_content ?? "",
            },
          })
        );
      }

      // Reset form
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setVideoFile(null);
      setVideoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";

      // Auto-close after success — but not when a media warning is showing.
      // The writer needs to actually read that message, so leave the panel
      // open until they dismiss/close it themselves.
      if (!hasMediaError) {
        setTimeout(() => {
          setSuccess(null);
          setIsOpen(false);
        }, 3000);
      }
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
    <div className="relative">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 h-12 px-5 rounded-full shadow-lg text-white font-semibold text-sm whitespace-nowrap transition-all ${
          mode === "feed"
            ? "bg-primary-500 hover:bg-primary-600"
            : "bg-secondary-600 hover:bg-secondary-500"
        }`}
        aria-label={isOpen ? "Close updater" : "Post feed update"}
      >
        {isOpen ? (
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
        <span>{isOpen ? "Close" : "New Feed"}</span>
      </button>

      {/* Expanded Panel — opens above the button so it clears the FAB dock */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
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
              autoFocus
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

            {/* Video Preview */}
            {videoPreview && (
              <div className="relative mb-3 inline-block max-w-full">
                <video
                  src={videoPreview}
                  controls
                  playsInline
                  preload="metadata"
                  className="rounded-lg max-h-40 max-w-full"
                />
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}

            {/* Actions Row */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-3">
                {/* Image Upload */}
                <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500 cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Image</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>

                {/* Video Upload */}
                <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500 cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Video</span>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept={VIDEO_ACCEPT}
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                </label>
              </div>

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
              </div>
            </div>

            {/* Media limits */}
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
              Paste or attach an image (auto-compressed) · video clips MP4/MOV/WebM, up to{" "}
              {VIDEO_MAX_SECONDS / 60} min &amp; {VIDEO_MAX_MB}MB
              {videoFile && postToBluesky && " · video posts on the site; Bluesky gets the text + link"}
            </p>

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
    </div>
  );
}
