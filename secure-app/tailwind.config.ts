import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: { cyan: '#37b6ff', purple: '#8a5cff' },
      },
      boxShadow: {
        neon: '0 0 18px rgba(70,170,255,.55), 0 0 34px rgba(140,90,255,.35)',
        'neon-soft': '0 0 16px rgba(80,160,255,.45)',
        avatar: '0 0 25px rgba(80,180,255,.6), 0 0 60px rgba(150,80,255,.45), inset 0 0 25px rgba(120,200,255,.3)',
      },
    },
  },
  plugins: [],
};
export default config;
