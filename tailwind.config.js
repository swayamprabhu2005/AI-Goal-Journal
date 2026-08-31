/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        foreground: '#0F172A',
        text: '#0F172A',
        cream: '#0F172A',
        beige: '#475569',
        burgundy: '#0F766E',
        wine: '#0D9488',
        border: '#E2E8F0',
        
        primary: {
          DEFAULT: '#0F766E',
          dark: '#115E59',
          light: '#14B8A6',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F1F5F9',
          foreground: '#0F172A',
          hover: '#E2E8F0',
        },
        accent: {
          DEFAULT: '#0F766E',
          foreground: '#FFFFFF',
          muted: 'rgba(15, 118, 110, 0.12)',
        },
        muted: {
          DEFAULT: '#F1F5F9',
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
          'success-bg': 'rgba(16, 185, 129, 0.12)',
          warning: '#F59E0B',
          'warning-bg': 'rgba(245, 158, 11, 0.12)',
          error: '#EF4444',
          'error-bg': 'rgba(239, 68, 68, 0.15)',
          info: '#0F766E',
          'info-bg': 'rgba(15, 118, 110, 0.12)',
        }
      },
      backgroundImage: {
        'primary-grad': 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
        'ai-grad': 'linear-gradient(135deg, #0F766E 0%, #047857 100%)',
        'dark-surface': 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        'card-grad': 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
        'voice-grad': 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 60%, #F8FAFC 100%)',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        panel: '18px',
        card: '14px',
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
        glow: '0 8px 30px rgba(15, 118, 110, 0.12)',
        'glow-primary': '0 0 25px -5px rgba(15, 118, 110, 0.25)',
      },
    },
  },
  plugins: [],
}
