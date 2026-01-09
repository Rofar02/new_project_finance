/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8E44FD',
          50: '#F5EDFF',
          100: '#E8D5FF',
          200: '#D4B3FF',
          300: '#B880FF',
          400: '#9C4DFF',
          500: '#8E44FD',
          600: '#7A2EE8',
          700: '#6620D4',
          800: '#5217B8',
          900: '#3E0F9C',
        },
        ios: {
          dark: '#000000',
          'dark-secondary': '#1C1C1E',
          'dark-tertiary': '#2C2C2E',
          'dark-quaternary': '#3A3A3C',
          text: '#FFFFFF',
          'text-secondary': '#EBEBF5',
          'text-tertiary': '#EBEBF599',
        }
      },
      backdropBlur: {
        ios: '20px',
      },
      borderRadius: {
        ios: '14px',
        'ios-lg': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}








