import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        slatecard: "#F7F8FA",
        route: "#2563EB",
        mint: "#16A34A",
      },
      boxShadow: {
        soft: "0 18px 40px rgba(23, 32, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
