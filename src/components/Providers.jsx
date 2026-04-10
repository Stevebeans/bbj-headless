"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { AdProvider } from "@/context/AdContext";
import { AuthModal } from "@/components/auth";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";

// Component that runs the heartbeat hook (must be inside AuthProvider)
function SessionHeartbeat({ children }) {
  useSessionHeartbeat();
  return children;
}

export function Providers({
  children,
  initialShouldShowAds = true,
  supporterRoles = [],
  disabledPlacements = [],
  pwaSuppressed = [],
}) {
  return (
    <AuthProvider>
      <SessionHeartbeat>
        <AuthModalProvider>
          <AdProvider
            initialShouldShowAds={initialShouldShowAds}
            supporterRoles={supporterRoles}
            disabledPlacements={disabledPlacements}
            pwaSuppressed={pwaSuppressed}
          >
            {children}
            <AuthModal />
          </AdProvider>
        </AuthModalProvider>
      </SessionHeartbeat>
    </AuthProvider>
  );
}
