/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#050505',
        'bg':      '#0B0B0B',
        gold: { DEFAULT: '#D4AF37', soft: '#E6C76A' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        glass: '0 10px 40px -10px rgba(0,0,0,0.5)',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
