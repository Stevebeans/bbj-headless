"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { register, checkUsername, checkEmail } from "@/lib/api/auth";

export default function RegisterView() {
  const router = useRouter();
  const { loginWithGoogle, setUserFromResponse, isAuthenticated, loading: authLoading } = useAuth();
  const { closeModal, switchToLogin, redirectPath } = useAuthModal();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    subscribeNewsletter: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      closeModal();
      if (redirectPath) {
        router.push(redirectPath);
      }
    }
  }, [isAuthenticated, authLoading, closeModal, redirectPath, router]);

  // Initialize Google Sign-In
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || typeof window === "undefined") return;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signup-btn"),
          {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signup_with",
          }
        );
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      // Check if script already exists to prevent duplicates
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener("load", initGoogle);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    if (!response.credential) return;

    setGoogleLoading(true);
    setError(null);

    try {
      const result = await loginWithGoogle(response.credential);
      if (!result.success) {
        setError(result.error || "Google sign-up failed");
      }
    } catch (err) {
      setError(err.message || "Google sign-up failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Debounced username validation
  const validateUsername = useCallback(async (username) => {
    if (!username || username.length < 3) return;

    try {
      const result = await checkUsername(username);
      if (!result.valid) {
        setFieldErrors((prev) => ({ ...prev, username: result.message }));
      } else {
        setFieldErrors((prev) => ({ ...prev, username: null }));
      }
    } catch {
      // Ignore errors for now
    }
  }, []);

  // Debounced email validation
  const validateEmail = useCallback(async (email) => {
    if (!email || !email.includes("@")) return;

    try {
      const result = await checkEmail(email);
      if (result.exists) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "An account with this email already exists.",
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, email: null }));
      }
    } catch {
      // Ignore errors for now
    }
  }, []);

  // Debounce effect for username
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username.length >= 3) {
        validateUsername(formData.username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username, validateUsername]);

  // Debounce effect for email
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email.includes("@")) {
        validateEmail(formData.email);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.email, validateEmail]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Username validation
    if (!formData.username) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-z0-9]+$/.test(formData.username)) {
      errors.username = "Username can only contain lowercase letters and numbers";
    }

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    // Confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        username: formData.username.toLowerCase(),
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        subscribeNewsletter: formData.subscribeNewsletter,
      });

      if (result.success) {
        // Update auth state
        if (result.token && result.user) {
          setUserFromResponse(result);
        }

        setSuccess(true);

        // Close modal after showing success
        setTimeout(() => {
          closeModal();
          if (redirectPath) {
            router.push(redirectPath);
          }
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Registration failed");
      if (err.field) {
        setFieldErrors((prev) => ({ ...prev, [err.field]: err.message }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
          Account Created!
        </h3>
        <p className="text-slate-600 dark:text-slate-300">
          Please check your email to verify your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Google Sign-Up Button */}
      <div>
        <div
          id="google-signup-btn"
          className="w-full flex justify-center"
        />
        {googleLoading && (
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
            Signing up with Google...
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">or</span>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label
            htmlFor="register-username"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Username <span className="text-red-500">*</span>
          </label>
          <input
            id="register-username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
            autoComplete="username"
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              fieldErrors.username
                ? "border-red-500"
                : "border-slate-300 dark:border-slate-600"
            }`}
            placeholder="lowercase letters and numbers only"
          />
          {fieldErrors.username && (
            <p className="mt-1 text-sm text-red-500">{fieldErrors.username}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="register-email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              fieldErrors.email
                ? "border-red-500"
                : "border-slate-300 dark:border-slate-600"
            }`}
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="register-password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              fieldErrors.password
                ? "border-red-500"
                : "border-slate-300 dark:border-slate-600"
            }`}
            placeholder="At least 8 characters"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="register-confirm-password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              fieldErrors.confirmPassword
                ? "border-red-500"
                : "border-slate-300 dark:border-slate-600"
            }`}
            placeholder="Re-enter your password"
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Display Name (optional) */}
        <div>
          <label
            htmlFor="register-display-name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Display Name <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="register-display-name"
            name="displayName"
            type="text"
            value={formData.displayName}
            onChange={handleChange}
            autoComplete="name"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="How you want to be known"
          />
        </div>

        {/* Newsletter Subscription */}
        <div className="flex items-start gap-2">
          <input
            id="register-newsletter"
            name="subscribeNewsletter"
            type="checkbox"
            checked={formData.subscribeNewsletter}
            onChange={handleChange}
            className="mt-1 text-primary-500 focus:ring-primary-500 rounded"
          />
          <label
            htmlFor="register-newsletter"
            className="text-sm text-slate-600 dark:text-slate-400"
          >
            Subscribe to our daily digest for Big Brother news and updates
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      {/* Login Link */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        <p>
          Already have an account?{" "}
          <button
            onClick={switchToLogin}
            className="text-primary-500 hover:underline font-medium"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
