"use client";

import { useState, useRef, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { submitContactForm } from "@/lib/api/contact";
import { useAuth } from "@/context/AuthContext";

export function ContactForm({ reasons, recaptchaSiteKey }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    message: "",
    website: "", // Honeypot
  });

  // Pre-fill name and email if user is logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.user_display_name || "",
        email: prev.email || user.user_email || "",
      }));
    }
  }, [user]);
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const recaptchaRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    // Validate form
    if (!formData.name.trim()) {
      setErrorMessage("Please enter your name");
      setStatus("error");
      return;
    }

    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      setErrorMessage("Please enter a valid email address");
      setStatus("error");
      return;
    }

    if (!formData.reason) {
      setErrorMessage("Please select a reason for contacting us");
      setStatus("error");
      return;
    }

    if (!formData.message.trim()) {
      setErrorMessage("Please enter your message");
      setStatus("error");
      return;
    }

    if (formData.message.trim().length < 10) {
      setErrorMessage("Please enter a longer message (at least 10 characters)");
      setStatus("error");
      return;
    }

    // Get reCAPTCHA token
    let recaptchaToken = "";
    if (recaptchaSiteKey && recaptchaRef.current) {
      recaptchaToken = recaptchaRef.current.getValue();
      if (!recaptchaToken) {
        setErrorMessage("Please complete the reCAPTCHA");
        setStatus("error");
        return;
      }
    }

    try {
      await submitContactForm({
        ...formData,
        recaptcha_token: recaptchaToken,
      });

      setStatus("success");
      // Reset form
      setFormData({
        name: "",
        email: "",
        reason: "",
        message: "",
        website: "",
      });
      // Reset reCAPTCHA
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
        <div className="text-green-600 dark:text-green-400 mb-2">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-700 dark:text-green-300 mb-2">
          Message Sent!
        </h3>
        <p className="text-green-600 dark:text-green-400 mb-4">
          Thank you for reaching out. We&apos;ll get back to you as soon as possible.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="text-primary-500 hover:text-primary-600 underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {status === "error" && errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-colors"
          placeholder="Your name"
          disabled={status === "submitting"}
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-colors"
          placeholder="your@email.com"
          disabled={status === "submitting"}
        />
      </div>

      {/* Reason Dropdown */}
      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Reason for Contact <span className="text-red-500">*</span>
        </label>
        <select
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-colors"
          disabled={status === "submitting"}
        >
          <option value="">Select a reason...</option>
          {reasons.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-colors resize-y min-h-[120px]"
          placeholder="How can we help you?"
          disabled={status === "submitting"}
        />
      </div>

      {/* Honeypot - hidden from users */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* reCAPTCHA */}
      {recaptchaSiteKey && (
        <div className="flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={recaptchaSiteKey}
            theme="light"
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full py-3 px-6 bg-primary-500 hover:bg-primary-600
          text-white font-semibold rounded-lg
          focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors flex items-center justify-center gap-2"
      >
        {status === "submitting" ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Sending...
          </>
        ) : (
          "Send Message"
        )}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        By submitting this form, you agree to our{" "}
        <a href="/privacy-policy" className="text-primary-500 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
