/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  safelist: [
    // Clases de colores para los estados de órdenes
    'bg-blue-50', 'text-blue-700', 'border-blue-200', 'text-blue-600',
    'bg-purple-50', 'text-purple-700', 'border-purple-200', 'text-purple-600',
    'bg-indigo-50', 'text-indigo-700', 'border-indigo-200', 'text-indigo-600',
    'bg-orange-50', 'text-orange-700', 'border-orange-200', 'text-orange-600',
    'bg-green-50', 'text-green-700', 'border-green-200', 'text-green-600',
    'bg-emerald-50', 'text-emerald-700', 'border-emerald-200', 'text-emerald-600',
    'bg-red-50', 'text-red-700', 'border-red-200', 'text-red-600',
    // Clases para barras de progreso
    'w-1/7', 'w-2/7', 'w-3/7', 'w-4/7', 'w-5/7', 'w-6/7',
    'bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-orange-500', 
    'bg-green-500', 'bg-emerald-500', 'bg-green-600', 'bg-red-500'
  ]
} 