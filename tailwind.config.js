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
        hand: ["Caveat", "cursive"],
      },
      colors: {
        // Primary - Blue
        primary: {
          400: "#4D6D88", // soft
          500: "#35546e", // main
          600: "#2D4B65", // hard
        },
        // Secondary - Yellow/Orange
        secondary: {
          400: "#ffd970", // soft
          500: "#FFBF0F", // main
          600: "#FA910A", // hard/orange
        },
        // Accent
        accent: {
          red: "#E55C41",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
