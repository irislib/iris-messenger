/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'neutral-999': '#010101',
      },
      textColor: {
        'iris-blue': '#1d9bf0',
        'iris-green': '#34ba7c',
        'iris-orange': '#ffa600',
        'iris-red': '#f81780',
        'iris-purple': '#8e44ad',
      },
      backgroundColor: {
        'iris-blue': '#1d9bf0',
        'iris-green': '#34ba7c',
        'iris-orange': '#ffa600',
        'iris-red': '#f81780',
        'iris-purple': '#8e44ad',
      },
      spacing: {
        px: '1px',
      },
    },
  },
  daisyui: {
    themes: [
      {
        iris: {
          'base-100': '#000000',
          'base-content': '#ffffff',
          primary: '#603285',
          secondary: '#8A4EBC',
          accent: '#BB97D8',
          neutral: '#ffffff',
          info: '#1d9bf0',
          success: '#34ba7c',
          warning: '#ffa600',
          error: '#f81780',
          blue: '#1d9bf0',
          green: '#34ba7c',
          orange: '#ffa600',
          red: '#f81780',
          purple: '#8e44ad',
        },
      },
    ],
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
};
