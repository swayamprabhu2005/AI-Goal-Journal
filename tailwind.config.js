/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A1A',
        foreground: '#F1F0FF',
        primary: {
          DEFAULT: '#6D28D9',
          dark: '#4C1D95',
          light: '#8B5CF6',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#1E1B4B',
          foreground: '#C4B5FD',
          hover: '#2E2A72',
        },
        accent: {
          DEFAULT: '#06B6D4',
          foreground: '#FFFFFF',
          muted: 'rgba(6, 182, 212, 0.15)',
        },
        muted: {
          DEFAULT: '#1A1A35',
          foreground: '#8B8AAD',
          border: '#282654',
        },
        card: {
          DEFAULT: '#13132B',
          elevated: '#1A1A3A',
          border: '#282654',
        },
        surface: {
          DEFAULT: '#101028',
          elevated: '#1E1B4B',
          border: '#2A275C',
        },
        status: {
          success: '#10B981',
          'success-bg': 'rgba(16, 185, 129, 0.12)',
          warning: '#F59E0B',
          'warning-bg': 'rgba(245, 158, 11, 0.12)',
          error: '#EF4444',
          'error-bg': 'rgba(239, 68, 68, 0.15)',
          info: '#06B6D4',
          'info-bg': 'rgba(6, 182, 212, 0.12)',
        }
      },
      backgroundImage: {
        'primary-grad': 'linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%)',
        'ai-grad': 'linear-gradient(135deg, #6D28D9 0%, #06B6D4 100%)',
        'dark-surface': 'linear-gradient(135deg, #0A0A1A 0%, #1E1B4B 100%)',
        'card-grad': 'linear-gradient(145deg, #161536 0%, #101026 100%)',
        'soft-purple-grad': 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
        'voice-grad': 'linear-gradient(135deg, #161536 0%, #1A1A42 60%, #141432 100%)',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
        'glow-primary': '0 0 25px -5px rgba(109, 40, 217, 0.4)',
        'glow-accent': '0 0 20px -5px rgba(6, 182, 212, 0.35)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}
