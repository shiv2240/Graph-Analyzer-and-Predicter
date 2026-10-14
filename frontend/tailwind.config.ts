/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Financial terminal dark theme
        surface: {
          DEFAULT: "#0d1117",
          1: "#161b22",
          2: "#21262d",
          3: "#2d333b",
          elevated: "#21262d",
        },
        "surface-elevated": "#21262d",
        brand: {
          DEFAULT: "#4493f8",
          hover: "#58a6ff",
          subtle: "#1f3558",
          dark: "#1f6feb",
          light: "#79c0ff",
        },
        positive: {
          DEFAULT: "#3fb950",
          subtle: "#12261e",
          muted: "#236330",
        },
        negative: {
          DEFAULT: "#f85149",
          subtle: "#2c1517",
          muted: "#8e1519",
        },
        border: {
          DEFAULT: "#30363d",
          subtle: "#21262d",
        },
        text: {
          primary: "#e6edf3",
          secondary: "#7d8590",
          muted: "#8b949e",
          link: "#4493f8",
        },
        accent: {
          blue: "#4493f8",
          "blue-subtle": "#1f3558",
          purple: "#a371f7",
          "purple-subtle": "#2e1d5a",
          teal: "#2dd4bf",
        },
        market: {
          up: "#3fb950",
          "up-subtle": "#12261e",
          "up-muted": "#236330",
          down: "#f85149",
          "down-subtle": "#2c1517",
          "down-muted": "#8e1519",
          neutral: "#7d8590",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-green": "pulseGreen 2s ease-in-out infinite",
        "pulse-red": "pulseRed 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGreen: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(63, 185, 80, 0)" },
          "50%": { boxShadow: "0 0 0 4px rgba(63, 185, 80, 0.2)" },
        },
        pulseRed: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(248, 81, 73, 0)" },
          "50%": { boxShadow: "0 0 0 4px rgba(248, 81, 73, 0.2)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
