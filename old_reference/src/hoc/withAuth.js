// src/hoc/withAuth.js

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

const withAuth = WrappedComponent => {
  const ComponentWithAuth = props => {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!user) {
        router.push("/bbjlogin"); // Redirect to login page if not authenticated
      }
    }, [user]);

    if (!user) {
      return null; // Optionally, show a loading spinner or message
    }

    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging purposes
  if (process.env.NODE_ENV !== "production") {
    const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || "Component";
    ComponentWithAuth.displayName = `withAuth(${wrappedComponentName})`;
  }

  return ComponentWithAuth;
};

export default withAuth;
