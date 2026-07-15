import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  /**
   * CRM utilities are scoped under `#__next` (see `src/app/RootLayout.tsx` on `<html>`).
   */
  content: ['./src/**/*.{js,ts,jsx,tsx,css}'],
  corePlugins: {
    preflight: false
  },
  important: '#__next',
  plugins: [require('tailwindcss-logical'), require('./src/@core/tailwind/plugin')],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        display: ["28px", { lineHeight: "36px", fontWeight: "600" }],
        h1:      ["20px", { lineHeight: "28px", fontWeight: "600" }],
        h2:      ["16px", { lineHeight: "24px", fontWeight: "600" }],
        label:   ["14px", { lineHeight: "20px", fontWeight: "500" }],
        body:    ["14px", { lineHeight: "20px", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "kpi-primary": ["32px", { lineHeight: "36px", fontWeight: "700" }],
        "kpi-label":   ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "kpi-trend":   ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "nav-item":        ["16px", { lineHeight: "22px", fontWeight: "500" }],
        "nav-group-label": ["12px", { lineHeight: "16px", fontWeight: "600", letterSpacing: "0.04em" }],
        "table-header":         ["13px", { lineHeight: "18px", fontWeight: "600" }],
        "table-cell":           ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "table-cell-secondary": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "form-section-title": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "field-label":        ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "input-text":         ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "helper-text":        ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "error-message":      ["12px", { lineHeight: "16px", fontWeight: "500" }],
        button:      ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "button-sm": ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "card-title":    ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "card-content":  ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "card-metadata": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "badge-text": ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      colors: {
        brand: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          900: "#1E3A5F",
        },
        border: {
          light: "#E3ECFC",
          DEFAULT: "#E5E7EB",
        },
        surface: {
          light: "#EFF6FF",
          DEFAULT: "#f9fbff",
        },
      },
      spacing: {
        "sidebar-expanded": "260px",
        "sidebar-collapsed": "80px",
      },
      animation: {
        "fade-in":  "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "collapse": "collapse 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" },                                "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        collapse: { "0%": { width: "240px" },                             "100%": { width: "80px" } },
      },
    }
  }
}

export default config
