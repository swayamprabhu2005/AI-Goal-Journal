export default function Input({
  label,
  id,
  error,
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-slate-800">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input-field px-4.5 py-3.5 text-base text-slate-900 placeholder:text-slate-400 bg-white border border-slate-200 rounded-2xl
          transition-all duration-150 focus:border-[#4B5D3C] focus:ring-4 focus:ring-[#E2E9DF]
          ${error ? 'border-red-500 focus:ring-red-100' : 'border-slate-200'} ${className}`}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className="text-xs font-semibold text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}
