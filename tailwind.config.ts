import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light warm-paper background (#fafaf6 - #f7f6f1 range)
        background: {
          DEFAULT: "#fafaf6",
          warm: "#f7f6f1",
          paper: "#fafaf6",
        },
        paper: {
          DEFAULT: "#fafaf6",
          warm: "#f7f6f1",
          subtle: "#f4f3ec",
        },
        // Ink-neutral primary (#1d1d1b)
        ink: {
          DEFAULT: "#1d1d1b",
          muted: "#4a4b45",
          hover: "#32322f",
          active: "#141412",
        },
        primary: {
          DEFAULT: "#1d1d1b",
          foreground: "#fafaf6",
          hover: "#32322f",
        },
        // Muted-foreground grey (#4a4b45)
        muted: {
          DEFAULT: "#4a4b45",
          foreground: "#4a4b45",
          subtle: "#72736c",
        },
        // Borders
        border: {
          DEFAULT: "rgba(29, 29, 27, 0.12)",
          ink: "#1d1d1b",
          subtle: "rgba(29, 29, 27, 0.08)",
          strong: "rgba(29, 29, 27, 0.22)",
        },
        // Sparing accent colors for tags/badges only
        accent: {
          yellow: {
            DEFAULT: "#ffe14d",
            soft: "#fff7cc",
            border: "#e5c524",
            text: "#6b5400",
          },
          pink: {
            DEFAULT: "#ff9ec4",
            soft: "#ffeaf2",
            border: "#f085af",
            text: "#9e1c4a",
          },
          blue: {
            DEFAULT: "#bfe3ff",
            soft: "#e8f5ff",
            border: "#97cfff",
            text: "#145388",
          },
          red: {
            DEFAULT: "#e0245e",
            soft: "#fde8ef",
            border: "#c91a4f",
            text: "#a51642",
          },
        },
      },
      borderRadius: {
        none: "0",
        button: "2px",
        badge: "2px",
        card: "4px",
        sm: "2px",
        DEFAULT: "2px",
        md: "4px",
        lg: "6px",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        heading: ["var(--font-fraunces)", "Georgia", "serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        glass: "inset 0 1px 0 rgb(255 255 255 / 0.5), 0 2px 10px rgba(29, 29, 27, 0.04)",
        "glass-hover":
          "inset 0 1px 0 rgb(255 255 255 / 0.6), 0 12px 28px -4px rgba(29, 29, 27, 0.08)",
        card: "inset 0 1px 0 rgb(255 255 255 / 0.5)",
      },
      backdropBlur: {
        glass: "22px",
      },
    },
  },
  plugins: [],
};

export default config;
