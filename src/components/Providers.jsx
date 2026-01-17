"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { AuthModal } from "@/components/auth";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";

// Component that runs the heartbeat hook (must be inside AuthProvider)
function SessionHeartbeat({ children }) {
  useSessionHeartbeat();
  return children;
}

export function Providers({ children }) {
  return (
    <AuthProvider>
      <SessionHeartbeat>
        <AuthModalProvider>
          {children}
          <AuthModal />
        </AuthModalProvider>
      </SessionHeartbeat>
    </AuthProvider>
  );
}
