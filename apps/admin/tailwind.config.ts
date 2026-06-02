import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1D9E75',
        'primary-dark': '#0F6E56',
        'primary-light': '#E1F5EE',
      },
    },
  },
  plugins: [],
};

export default config;
