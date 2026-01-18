// components/ProtectedRoute.js

import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import AuthContext from "../utils/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  return user ? children : null;
};

export default ProtectedRoute;
