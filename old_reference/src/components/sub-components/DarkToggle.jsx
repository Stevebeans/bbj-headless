"use client";

import React, { useState, useEffect } from "react";
import { FaMoon } from "react-icons/fa6";

const DarkToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage for dark mode preference
    const storedMode = localStorage.getItem("darkMode");
    if (storedMode === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem("darkMode", newMode);
      if (newMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newMode;
    });
  };

  return (
    <div className="items-center hidden sm:flex">
      <button onClick={toggleDarkMode} aria-label="Toggle Dark Mode" className="dark:text-white">
        <FaMoon />
      </button>
    </div>
  );
};

export default DarkToggle;
