import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#FFF4EC", 100: "#FFE5D1", 200: "#FFC9A3", 300: "#FFA66B", 400: "#FF8638", 500: "#F26B1D", 600: "#D85510", 700: "#B3420E" },
        ink: { 50: "#F6F5F4", 100: "#ECEAE8", 200: "#D9D6D3", 300: "#B8B4B0", 400: "#8E8A86", 500: "#6B6762", 600: "#4A4743", 700: "#33312E", 800: "#252321", 900: "#181716" },
      },
      fontFamily: { sans: ["var(--font-jakarta)", "system-ui", "sans-serif"] },
      boxShadow: { soft: "0 1px 2px rgba(37,35,33,.04), 0 8px 24px -12px rgba(37,35,33,.12)" },
    },
  },
  plugins: [],
} satisfies Config;
