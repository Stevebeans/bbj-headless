/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use the next/font CSS variables (not raw family names) so the
        // metric-matched fallback Next generates is actually applied. This is
        // what cancels the font-swap layout shift (CLS). Each var resolves to
        // e.g. "'Yanone Kaffeesatz', 'Yanone Kaffeesatz Fallback'".
        sans: ["var(--font-roboto)", "sans-serif"],
        osw: ["var(--font-oswald)", "sans-serif"],
        display: ["var(--font-yanone)", "sans-serif"],
        mainHead: ["var(--font-yanone)", "sans-serif"],
        hand: ["var(--font-caveat)", "cursive"],
      },
      colors: {
        primary: {
          400: "#4D6D88",
          500: "#35546e",
          600: "#2D4B65",
        },
        secondary: {
          400: "#ffd970",
          500: "#FFBF0F",
          600: "#FA910A",
        },
        accent: {
          red: "#E55C41",
        },
        paper: "#F0E8D5",
        "paper-2": "#E8E0CC",
        primary500: "#35546e",
        primarySoft: "#4D6D88",
        primaryHard: "#2D4B65",
        second500: "#FFBF0F",
        secondSoft: "#ffd970",
        secondHard: "#FA910A",
        thirdColor: "#E55C41",
      },
      boxShadow: {
        deep: "0 3px 6px rgba(53, 84, 110, 0.5)",
        deepHover: "0 3px 6px rgba(53, 84, 110, 0.8)",
        frontBox: "0 4px 4px rgba(0,0,0, 0.30)",
      },
      dropShadow: {
        "ca-text": "0 1px 1px rgba(0,0,0, 0.7)",
      },
      scale: {
        md: "1.07",
        lg: "1.15",
      },
      typography: {
        DEFAULT: {
          css: {
            ul: { listStyleType: "disc", paddingLeft: "1.5em" },
            ol: { listStyleType: "decimal", paddingLeft: "1.5em" },
            "li::marker": { color: "#ef4444" },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
