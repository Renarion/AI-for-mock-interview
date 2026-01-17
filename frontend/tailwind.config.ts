import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom theme colors inspired by the visual reference
        primary: {
          DEFAULT: '#8B5CF6', // Vivid purple
          light: '#A78BFA',
          dark: '#7C3AED',
        },
        secondary: {
          DEFAULT: '#06B6D4', // Cyan
          light: '#22D3EE',
          dark: '#0891B2',
        },
        accent: {
          orange: '#F97316',
          pink: '#EC4899',
          teal: '#14B8A6',
        },
        background: {
          DEFAULT: '#0A0A0F',
          card: '#12121A',
          elevated: '#1A1A24',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        display: ['var(--font-clash)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 20s linear infinite',
        'sphere-pulse': 'sphere-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        'sphere-pulse': {
          '0%, 100%': { 
            transform: 'scale(1)',
            filter: 'brightness(1)',
          },
          '50%': { 
            transform: 'scale(1.05)',
            filter: 'brightness(1.2)',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config
