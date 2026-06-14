/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Vector Mode Legal brand palette (dark + gold)
        ink: '#0c0e12',
        panel: '#151922',
        panel2: '#1c2230',
        gold: '#c9a24b',
        goldlight: '#e3c97e',
        band: {
          green: '#3fae6a',
          yellow: '#c9a24b',
          orange: '#d98a3a',
          red: '#c4523f',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
