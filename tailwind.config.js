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

        // Indigo Scale (Primary Brand)
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
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
          DEFAULT: '#4F46E5',
          dark: '#4338CA',
          light: '#EEF2FF',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F1F5F9',
          foreground: '#334155',
          hover: '#E2E8F0',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          purple: '#8B5CF6',
          blue: '#3B82F6',
          emerald: '#10B981',
          foreground: '#FFFFFF',
          muted: 'rgba(139, 92, 246, 0.12)',
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
        'primary-grad': 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
        'ai-grad': 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
        'dark-surface': 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        'card-grad': 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
        'voice-grad': 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 60%, #F5F3FF 100%)',
        'hero-grad': 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #2563EB 100%)',
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
