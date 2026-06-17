/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0891B2",
          light: "#22D3EE",
          dark: "#0E7490",
        },
        accent: {
          DEFAULT: "#059669",
          light: "#10B981",
          dark: "#047857",
        },
        ink: "#164E63",
        cloud: "#ECFEFF",
        muted: "#E8F1F6",
        line: "#A5F3FC",
        whatsapp: "#25D366",
      },
      fontFamily: {
        heading: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        body: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(8, 145, 178, 0.18)",
        card: "0 20px 60px -20px rgba(22, 78, 99, 0.22)",
        glow: "0 0 0 1px rgba(165, 243, 252, 0.6), 0 24px 70px -24px rgba(8, 145, 178, 0.45)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        typing: {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        "fade-up": "fade-up 0.7s ease-out both",
        "pulse-ring": "pulse-ring 2.2s ease-out infinite",
        typing: "typing 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
