// src/context/AuthContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import Spinner from "@/components/Spinner";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      const decoded = jwtDecode(token);
      setUser(decoded);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post("https://bigbrotherjunkies.com/wp-json/jwt-auth/v1/token", {
        username,
        password
      });
      const { token } = response.data;

      Cookies.set("token", token, { expires: 30 });
      const decoded = jwtDecode(token); // Use jwt_decode from jwt-decode

      setUser(decoded);
      return response.data;
    } catch (error) {
      console.error("Login error:", error.response ? error.response.data : error.message);
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
  };

  // if (loading) {
  //   return (
  //     <div>
  //       <Spinner />
  //       Loading...TT
  //     </div>
  //   ); // Add a loading indicator or placeholder
  // }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    return {
      user: null,
      login: () => console.error("AuthProvider is not available"),
      logout: () => console.error("AuthProvider is not available")
    };
  }
  return context;
};
