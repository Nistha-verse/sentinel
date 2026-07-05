/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1C1612",
        foreground: "#F5F2EC",
        card: {
          DEFAULT: "#241B16",
          foreground: "#F5F2EC",
        },
        primary: {
          DEFAULT: "#B88A44",
          foreground: "#F5F2EC",
        },
        secondary: {
          DEFAULT: "#241B16",
          foreground: "#F5F2EC",
        },
        muted: {
          DEFAULT: "#2A211C",
          foreground: "#7A6B5E",
        },
        accent: {
          DEFAULT: "#2A211C",
          foreground: "#F5F2EC",
        },
        border: "#352820",
        ring: "#B88A44",
        success: "#6B7D5F",
        warning: "#C97B4A",
        danger: "#A0523A",
        critical: "#A0523A",
        info: "#8A7A6A",
        "text-secondary": "#A89888",
        hover: "#2A211C",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      fontSize: {
        h1: ["36px", { lineHeight: "1.2", fontWeight: "600" }],
        h2: ["28px", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["15px", { lineHeight: "1.5", fontWeight: "400" }],
        small: ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        label: [
          "13px",
          { lineHeight: "1.4", fontWeight: "600", letterSpacing: "0.05em" },
        ],
      },
      borderRadius: {
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
