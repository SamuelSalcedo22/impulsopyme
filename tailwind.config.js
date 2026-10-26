/** Tailwind lee los colores y medidas desde los tokens semánticos (variables CSS). */
module.exports = {
  content: ['./public/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--s-color-background-base)',
        raised: 'var(--s-color-background-raised)',
        sunken: 'var(--s-color-background-sunken)',
        glass: 'var(--s-color-surface-glass)',
        'glass-strong': 'var(--s-color-surface-glass-strong)',
        'glass-border': 'var(--s-color-surface-glass-border)',
        ink: 'var(--s-color-text-primary)',
        'ink-2': 'var(--s-color-text-secondary)',
        'ink-muted': 'var(--s-color-text-muted)',
        positive: 'var(--s-color-text-positive)',
        negative: 'var(--s-color-text-negative)',
        warning: 'var(--s-color-text-warning)',
        ember: {
          DEFAULT: 'var(--s-color-action-primary)',
          hover: 'var(--s-color-action-primary-hover)',
          active: 'var(--s-color-action-primary-active)'
        },
        series: {
          1: 'var(--s-color-data-series-1)',
          2: 'var(--s-color-data-series-2)',
          3: 'var(--s-color-data-series-3)',
          4: 'var(--s-color-data-series-4)'
        }
      },
      fontFamily: {
        display: 'var(--g-font-display)',
        body: 'var(--g-font-body)'
      },
      borderRadius: {
        card: 'var(--s-radius-card)',
        control: 'var(--s-radius-control)',
        chip: 'var(--s-radius-chip)'
      },
      transitionDuration: { fast: 'var(--g-duration-fast)', base: 'var(--g-duration-base)' }
    }
  },
  plugins: []
};
