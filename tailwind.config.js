/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        garden: {
          cream: "#f7f3ea",
          paper: "#fffdf7",
          sage: "#8ea889",
          leaf: "#557860",
          pine: "#173f32",
          moss: "#dfe8d7",
          clay: "#c59b6d",
          amber: "#e4bb5e",
          rose: "#d9776f"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 63, 50, 0.11)",
        card: "0 10px 30px rgba(23, 63, 50, 0.08)"
      }
    },
  },
  plugins: [],
};
