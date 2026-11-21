import type { Config } from 'tailwindcss';
const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), panel: v('panel'), panel2: v('panel2'), line: v('line'),
        ink: v('ink'), muted: v('muted'),
        gold: { DEFAULT: '#D4A52C', light: '#F2CF63', dark: '#A87C14' },
        navy: { DEFAULT: '#0B2A5B', light: '#1E5BB0', dark: '#071B3D' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'Noto Nastaliq Urdu', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
