/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0a0a0f",
          card: "#12121a",
          accent: "#ff006e",
        },
      },
    },
  },
  plugins: [],
};