/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf9f7',
          100: '#f5f3ef',
          200: '#e8e4dc',
          300: '#d5cec1',
          400: '#bfb5a3',
          500: '#a99d87',
          600: '#968770',
          700: '#7d705d',
          800: '#675d4f',
          900: '#564e43',
          950: '#2e2923',
        },
        gold: {
          50: '#fbf9f0',
          100: '#f6f0d9',
          200: '#ece0b3',
          300: '#e0ca84',
          400: '#d4b45e',
          500: '#c4a35a',
          600: '#a98340',
          700: '#8c6536',
          800: '#745232',
          900: '#61452c',
          950: '#372415',
        },
        luxury: {
          black: '#1a1a1a',
          charcoal: '#2d2d2d',
          cream: '#faf8f5',
          pearl: '#f5f3ef',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'luxury': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'luxury-lg': '0 10px 40px rgba(0, 0, 0, 0.12)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
