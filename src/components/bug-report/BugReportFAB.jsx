"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { submitBugReport, uploadBugScreenshot } from "@/lib/api/bug-reports";

const BUG_TYPES = [
  { value: "ui_visual", label: "UI / Visual" },
  { value: "functionality", label: "Functionality" },
  { value: "performance", label: "Performance" },
  { value: "content", label: "Content" },
  { value: "other", label: "Other" },
];

const SEVERITIES = [
  { value: "critical", label: "Critical", color: "bg-red-500" },
  { value: "major", label: "Major", color: "bg-orange-500" },
  { value: "minor", label: "Minor", color: "bg-yellow-500" },
  { value: "cosmetic", label: "Cosmetic", color: "bg-blue-500" },
];

const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5MB

const INPUT_CLASSES =
  "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none";
const TEXTAREA_CLASSES = `${INPUT_CLASSES} resize-none`;

// Capture last N console errors
const consoleErrors = [];
const MAX_CONSOLE_ERRORS = 10;

if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = function (...args) {
    consoleErrors.push({
      message: args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "),
      timestamp: new Date().toISOString(),
    });
    if (consoleErrors.length > MAX_CONSOLE_ERRORS) {
      consoleErrors.shift();
    }
    originalError.apply(console, args);
  };
}

function getBrowserInfo() {
  if (typeof window === "undefined") return {};
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    devicePixelRatio: window.devicePixelRatio,
  };
}

export function BugReportFAB() {
  const { isAuthenticated } = useAuth();
  const isStaging = typeof window !== "undefined" && window.location.hostname === "staging.bigbrotherjunkies.com";
  const canReport = isAuthenticated && isStaging;

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Form state
  const [type, setType] = useState("functionality");
  const [severity, setSeverity] = useState("minor");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [pageUrl, setPageUrl] = useState("");

  // Screenshot state
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);

  // Capture page URL when form opens
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      setPageUrl(window.location.href);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Don't close if clicking the FAB button itself
        const fab = document.getElementById("bug-report-fab");
        if (fab && fab.contains(e.target)) return;
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle clipboard paste for screenshots
  const handlePaste = useCallback((e) => {
    if (!isOpen) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleScreenshotSelect(file);
        break;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  if (!canReport) return null;

  function handleScreenshotSelect(file) {
    if (file.size > MAX_SCREENSHOT_SIZE) {
      setError("Screenshot must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("File must be an image");
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) handleScreenshotSelect(file);
  }

  function removeScreenshot() {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetForm() {
    setType("functionality");
    setSeverity("minor");
    setDescription("");
    setSteps("");
    setExpected("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setShowDetails(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload screenshot first if present
      let screenshotUrl = null;
      if (screenshotFile) {
        const uploadResult = await uploadBugScreenshot(screenshotFile);
        if (uploadResult.success) {
          screenshotUrl = uploadResult.url;
        }
      }

      await submitBugReport({
        type,
        severity,
        description: description.trim(),
        page_url: pageUrl,
        steps_to_reproduce: steps.trim() || null,
        expected_behavior: expected.trim() || null,
        screenshot_url: screenshotUrl,
        browser_info: getBrowserInfo(),
        console_errors: consoleErrors.length > 0 ? [...consoleErrors] : null,
      });

      setSuccess("Bug report submitted! Thank you.");
      resetForm();

      setTimeout(() => {
        setSuccess(null);
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to submit bug report");
    } finally {
      setIsSubmitting(false);
    }
  }

  const browserInfo = typeof window !== "undefined" ? getBrowserInfo() : {};
  const isDisabled = isSubmitting || !description.trim();

  return (
    <>
      {/* FAB Button */}
      <button
        id="bug-report-fab"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-red-500 hover:bg-red-600 transition-all"
        aria-label={isOpen ? "Close bug report" : "Report a bug"}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {/* Expanded Form Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-20 left-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-red-500 text-white">
            <span className="font-semibold text-sm">Report a Bug</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Form */}
          <form onSubmit={handleSubmit} className="p-4 max-h-[70vh] overflow-y-auto space-y-3">
            {/* Messages */}
            {error && (
              <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm">
                {success}
              </div>
            )}

            {/* Bug Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bug Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={INPUT_CLASSES}
              >
                {BUG_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Severity
              </label>
              <div className="flex gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${
                      severity === s.value
                        ? `${s.color} text-white shadow-md`
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page URL (readonly) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page URL
              </label>
              <input
                type="text"
                value={pageUrl}
                readOnly
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400 text-gray-500 font-mono"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What went wrong?"
                className={TEXTAREA_CLASSES}
                rows={3}
                required
              />
            </div>

            {/* Steps to Reproduce (optional) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Steps to Reproduce <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                className={TEXTAREA_CLASSES}
                rows={2}
              />
            </div>

            {/* Expected Behavior (optional) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Behavior <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="What should have happened?"
                className={TEXTAREA_CLASSES}
                rows={2}
              />
            </div>

            {/* Screenshot */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Screenshot <span className="text-gray-400">(paste or select)</span>
              </label>
              {screenshotPreview ? (
                <div className="relative inline-block">
                  <Image
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    width={120}
                    height={80}
                    className="rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-red-400 transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Click to select or Ctrl+V to paste
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Auto-captured info */}
            <div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${showDetails ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Auto-captured info
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">
                  {Object.keys(browserInfo).length} fields
                </span>
              </button>
              {showDetails && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs space-y-1 font-mono">
                  <p><span className="text-gray-500">Platform:</span> {browserInfo.platform}</p>
                  <p><span className="text-gray-500">Viewport:</span> {browserInfo.viewportWidth}x{browserInfo.viewportHeight}</p>
                  <p><span className="text-gray-500">Screen:</span> {browserInfo.screenWidth}x{browserInfo.screenHeight}</p>
                  <p><span className="text-gray-500">Theme:</span> {browserInfo.colorScheme}</p>
                  <p><span className="text-gray-500">DPR:</span> {browserInfo.devicePixelRatio}</p>
                  {consoleErrors.length > 0 && (
                    <p className="text-red-500">{consoleErrors.length} console error(s) captured</p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isDisabled}
              className={`w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-colors ${
                isDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Bug Report"
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
