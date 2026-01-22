import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A1923',
          dark: '#3e3d56',
        },
        secondary: {
          DEFAULT: '#bec67a',
          dark: '#a8b065',
        },
        accent: '#F5F3F3',
        background: '#bec67a',
      },
      fontFamily: {
        sans: ['elza-text', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
