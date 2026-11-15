module.exports = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        moss: 'rgb(var(--c-moss) / <alpha-value>)',
        fern: 'rgb(var(--c-fern) / <alpha-value>)',
        mist: 'rgb(var(--c-mist) / <alpha-value>)',
        sand: 'rgb(var(--c-sand) / <alpha-value>)',
        citrus: 'rgb(var(--c-citrus) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-ui)'],
        accent: ['var(--font-mono)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        offset: 'var(--shadow-offset)',
        ticket: 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
}
