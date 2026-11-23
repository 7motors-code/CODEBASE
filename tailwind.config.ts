import type { Config } from 'tailwindcss';

// Every surface/text colour comes from CSS variables in globals.css so the
// whole app shares one neutral ramp. Light theme only.
const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        panel: v('panel'),
        panel2: v('panel2'),
        line: v('line'),
        ink: v('ink'),
        ink2: v('ink2'),
        muted: v('muted'),
        // Brand: navy carries every primary action; gold is reserved for the
        // logo and the number-plate signature, never for text on white.
        navy: { DEFAULT: '#0B2A5B', light: '#1E4A8F', dark: '#071B3D', soft: '#E8EDF5' },
        gold: { DEFAULT: '#D4A52C', light: '#F2CF63', dark: '#A87C14', ink: '#7A5A0E', soft: '#FBF4E0' },
        ok: { DEFAULT: '#15803D', soft: '#EAF6EE' },
        bad: { DEFAULT: '#C2362F', soft: '#FBECEB' },
        warn: { DEFAULT: '#A16207', soft: '#FDF5E3' },
        info: { DEFAULT: '#1D5FA8', soft: '#EAF1FA' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        urdu: ['var(--font-urdu)', 'Jameel Noori Nastaleeq', 'serif'],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(16, 24, 40, 0.05)',
        float: '0 8px 24px rgba(16, 24, 40, 0.08)',
        modal: '0 24px 48px -12px rgba(16, 24, 40, 0.18)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
} satisfies Config;
