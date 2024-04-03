import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans Variable", "sans-serif"],
      },
      animation: {
        dance: "dance 1s infinite",
      },
      keyframes: {
        dance: {
          "0%, 50%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.1) rotate(10deg)" },
          "75%": { transform: "scale(1.2) rotate(-10deg)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
