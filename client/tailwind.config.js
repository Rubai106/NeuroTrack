export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        sage: {
          50:  '#f4f7f4',
          100: '#e6ede6',
          200: '#ccdccc',
          300: '#a5c1a5',
          400: '#74a074',
          500: '#4e844e',
          600: '#3d6b3d',
          700: '#325532',
          800: '#2a452a',
          900: '#243924',
        }
      }
    }
  },
  plugins: []
}
