import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        qbase: '#09090b',
        qviolet: '#a78bfa',
        qemerald: '#10b981',
        qamber: '#f59e0b',
        qrose: '#f87171',
        qsurface: 'rgba(255, 255, 255, 0.03)',
        qborder: 'rgba(255, 255, 255, 0.08)'
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      }
    },
  },
  plugins: [],
};
export default config;