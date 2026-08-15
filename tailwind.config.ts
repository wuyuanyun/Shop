import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4AA112",
          dark: "#3C8A0E",
          light: "#6BBE33",
        },
        mint: "#E7F0D6",
        accent: "#D4B01D",
        ink: "#1C1A1B",
        muted: "#8C8C8C",
        line: "#E8E8E8",
        danger: "#D9534F",
      },
      fontFamily: {
        sans: [
          "Inter",
          "PingFang SC",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1rem",
        xl3: "1.25rem",
        xl4: "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 20px rgba(28,26,27,0.06)",
        card: "0 4px 24px rgba(74,161,18,0.08)",
        hover: "0 12px 32px rgba(74,161,18,0.12)",
        nav: "0 -4px 20px rgba(28,26,27,0.06)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
