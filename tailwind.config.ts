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
          DEFAULT: '#47240a',
          dark: '#2A1D17',
        },
        secondary: {
          DEFAULT: '#F5DF4D',
          dark: '#E5CF3D',
        },
        accent: '#F5F3F3',
        background: '#FFFAF6',
        border: '#3D2A21',
        gold: '#D4AF37',
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        display: ['Kirang Haerang', 'cursive'],  
      },
      backgroundImage: {
        'notebook': "linear-gradient(transparent 80px, transparent 80px), repeating-linear-gradient(transparent, transparent 31px, #E8DDD3 31px, #E8DDD3 32px)",
      },
    },
  },
  plugins: [],
}
export default config
