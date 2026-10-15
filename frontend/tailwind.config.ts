/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // True pitch-black obsidian terminal & glassmorphism system
        surface: {
          DEFAULT: "#000000",
          1: "#070709",
          2: "#0f0f12",
          3: "#17171c",
          elevated: "#111115",
          glass: "rgba(18, 18, 22, 0.65)",
        },
        "surface-elevated": "#111115",
        brand: {
          DEFAULT: "#D4F938",
          hover: "#e2ff58",
          subtle: "rgba(212, 249, 56, 0.12)",
          dark: "#a6cc18",
          light: "#eaff85",
        },
        positive: {
          DEFAULT: "#10b981",
          subtle: "rgba(16, 185, 129, 0.12)",
          muted: "#059669",
        },
        negative: {
          DEFAULT: "#ef4444",
          subtle: "rgba(239, 68, 68, 0.12)",
          muted: "#dc2626",
        },
        border: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          subtle: "rgba(255, 255, 255, 0.04)",
          glow: "rgba(212, 249, 56, 0.35)",
        },
        text: {
          primary: "#f4f4f5",
          secondary: "#a1a1aa",
          muted: "#71717a",
          link: "#D4F938",
        },
        accent: {
          blue: "#3b82f6",
          "blue-subtle": "rgba(59, 130, 246, 0.12)",
          purple: "#8b5cf6",
          "purple-subtle": "rgba(139, 92, 246, 0.12)",
          teal: "#14b8a6",
          lime: "#D4F938",
        },
        market: {
          up: "#10b981",
          "up-subtle": "rgba(16, 185, 129, 0.12)",
          "up-muted": "#059669",
          down: "#ef4444",
          "down-subtle": "rgba(239, 68, 68, 0.12)",
          "down-muted": "#dc2626",
          neutral: "#a1a1aa",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
        "glass-hover": "0 12px 40px 0 rgba(0, 0, 0, 0.7), 0 0 20px 0 rgba(212, 249, 56, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)",
        "neon-lime": "0 0 25px rgba(212, 249, 56, 0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-green": "pulseGreen 2s ease-in-out infinite",
        "pulse-red": "pulseRed 2s ease-in-out infinite",
        shimmer: "shimmer 1.8s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGreen: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" },
          "50%": { boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.25)" },
        },
        pulseRed: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)" },
          "50%": { boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.25)" },
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
