import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

const config: Config = {
  content: [
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      colors: {
        // Existing colors
        customBlue: "#1494F2",
        "slate-50": "#F8FAFB",
        darkBlue: "#0089ED",

        // Aanzara colors
        blue: "#2563EB",
        "blue-deep": "#1D4ED8",

        navy: "#0B1E4B",
        "ink-soft": "#64748B",

        green: "#16A34A",
      },

      borderRadius: {
        card: "12px",
      },

      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },

      backgroundImage: {
        "gradient-primary":
          "linear-gradient(to top, #0089ED, #A0DAFB)",

        "gradient-radial":
          "radial-gradient(var(--tw-gradient-stops))",

        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },

  plugins: [
    nextui({
      themes: {
        dark: {
          layout: {},
          colors: {},
        },
        light: {
          layout: {},
          colors: {},
        },
      },
    }),
  ],
};

export default config;