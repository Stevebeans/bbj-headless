"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { AuthModal } from "@/components/auth";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <AuthModalProvider>
        {children}
        <AuthModal />
      </AuthModalProvider>
    </AuthProvider>
  );
}
