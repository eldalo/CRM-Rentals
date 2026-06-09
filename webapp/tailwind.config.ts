import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Color de marca (azul navy). Cambiar de variante = editar aquí.
        // Uso en código: brand-600 = primario, brand-700 = hover,
        // brand-500 = acento, brand-50/100 = tintes/focus.
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1e40af', // primario (navy)
          700: '#1e3a8a', // hover
          800: '#172554',
          900: '#0f1b40',
        },
      },
    },
  },
  plugins: [animate],
};
export default config;
