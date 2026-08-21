export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Cyberport-ish red accent + OMMAX-ish dark
        brand: {
          red: '#e2001a',
          dark: '#0b1020',
          panel: '#121a2e',
          line: '#22304f'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      keyframes: {
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
        pulseline: { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 1 } }
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        pulseline: 'pulseline 1.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
