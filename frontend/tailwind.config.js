/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#050505',
        'bg':      '#0B0B0B',
        'bg-card': '#0F0F10',
        gold: {
          DEFAULT: '#D4AF37',
          soft:    '#E6C76A',
          deep:    '#A8862B',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft:  '0 14px 40px -12px rgba(0,0,0,0.55)',
        glass: '0 14px 40px -12px rgba(0,0,0,0.55)',
        gold:  '0 8px 24px -8px rgba(212,175,55,0.45)',
      },
      backdropBlur: { xs: '2px' },
      keyframes: {
        'fade-in':   { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up':  { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in':  'fade-in 0.4s ease-out both',
        'slide-up': 'slide-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
