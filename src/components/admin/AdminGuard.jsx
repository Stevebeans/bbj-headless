"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Guard component for admin-only pages
 * Redirects non-admin users and shows loading state during auth check
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Content to render for authorized users
 * @param {string} props.redirectTo - Where to redirect unauthorized users (default: "/")
 * @param {string[]} props.allowedRoles - Roles that can access (default: ["administrator"])
 * @param {React.ReactNode} props.fallback - Optional fallback during loading
 */
export function AdminGuard({
  children,
  redirectTo = "/",
  allowedRoles = ["administrator"],
  fallback,
}) {
  const { user, loading, isAuthenticated, hasAnyRole } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (!hasAnyRole(allowedRoles)) {
      router.replace(redirectTo);
      return;
    }

    setIsAuthorized(true);
  }, [loading, isAuthenticated, hasAnyRole, allowedRoles, router, redirectTo]);

  // Show loading state
  if (loading || !isAuthorized) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )
    );
  }

  return children;
}

export default AdminGuard;
