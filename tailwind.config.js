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
        sans: ["Roboto", "sans-serif"],
        osw: ["Oswald", "sans-serif"],
        display: ["Yanone Kaffeesatz", "sans-serif"],
        mainHead: ["Yanone Kaffeesatz", "sans-serif"],
        hand: ["Caveat", "cursive"],
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
