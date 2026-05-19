/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/data/**/*.{js,jsx}",
    "./src/utils/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f6f7f9",
        ink: "#1f2937",
        muted: "#6b7280",
        coffee: "#7c4a2d",
        cream: "#fff8ed"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};
