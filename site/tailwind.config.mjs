/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      gridTemplateColumns: {
        "14": "repeat(14, minmax(0, 1fr))",
        "24": "repeat(24, minmax(0, 1fr))",
      },
      fontFamily: {
        sans: [
          "Geist",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Newsreader",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d8eaff",
          200: "#b8dafe",
          300: "#85c0fd",
          400: "#4a9efa",
          500: "#1e7ef0",
          600: "#0f63d4",
          700: "#0c4faa",
          800: "#0e438a",
          900: "#103a72",
        },
        ink: {
          50: "#f6f8fb",
          100: "#eceff5",
          200: "#d6dce6",
          300: "#b4bdcc",
          400: "#7e8aa1",
          500: "#5b6680",
          600: "#404b66",
          700: "#2f3850",
          800: "#1d2334",
          900: "#0f1320",
        },
      },
      keyframes: {
        pulseLine: {
          "0%, 100%": { opacity: 0.3 },
          "50%": { opacity: 1 },
        },
        carrier: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        tickFade: {
          "0%, 100%": { opacity: 0.15 },
          "50%": { opacity: 0.55 },
        },
        sweep: {
          "0%": { transform: "translateX(-30%)" },
          "100%": { transform: "translateX(130%)" },
        },
      },
      animation: {
        pulseLine: "pulseLine 1.8s ease-in-out infinite",
        carrier: "carrier 2.4s linear infinite",
        tickFade: "tickFade 2.6s ease-in-out infinite",
        sweep: "sweep 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
