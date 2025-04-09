import type { Config } from "tailwindcss";

const config = {
  content: ["./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3b82f6", // blue-500
          dark: "#2563eb",    // blue-600
          light: "#60a5fa",   // blue-400
        }
      }
    },
  },
  plugins: [],
} satisfies Config;

export default config;
