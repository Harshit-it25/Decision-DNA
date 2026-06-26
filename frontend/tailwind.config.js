/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        burgundy: {
          DEFAULT: '#5C0A28',
          hover: '#7A0E35',
          light: '#F5E6EB',
          active: '#4A0820',
        },
        silver: {
          DEFAULT: '#A9A9A9',
          hover: '#B5B5B5',
          light: '#F1F1F1',
        },
        gold: {
          DEFAULT: '#B88A44',
          hover: '#CD9A4E',
          light: '#F8F4EC',
        },
        success: {
          DEFAULT: '#2E7D32',
          light: '#E8F5E9',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        neutral: {
          bg: '#F8F9FA',
          card: '#FFFFFF',
          text: '#111827',
          secondary: '#6B7280',
          border: '#E5E7EB',
        }
      }
    },
  },
  plugins: [],
}
