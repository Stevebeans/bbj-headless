"use client";

import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useAuthModal } from "@/context/AuthModalContext";
import LoginView from "./LoginView";
import RegisterView from "./RegisterView";
import ForgotPasswordView from "./ForgotPasswordView";
import LinkAccountView from "./LinkAccountView";

export default function AuthModal() {
  const { isOpen, view, closeModal } = useAuthModal();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const getTitle = () => {
    switch (view) {
      case "register":
        return "Create Account";
      case "forgot-password":
        return "Reset Password";
      case "link":
        return "Link Your Account";
      default:
        return "Log In";
    }
  };

  const renderView = () => {
    switch (view) {
      case "register":
        return <RegisterView />;
      case "forgot-password":
        return <ForgotPasswordView />;
      case "link":
        return <LinkAccountView />;
      default:
        return <LoginView />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-display text-primary-500 dark:text-primary-400">
            {getTitle()}
          </h2>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">{renderView()}</div>
      </div>
    </div>
  );
}
