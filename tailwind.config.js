/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // ✅ enables dark mode via a CSS class
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#3B82F6", // blue accent
          dark: "#2563EB",
        },
      },
    },
  },
  plugins: [],
};
