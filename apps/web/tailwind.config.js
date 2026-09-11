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
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--c-line) / 0.8), 0 18px 50px rgb(0 0 0 / 0.35)',
      },
    },
  },
  plugins: [],
}
