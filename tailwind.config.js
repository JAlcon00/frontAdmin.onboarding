/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores usando CSS variables
        'background': 'var(--color-background)',
        'surface': {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          active: 'var(--color-surface-active)',
        },
        'sidebar': {
          bg: 'var(--color-sidebar-bg)',
          text: 'var(--color-sidebar-text)',
          'text-active': 'var(--color-sidebar-text-active)',
          'item-hover': 'var(--color-sidebar-item-hover)',
          'item-active': 'var(--color-sidebar-item-active)',
        },
        'header': {
          bg: 'var(--color-header-bg)',
          border: 'var(--color-header-border)',
          text: 'var(--color-header-text)',
        },
        'card': {
          DEFAULT: 'var(--color-card-bg)',
          border: 'var(--color-card-border)',
        },
        'text': {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        'input': {
          bg: 'var(--color-input-bg)',
          border: 'var(--color-input-border)',
          'border-focus': 'var(--color-input-border-focus)',
          text: 'var(--color-input-text)',
        },
        'table': {
          header: 'var(--color-table-header)',
          border: 'var(--color-table-border)',
          'row-hover': 'var(--color-table-row-hover)',
        },
        'modal': {
          bg: 'var(--color-modal-bg)',
          overlay: 'var(--color-modal-overlay)',
        },
      },
      boxShadow: {
        'card': 'var(--color-card-shadow)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Plugin personalizado para estados
    function({ addUtilities }) {
      const newUtilities = {
        '.bg-surface': {
          backgroundColor: 'var(--color-surface)',
        },
        '.bg-surface-hover:hover': {
          backgroundColor: 'var(--color-surface-hover)',
        },
        '.bg-card': {
          backgroundColor: 'var(--color-card-bg)',
        },
        '.border-card': {
          borderColor: 'var(--color-card-border)',
        },
        '.text-primary': {
          color: 'var(--color-text-primary)',
        },
        '.text-secondary': {
          color: 'var(--color-text-secondary)',
        },
        '.text-muted': {
          color: 'var(--color-text-muted)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
