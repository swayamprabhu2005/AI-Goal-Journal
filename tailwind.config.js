/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Slate Backgrounds & Foregrounds
        background: '#F8FAFC',
        foreground: '#0F172A',
        text: '#0F172A',
        cream: '#0F172A',
        beige: '#64748B',
        burgundy: '#4F46E5',
        wine: '#4338CA',
        border: '#E2E8F0',

        // Moss Scale (Primary Brand)
        moss: {
          50: '#f6fbee', // background light
          100: '#ebf0e3', // border/hover
          200: '#dfe4d8', // line
          300: '#b9cdaa',
          400: '#8fa87a',
          500: '#698154', // medium
          600: '#526347', 
          700: '#46553b', // primary button
          800: '#3a4632',
          900: '#2e3728',
        },

        // Slate Neutrals Scale
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },

        primary: {
          DEFAULT: '#46553b',
          dark: '#3a4632',
          light: '#f6fbee',
          foreground: '#FFFFFF',
          container: '#f6fbee',
        },
        secondary: {
          DEFAULT: '#ebf0e3',
          foreground: '#46553b',
          hover: '#dfe4d8',
          container: '#ebf0e3',
        },
        accent: {
          DEFAULT: '#698154',
          purple: '#698154',
          blue: '#526347',
          emerald: '#46553b',
          foreground: '#FFFFFF',
          muted: 'rgba(70, 85, 59, 0.12)',
        },
        muted: {
          DEFAULT: '#F8FAFC',
          foreground: '#64748B',
          border: '#E2E8F0',
        },
        card: {
          DEFAULT: '#FFFFFF',
          elevated: '#FFFFFF',
          border: '#E2E8F0',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          surface2: '#F8FAFC',
          elevated: '#FFFFFF',
          border: '#E2E8F0',
        },
        status: {
          success: '#10B981',
          'success-bg': '#ECFDF5',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          error: '#EF4444',
          'error-bg': '#FEF2F2',
          info: '#3B82F6',
          'info-bg': '#EFF6FF',
          paused: '#64748B',
          'paused-bg': '#F1F5F9',
        }
      },
      backgroundImage: {
        'primary-grad': 'linear-gradient(135deg, #526347 0%, #46553b 100%)',
        'ai-grad': 'linear-gradient(135deg, #f6fbee 0%, #ebf0e3 100%)',
        'dark-surface': 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        'card-grad': 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
        'voice-grad': 'linear-gradient(135deg, #f6fbee 0%, #ebf0e3 60%, #dfe4d8 100%)',
        'hero-grad': 'linear-gradient(135deg, #526347 0%, #46553b 50%, #b9cdaa 100%)',
      },
      fontFamily: {
        serif: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        panel: '18px',
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        glow: '0 10px 25px -5px rgba(79, 70, 229, 0.15)',
        'glow-primary': '0 0 25px -5px rgba(79, 70, 229, 0.3)',
        soft: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
}
