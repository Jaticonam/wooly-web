import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  /*
   * W12-02: preset de diseño compartido.
   * Cada aplicación (ui/, admin/ui/) declara su propio `content`
   * en su tailwind.config.ts y extiende este preset.
   */
  content: [
    "./ui/src/**/*.{ts,tsx}",
    "./admin/ui/src/**/*.{ts,tsx}",
    "./packages/*/src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        whatsapp: {
          DEFAULT: "hsl(var(--whatsapp))",
          dark: "hsl(var(--whatsapp-dark))",
        },
        dark: "hsl(var(--dark))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "toast-in": {
          "0%": { transform: "translateY(-20px) scale(0.9)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "toast-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.9)", opacity: "0" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.9) translateY(10px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        shine: {
          "0%": { left: "-75%" },
          "100%": { left: "125%" },
        },
        "pulse-aura": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.4)" },
          "70%": { boxShadow: "0 0 0 15px hsl(var(--primary) / 0)" },
          "100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(120%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(120%)", opacity: "0" },
        },
        "pulse-stock": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.04)", opacity: "0.9" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "toast-in": "toast-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "toast-out": "toast-out 0.3s ease-in forwards",
        "pop-in": "pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 3s infinite linear",
        "pulse-aura": "pulse-aura 2s infinite",
        "slide-up": "slide-up 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "slide-down": "slide-down 0.5s ease-in forwards",
        "pulse-stock": "pulse-stock 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
