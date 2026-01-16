"use client";

import { createContext, useContext, useState, useCallback } from "react";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("login"); // 'login' | 'register' | 'forgot-password' | 'link'
  const [redirectPath, setRedirectPath] = useState(null);
  const [googleData, setGoogleData] = useState(null); // Stores Google credential and user info for linking

  const openLogin = useCallback((redirect = null) => {
    setView("login");
    setRedirectPath(redirect);
    setIsOpen(true);
  }, []);

  const openRegister = useCallback((redirect = null) => {
    setView("register");
    setRedirectPath(redirect);
    setIsOpen(true);
  }, []);

  const openForgotPassword = useCallback(() => {
    setView("forgot-password");
    setIsOpen(true);
  }, []);

  const switchToLogin = useCallback(() => {
    setView("login");
  }, []);

  const switchToRegister = useCallback(() => {
    setView("register");
  }, []);

  const switchToForgotPassword = useCallback(() => {
    setView("forgot-password");
  }, []);

  // Open link account view with Google data
  const openLinkAccount = useCallback((data, redirect = null) => {
    setGoogleData(data);
    setView("link");
    setRedirectPath(redirect);
    setIsOpen(true);
  }, []);

  const switchToLinkAccount = useCallback((data) => {
    setGoogleData(data);
    setView("link");
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Reset after animation completes
    setTimeout(() => {
      setView("login");
      setRedirectPath(null);
      setGoogleData(null);
    }, 200);
  }, []);

  const value = {
    isOpen,
    view,
    redirectPath,
    googleData,
    openLogin,
    openRegister,
    openForgotPassword,
    openLinkAccount,
    switchToLogin,
    switchToRegister,
    switchToForgotPassword,
    switchToLinkAccount,
    closeModal,
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}

export default AuthModalContext;
