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
          DEFAULT: '#5F423D',
          dark: '#4a3430',
        },
        secondary: {
          DEFAULT: '#FFE5F1',
          dark: '#ffd6e8',
        },
        accent: '#F5F3F3',
        background: '#FFE5F1',
      },
      fontFamily: {
        sans: ['elza-text', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
