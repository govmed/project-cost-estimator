import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        'muted-fg': 'rgb(var(--color-muted-fg) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-fg': 'rgb(var(--color-accent-fg) / <alpha-value>)',
        'status-good': 'rgb(var(--color-status-good) / <alpha-value>)',
        'status-warn': 'rgb(var(--color-status-warn) / <alpha-value>)',
        'status-bad': 'rgb(var(--color-status-bad) / <alpha-value>)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      fontSize: {
        kpi: ['2.25rem', { lineHeight: '2.5rem', fontWeight: '600' }],
        'kpi-sm': ['1.5rem', { lineHeight: '1.75rem', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
};

export default config;
