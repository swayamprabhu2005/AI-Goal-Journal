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
        <label htmlFor={id} className="text-xs font-semibold text-beige/70">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input-dark px-3.5 py-2.5 text-sm text-cream placeholder:text-beige/40
          transition-colors duration-150
          ${error ? 'border-status-error' : 'border-border'} ${className}`}
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
