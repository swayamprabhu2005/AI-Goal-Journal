const VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:bg-indigo-300 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 border border-transparent',
  secondary: 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50/60 shadow-sm hover:-translate-y-0.5 active:scale-[0.98] disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:translate-y-0',
  accent: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:-translate-y-0.5 active:scale-[0.98]',
  ghost: 'bg-transparent text-indigo-600 hover:bg-indigo-50/60 active:scale-[0.98] disabled:text-slate-400',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm hover:-translate-y-0.5 active:scale-[0.98] disabled:bg-red-300 disabled:translate-y-0',
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold
        transition-all duration-200 disabled:cursor-not-allowed
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50
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
