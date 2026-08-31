const VARIANTS = {
  primary: 'bg-burgundy text-cream hover:bg-wine shadow-glow active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none border border-border',
  secondary: 'bg-surface2 text-cream border border-border hover:bg-burgundy/40 shadow-card active:scale-[0.98]',
  accent: 'bg-cream text-burgundy hover:bg-beige active:scale-[0.98]',
  ghost: 'bg-transparent text-beige hover:bg-surface2 hover:text-cream active:scale-[0.98]',
  danger: 'bg-status-error text-white hover:brightness-110 active:scale-[0.98]',
};

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-card px-4 py-2.5 text-sm font-semibold
        transition-all duration-150 disabled:cursor-not-allowed
        focus:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
