/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic color tokens using CSS variables
        surface: {
          DEFAULT: 'hsl(var(--bg-surface) / <alpha-value>)',
          secondary: 'hsl(var(--bg-surface-secondary) / <alpha-value>)',
          tertiary: 'hsl(var(--bg-surface-tertiary) / <alpha-value>)',
          inverse: 'hsl(var(--bg-inverse) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--bg-sidebar) / <alpha-value>)',
        },
        app: {
          DEFAULT: 'hsl(var(--bg-app) / <alpha-value>)',
        },
        content: {
          primary: 'hsl(var(--text-primary) / <alpha-value>)',
          secondary: 'hsl(var(--text-secondary) / <alpha-value>)',
          tertiary: 'hsl(var(--text-tertiary) / <alpha-value>)',
          inverse: 'hsl(var(--text-inverse) / <alpha-value>)',
          link: 'hsl(var(--text-link) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'hsl(var(--border-primary) / <alpha-value>)',
          secondary: 'hsl(var(--border-secondary) / <alpha-value>)',
          focus: 'hsl(var(--border-focus) / <alpha-value>)',
        },
        interactive: {
          primary: 'hsl(var(--interactive-primary) / <alpha-value>)',
          'primary-hover': 'hsl(var(--interactive-primary-hover) / <alpha-value>)',
          secondary: 'hsl(var(--interactive-secondary) / <alpha-value>)',
          'secondary-hover': 'hsl(var(--interactive-secondary-hover) / <alpha-value>)',
        },
        status: {
          'success-bg': 'hsl(var(--status-success-bg) / <alpha-value>)',
          'success-text': 'hsl(var(--status-success-text) / <alpha-value>)',
          'success-border': 'hsl(var(--status-success-border) / <alpha-value>)',
          'warning-bg': 'hsl(var(--status-warning-bg) / <alpha-value>)',
          'warning-text': 'hsl(var(--status-warning-text) / <alpha-value>)',
          'warning-border': 'hsl(var(--status-warning-border) / <alpha-value>)',
          'error-bg': 'hsl(var(--status-error-bg) / <alpha-value>)',
          'error-text': 'hsl(var(--status-error-text) / <alpha-value>)',
          'error-border': 'hsl(var(--status-error-border) / <alpha-value>)',
          'info-bg': 'hsl(var(--status-info-bg) / <alpha-value>)',
          'info-text': 'hsl(var(--status-info-text) / <alpha-value>)',
          'info-border': 'hsl(var(--status-info-border) / <alpha-value>)',
        },
        // Neutral palette
        neutral: {
          25: 'hsl(var(--color-neutral-25) / <alpha-value>)',
          50: 'hsl(var(--color-neutral-50) / <alpha-value>)',
          100: 'hsl(var(--color-neutral-100) / <alpha-value>)',
          200: 'hsl(var(--color-neutral-200) / <alpha-value>)',
          300: 'hsl(var(--color-neutral-300) / <alpha-value>)',
          400: 'hsl(var(--color-neutral-400) / <alpha-value>)',
          500: 'hsl(var(--color-neutral-500) / <alpha-value>)',
          600: 'hsl(var(--color-neutral-600) / <alpha-value>)',
          700: 'hsl(var(--color-neutral-700) / <alpha-value>)',
          800: 'hsl(var(--color-neutral-800) / <alpha-value>)',
          900: 'hsl(var(--color-neutral-900) / <alpha-value>)',
          950: 'hsl(var(--color-neutral-950) / <alpha-value>)',
        },
        // Accent
        accent: {
          50: 'hsl(var(--color-accent-50) / <alpha-value>)',
          100: 'hsl(var(--color-accent-100) / <alpha-value>)',
          200: 'hsl(var(--color-accent-200) / <alpha-value>)',
          300: 'hsl(var(--color-accent-300) / <alpha-value>)',
          400: 'hsl(var(--color-accent-400) / <alpha-value>)',
          500: 'hsl(var(--color-accent-500) / <alpha-value>)',
          600: 'hsl(var(--color-accent-600) / <alpha-value>)',
          700: 'hsl(var(--color-accent-700) / <alpha-value>)',
          800: 'hsl(var(--color-accent-800) / <alpha-value>)',
          900: 'hsl(var(--color-accent-900) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        xs: ['var(--text-xs)', { lineHeight: 'var(--leading-tight)' }],
        sm: ['var(--text-sm)', { lineHeight: 'var(--leading-snug)' }],
        base: ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        lg: ['var(--text-lg)', { lineHeight: 'var(--leading-normal)' }],
        xl: ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed)',
        topbar: 'var(--topbar-height)',
      },
      maxWidth: {
        content: 'var(--content-max-width)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        ring: 'var(--shadow-ring)',
      },
      transitionDuration: {
        fast: '100ms',
        base: '150ms',
        slow: '250ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'skeleton-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease',
        'slide-up': 'slide-up 200ms ease',
        'skeleton': 'skeleton-pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
