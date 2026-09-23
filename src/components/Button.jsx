const VARIANTS = {
  primary: 'bg-[#4B5D3C] text-white hover:bg-[#3A492E] shadow-sm hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:bg-[#4B5D3C]/50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 border border-transparent',
  secondary: 'bg-white text-[#4B5D3C] border border-[#E2E9DF] hover:bg-[#E2E9DF]/40 shadow-sm hover:-translate-y-0.5 active:scale-[0.98] disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:translate-y-0',
  accent: 'bg-[#E2E9DF] text-[#3A492E] hover:bg-[#E2E9DF]/80 hover:-translate-y-0.5 active:scale-[0.98]',
  ghost: 'bg-transparent text-[#4B5D3C] hover:bg-[#E2E9DF]/40 active:scale-[0.98] disabled:text-slate-400',
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
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B5D3C] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50
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
