export default function Input({
  label,
  id,
  error,
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-secondary-foreground">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`rounded-card border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary-light
          transition-colors duration-150
          ${error ? 'border-status-error' : 'border-card-border'} ${className}`}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className="text-xs text-status-error">
          {error}
        </span>
      )}
    </div>
  );
}
