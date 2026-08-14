const VARIANTS = {
  primary: 'bg-primary-grad text-white hover:brightness-110 shadow-glow-primary active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none border border-primary-light/30',
  secondary: 'bg-secondary text-foreground border border-card-border hover:bg-secondary-hover hover:border-secondary-foreground/30 shadow-soft active:scale-[0.98]',
  accent: 'bg-accent text-accent-foreground hover:brightness-110 shadow-glow-accent active:scale-[0.98]',
  ghost: 'bg-transparent text-secondary-foreground hover:bg-secondary/60 hover:text-foreground active:scale-[0.98]',
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
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
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
